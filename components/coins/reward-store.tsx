"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Gift, 
  ShoppingCart, 
  Coins, 
  Crown, 
  Star,
  CreditCard,
  GraduationCap,
  Briefcase,
  Laptop,
  ShoppingBag,
  Sparkles,
  Check,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface RewardItem {
  id: number
  name: string
  description: string
  category: string
  refcoin_cost?: number
  premium_token_cost?: number
  usd_value?: number
  is_available: boolean
  stock_quantity?: number
  image_url?: string
  featured: boolean
}

interface Purchase {
  id: number
  reward_item: RewardItem
  refcoin_cost?: number
  premium_token_cost?: number
  status: string
  fulfillment_data?: any
  created_at: string
}

interface WalletData {
  refcoin_balance: number
  premium_token_balance: number
}

interface RewardStoreProps {
  walletData?: WalletData
  onWalletUpdate?: () => void
}

const categoryIcons = {
  platform_features: Laptop,
  gift_cards: ShoppingBag,
  courses: GraduationCap,
  tools: Briefcase,
  career_development: Star
}

const categoryLabels = {
  platform_features: 'Platform Features',
  gift_cards: 'Gift Cards',
  courses: 'Courses',
  tools: 'Tools',
  career_development: 'Career Development'
}

export default function RewardStore({ walletData, onWalletUpdate }: RewardStoreProps) {
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('featured')
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPurchases, setShowPurchases] = useState(false)
  const { toast } = useToast()
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchRewards()
    fetchPurchases()
  }, [])

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/rewards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRewards(data)
      } else {
        throw new Error('Failed to fetch rewards')
      }
    } catch (error) {
      console.error('Error fetching rewards:', error)
      toast({
        title: "Error",
        description: "Failed to load rewards",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/rewards/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPurchases(data)
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }

  const purchaseReward = async (rewardId: number) => {
    setPurchasing(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/rewards/${rewardId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Purchase Successful! 🎉",
          description: `You've purchased ${selectedReward?.name}`,
        })
        setSelectedReward(null)
        fetchPurchases()
        onWalletUpdate?.()
      } else {
        const error = await response.json()
        toast({
          title: "Purchase Failed",
          description: error.detail,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete purchase",
        variant: "destructive"
      })
    } finally {
      setPurchasing(false)
    }
  }

  const canAfford = (reward: RewardItem) => {
    if (!walletData) return false
    
    const refcoinAffordable = !reward.refcoin_cost || walletData.refcoin_balance >= reward.refcoin_cost
    const tokenAffordable = !reward.premium_token_cost || walletData.premium_token_balance >= reward.premium_token_cost
    
    return refcoinAffordable && tokenAffordable
  }

  const filteredRewards = rewards.filter(reward => {
    if (!reward.is_available) return false
    
    // Search filter
    if (searchTerm && !reward.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !reward.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    // Category filter
    if (activeTab === 'featured') return reward.featured
    if (activeTab === 'all') return true
    return reward.category === activeTab
  })

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="h-8 w-8 text-blue-600" />
            Reward Store
          </h1>
          <p className="text-gray-600 mt-1">Redeem your coins for amazing rewards</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={showPurchases ? "default" : "outline"}
            onClick={() => setShowPurchases(!showPurchases)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            My Purchases
          </Button>
        </div>
      </div>

      {/* Wallet Summary */}
      {walletData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-900">RefCoins</span>
                </div>
                <span className="text-xl font-bold text-amber-900">
                  {formatNumber(walletData.refcoin_balance)}
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Premium Tokens</span>
                </div>
                <span className="text-xl font-bold text-purple-900">
                  {formatNumber(walletData.premium_token_balance)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search rewards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Purchases View */}
      {showPurchases ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Purchases</h2>
          {purchases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h3>
                <p className="text-gray-500 mb-4">Start shopping to see your purchase history here.</p>
                <Button onClick={() => setShowPurchases(false)}>
                  Browse Rewards
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {purchases.map((purchase) => (
                <Card key={purchase.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{purchase.reward_item.name}</CardTitle>
                      <Badge 
                        className={
                          purchase.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                          purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {purchase.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{purchase.reward_item.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {purchase.refcoin_cost && (
                          <div className="flex items-center gap-1">
                            <Coins className="h-4 w-4 text-amber-600" />
                            <span>{purchase.refcoin_cost}</span>
                          </div>
                        )}
                        {purchase.premium_token_cost && (
                          <div className="flex items-center gap-1">
                            <Crown className="h-4 w-4 text-purple-600" />
                            <span>{purchase.premium_token_cost}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-gray-500">
                        {new Date(purchase.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Rewards Catalog */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="platform_features">Platform</TabsTrigger>
            <TabsTrigger value="gift_cards">Gift Cards</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredRewards.map((reward, index) => {
                  const CategoryIcon = categoryIcons[reward.category as keyof typeof categoryIcons] || Gift
                  const affordable = canAfford(reward)

                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className={`
                          hover:shadow-lg transition-all duration-300 cursor-pointer
                          ${reward.featured ? 'ring-2 ring-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50' : ''}
                          ${!affordable ? 'opacity-75' : ''}
                        `}
                        onClick={() => setSelectedReward(reward)}
                      >
                        {reward.featured && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Featured
                            </div>
                          </div>
                        )}

                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <CategoryIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg line-clamp-2">{reward.name}</CardTitle>
                              <Badge variant="outline" className="mt-1 text-xs">
                                {categoryLabels[reward.category as keyof typeof categoryLabels]}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{reward.description}</p>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              {reward.refcoin_cost && (
                                <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                                  <Coins className="h-4 w-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-900">
                                    {formatNumber(reward.refcoin_cost)}
                                  </span>
                                </div>
                              )}
                              {reward.premium_token_cost && (
                                <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full">
                                  <Crown className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-900">
                                    {reward.premium_token_cost}
                                  </span>
                                </div>
                              )}
                            </div>

                            {reward.usd_value && (
                              <div className="text-xs text-gray-500">
                                Value: ${reward.usd_value.toFixed(2)}
                              </div>
                            )}

                            <Button 
                              className={`w-full ${affordable ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                              disabled={!affordable}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedReward(reward)
                              }}
                            >
                              {affordable ? (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Purchase
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Insufficient Coins
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {filteredRewards.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Check back later for new rewards!'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>
              You're about to purchase "{selectedReward?.name}"
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{selectedReward.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedReward.description}</p>
                
                <div className="flex items-center gap-2">
                  {selectedReward.refcoin_cost && (
                    <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                      <Coins className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium">{selectedReward.refcoin_cost}</span>
                    </div>
                  )}
                  {selectedReward.premium_token_cost && (
                    <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full">
                      <Crown className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">{selectedReward.premium_token_cost}</span>
                    </div>
                  )}
                </div>
              </div>

              {walletData && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Your RefCoins:</span>
                    <span className="font-medium">{formatNumber(walletData.refcoin_balance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Your Premium Tokens:</span>
                    <span className="font-medium">{walletData.premium_token_balance}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedReward(null)}
              disabled={purchasing}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedReward && purchaseReward(selectedReward.id)}
              disabled={purchasing || (selectedReward ? !canAfford(selectedReward) : false)}
            >
              {purchasing ? (
                "Processing..."
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 