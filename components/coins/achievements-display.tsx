"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, 
  Star, 
  Coins, 
  Crown, 
  Target,
  Users,
  User,
  BookOpen,
  Sparkles,
  CheckCircle,
  Clock,
  Gift
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface Achievement {
  id: number
  code: string
  name: string
  description: string
  achievement_type: string
  icon?: string
  reward_refcoins: number
  reward_premium_tokens: number
  rarity: string
  is_completed: boolean
  progress: number
  max_progress: number
  completed_at?: string
}

interface AchievementsDisplayProps {
  onClose?: () => void
}

const rarityColors = {
  common: {
    bg: 'from-gray-100 to-gray-200',
    border: 'border-gray-300',
    text: 'text-gray-700',
    badge: 'bg-gray-100 text-gray-800'
  },
  uncommon: {
    bg: 'from-green-100 to-emerald-200',
    border: 'border-green-300',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800'
  },
  rare: {
    bg: 'from-blue-100 to-blue-200',
    border: 'border-blue-300',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  epic: {
    bg: 'from-purple-100 to-purple-200',
    border: 'border-purple-300',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  legendary: {
    bg: 'from-yellow-100 to-amber-200',
    border: 'border-yellow-400',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800'
  }
}

const typeIcons = {
  profile: User,
  referral: Target,
  networking: Users,
  learning: BookOpen,
  mentorship: Trophy,
  interview: Sparkles
}

export default function AchievementsDisplay({ onClose }: AchievementsDisplayProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const { toast } = useToast()

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${apiBaseUrl}/coins/achievements`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      } else {
        throw new Error('Failed to fetch achievements')
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'all') return true
    if (filter === 'completed') return achievement.is_completed
    if (filter === 'progress') return !achievement.is_completed && achievement.progress > 0
    if (filter === 'locked') return !achievement.is_completed && achievement.progress === 0
    return achievement.achievement_type === filter
  })

  const completedCount = achievements.filter(a => a.is_completed).length
  const totalRewardsEarned = achievements
    .filter(a => a.is_completed)
    .reduce((total, a) => total + a.reward_refcoins + (a.reward_premium_tokens * 10), 0)

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  const getProgressPercentage = (progress: number, maxProgress: number) => {
    return Math.min((progress / maxProgress) * 100, 100)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
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
      {/* Header Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{completedCount}</div>
                <div className="text-sm text-blue-700">Achievements Unlocked</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-emerald-900">
                  {Math.round((completedCount / achievements.length) * 100)}%
                </div>
                <div className="text-sm text-emerald-700">Completion Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Coins className="h-8 w-8 text-amber-600" />
              <div>
                <div className="text-2xl font-bold text-amber-900">{totalRewardsEarned}</div>
                <div className="text-sm text-amber-700">Coins Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="progress">In Progress</TabsTrigger>
          <TabsTrigger value="locked">Locked</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="referral">Referral</TabsTrigger>
          <TabsTrigger value="networking">Network</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredAchievements.map((achievement, index) => {
                const rarity = rarityColors[achievement.rarity as keyof typeof rarityColors] || rarityColors.common
                const TypeIcon = typeIcons[achievement.achievement_type as keyof typeof typeIcons] || Trophy
                const progressPercentage = getProgressPercentage(achievement.progress, achievement.max_progress)

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`
                        bg-gradient-to-br ${rarity.bg} ${rarity.border} 
                        hover:shadow-lg transition-all duration-300
                        ${achievement.is_completed ? 'ring-2 ring-green-300' : ''}
                      `}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg bg-white/50 ${rarity.text}`}>
                              {achievement.icon ? (
                                <span className="text-xl">{achievement.icon}</span>
                              ) : (
                                <TypeIcon className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <CardTitle className={`text-lg ${rarity.text}`}>
                                {achievement.name}
                              </CardTitle>
                              <Badge className={`mt-1 ${rarity.badge} capitalize`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                          </div>
                          {achievement.is_completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                            >
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </motion.div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-4">
                          <p className={`text-sm ${rarity.text}`}>
                            {achievement.description}
                          </p>

                          {/* Progress Bar */}
                          {!achievement.is_completed && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className={rarity.text}>Progress</span>
                                <span className={rarity.text}>
                                  {achievement.progress}/{achievement.max_progress}
                                </span>
                              </div>
                              <Progress 
                                value={progressPercentage} 
                                className="h-2"
                              />
                            </div>
                          )}

                          {/* Rewards */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              {achievement.reward_refcoins > 0 && (
                                <div className="flex items-center gap-1">
                                  <Coins className="h-4 w-4 text-amber-600" />
                                  <span className="font-medium">{achievement.reward_refcoins}</span>
                                </div>
                              )}
                              {achievement.reward_premium_tokens > 0 && (
                                <div className="flex items-center gap-1">
                                  <Crown className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium">{achievement.reward_premium_tokens}</span>
                                </div>
                              )}
                            </div>

                            {achievement.is_completed && achievement.completed_at && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Clock className="h-3 w-3" />
                                {formatDate(achievement.completed_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
              <p className="text-gray-500">
                {filter === 'completed' && 'You haven\'t completed any achievements yet.'}
                {filter === 'progress' && 'No achievements in progress.'}
                {filter === 'locked' && 'All achievements are unlocked or completed!'}
                {!['completed', 'progress', 'locked'].includes(filter) && 'Try a different filter.'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Achievement Tips */}
      {!loading && achievements.some(a => !a.is_completed) && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Sparkles className="h-5 w-5" />
              Achievement Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Gift className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <div className="font-medium text-indigo-900">Complete Your Profile</div>
                  <div className="text-sm text-indigo-700">
                    Fill out all profile fields to unlock the Profile Master achievement.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <div className="font-medium text-indigo-900">Network Actively</div>
                  <div className="text-sm text-indigo-700">
                    Connect with employees to unlock networking achievements.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 