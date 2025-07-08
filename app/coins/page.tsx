"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Coins, 
  Trophy, 
  Gift, 
  TrendingUp, 
  History,
  ShoppingCart,
  Crown,
  Sparkles,
  BarChart3,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

// Import our coins components
import WalletDisplay from '@/components/coins/wallet-display'
import AchievementsDisplay from '@/components/coins/achievements-display'
import RewardStore from '@/components/coins/reward-store'

interface WalletData {
  refcoin_balance: number
  premium_token_balance: number
  total_earned_refcoins: number
  total_spent_refcoins: number
  total_earned_premium_tokens: number
  total_spent_premium_tokens: number
  refcoin_usd_value: number
  premium_token_usd_value: number
}

interface Transaction {
  id: number
  transaction_type: string
  coin_type: string
  amount: number
  balance_after: number
  status: string
  source: string
  description?: string
  created_at: string
}

export default function CoinsPage() {
  const [activeTab, setActiveTab] = useState('wallet')
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchWalletData()
    fetchRecentTransactions()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWalletData(data)
      } else {
        throw new Error('Failed to fetch wallet data')
      }
    } catch (error) {
      console.error('Error fetching wallet:', error)
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/wallet/transactions?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRecentTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTransactionIcon = (source: string) => {
    switch (source) {
      case 'daily_login': return <Zap className="h-4 w-4 text-green-600" />
      case 'achievement': return <Trophy className="h-4 w-4 text-blue-600" />
      case 'reward_purchase': return <ShoppingCart className="h-4 w-4 text-purple-600" />
      default: return <Coins className="h-4 w-4 text-amber-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <Coins className="h-8 w-8" />
                </div>
                Coins & Rewards
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Earn, collect, and redeem your way to success
              </p>
            </div>

            {walletData && (
              <div className="hidden md:flex gap-4">
                <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-600" />
                      <div>
                        <div className="text-sm font-medium text-amber-900">RefCoins</div>
                        <div className="text-xl font-bold text-amber-900">
                          {formatNumber(walletData.refcoin_balance)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium text-purple-900">Premium Tokens</div>
                        <div className="text-xl font-bold text-purple-900">
                          {walletData.premium_token_balance}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        {walletData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid gap-4 md:grid-cols-4 mb-8"
          >
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-700">Total Earned</div>
                    <div className="text-2xl font-bold text-green-900">
                      {formatNumber(walletData.total_earned_refcoins + walletData.total_earned_premium_tokens)}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-700">Total Value</div>
                    <div className="text-2xl font-bold text-blue-900">
                      ${(walletData.refcoin_usd_value + walletData.premium_token_usd_value).toFixed(2)}
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-orange-700">Total Spent</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {formatNumber(walletData.total_spent_refcoins + walletData.total_spent_premium_tokens)}
                    </div>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-700">Recent Activity</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {recentTransactions.length}
                    </div>
                  </div>
                  <History className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/50 backdrop-blur-sm border">
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Wallet
              </TabsTrigger>
              <TabsTrigger value="achievements" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="store" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Reward Store
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="wallet" className="mt-0">
              <WalletDisplay
                onViewTransactions={() => setActiveTab('activity')}
                onViewRewards={() => setActiveTab('store')}
                onViewAchievements={() => setActiveTab('achievements')}
              />
            </TabsContent>

            <TabsContent value="achievements" className="mt-0">
              <AchievementsDisplay />
            </TabsContent>

            <TabsContent value="store" className="mt-0">
              <RewardStore 
                walletData={walletData || undefined} 
                onWalletUpdate={fetchWalletData}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Recent Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentTransactions.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                        <p className="text-gray-500">Your transaction history will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {getTransactionIcon(transaction.source)}
                              <div>
                                <div className="font-medium">
                                  {transaction.description || transaction.source.replace('_', ' ')}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDate(transaction.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-medium ${transaction.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.amount}
                                <span className="text-sm ml-1">
                                  {transaction.coin_type === 'refcoin' ? 'RC' : 'PT'}
                                </span>
                              </div>
                              <Badge
                                className={
                                  transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        
                        <div className="text-center pt-4">
                          <Button variant="outline">
                            View All Transactions
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-medium text-indigo-900">Keep Earning!</h3>
              </div>
              <p className="text-indigo-700 mb-4">
                Complete your profile, make referrals, and engage with the community to earn more coins.
              </p>
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('achievements')}
                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                >
                  View Achievements
                </Button>
                <Button 
                  onClick={() => setActiveTab('store')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Browse Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
} 