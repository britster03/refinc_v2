"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Coins, 
  Crown, 
  TrendingUp, 
  Eye, 
  History, 
  Gift,
  Target,
  Zap,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

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

interface EarningOpportunity {
  source: string
  description: string
  potential_refcoins: number
  potential_premium_tokens: number
  action_url?: string
  is_available: boolean
}

interface WalletDisplayProps {
  onViewTransactions?: () => void
  onViewRewards?: () => void
  onViewAchievements?: () => void
}

export default function WalletDisplay({ 
  onViewTransactions, 
  onViewRewards, 
  onViewAchievements 
}: WalletDisplayProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [opportunities, setOpportunities] = useState<EarningOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showOpportunities, setShowOpportunities] = useState(false)
  const { toast } = useToast()

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchWalletData()
    fetchEarningOpportunities()
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

  const fetchEarningOpportunities = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/wallet/earning-opportunities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOpportunities(data)
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    }
  }

  const claimDailyLogin = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/earn/daily-login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Daily Bonus Claimed! 🎉",
          description: `You earned ${data.bonus_amount} RefCoins!`,
        })
        fetchWalletData() // Refresh wallet
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.detail,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim daily bonus",
        variant: "destructive"
      })
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!walletData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load wallet data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Wallet Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* RefCoins Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Coins className="h-5 w-5" />
                RefCoins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <motion.div 
                  className="text-3xl font-bold text-amber-900"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                >
                  {formatNumber(walletData.refcoin_balance)}
                </motion.div>
                <div className="text-sm text-amber-700">
                  ≈ ${walletData.refcoin_usd_value.toFixed(2)} USD
                </div>
                <div className="flex justify-between text-xs text-amber-600">
                  <span>Earned: {formatNumber(walletData.total_earned_refcoins)}</span>
                  <span>Spent: {formatNumber(walletData.total_spent_refcoins)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Tokens Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Crown className="h-5 w-5" />
                Premium Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <motion.div 
                  className="text-3xl font-bold text-purple-900"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.8, delay: 0.1 }}
                >
                  {formatNumber(walletData.premium_token_balance)}
                </motion.div>
                <div className="text-sm text-purple-700">
                  ≈ ${walletData.premium_token_usd_value.toFixed(2)} USD
                </div>
                <div className="flex justify-between text-xs text-purple-600">
                  <span>Earned: {formatNumber(walletData.total_earned_premium_tokens)}</span>
                  <span>Spent: {formatNumber(walletData.total_spent_premium_tokens)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Total Value Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Total Wallet Value</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${(walletData.refcoin_usd_value + walletData.premium_token_usd_value).toFixed(2)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onViewTransactions}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onViewRewards}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Store
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button 
                onClick={claimDailyLogin}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Target className="h-4 w-4 mr-2" />
                Daily Login
              </Button>
              <Button 
                variant="outline"
                onClick={onViewAchievements}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Achievements
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowOpportunities(!showOpportunities)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Earn More
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Earning Opportunities */}
      <AnimatePresence>
        {showOpportunities && opportunities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <TrendingUp className="h-5 w-5" />
                  Earning Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {opportunities.map((opportunity, index) => (
                    <motion.div
                      key={opportunity.source}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200"
                    >
                      <div>
                        <div className="font-medium text-emerald-900">{opportunity.description}</div>
                        <div className="text-sm text-emerald-700">
                          Earn {opportunity.potential_refcoins} RC
                          {opportunity.potential_premium_tokens > 0 && 
                            ` + ${opportunity.potential_premium_tokens} PT`
                          }
                        </div>
                      </div>
                      {opportunity.action_url && (
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => window.location.href = opportunity.action_url!}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 