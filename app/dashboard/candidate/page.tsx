"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import DashboardWrapper from "@/components/dashboard-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FormattedDate } from "@/components/ui/formatted-date"
import { ArrowRight, Clock, CheckCircle, XCircle, FileText, Users, TrendingUp, Star, Loader2, AlertCircle, Eye, Brain, Target, Award, ArrowUpRight, Plus, Search, Filter, Sparkles, Zap, BarChart3, Calendar, ChevronDown, X, Settings, Wand2, RefreshCw, MessageSquare } from "lucide-react"
import Link from "next/link"
import { ReferralAPI, type Referral } from "@/lib/api/referrals"
import { EmployeeAPI, type Employee } from "@/lib/api/employees"
import { authClient } from "@/lib/auth"
import { motion, AnimatePresence } from "framer-motion"
import ClientOnly from "@/components/client-only"
import { getMyOptimalMatches, getPersonalizedMatches, getCachedSmartMatches, cacheSmartMatches, getCachedCustomizedMatches, cacheCustomizedMatches, type MatchedEmployee } from "@/lib/ai-utils"

interface DashboardMetrics {
  totalReferrals: number
  acceptedReferrals: number
  pendingReferrals: number
  rejectedReferrals: number
  reviewingReferrals: number
  interviewScheduledReferrals: number
  acceptanceRate: number
  lastMonthReferrals: number
  thisMonthReferrals: number
}

interface DashboardData {
  metrics: DashboardMetrics
  recentReferrals: Referral[]
  recommendedEmployees: MatchedEmployee[]
}

// Floating background elements for sleekness
const FloatingElements = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-slate-100/30 to-slate-200/20 dark:from-slate-800/30 dark:to-slate-700/20 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ top: "10%", left: "5%" }}
      />
      
      <motion.div
        className="absolute w-80 h-80 bg-gradient-to-r from-slate-50/20 to-slate-100/15 dark:from-slate-900/20 dark:to-slate-800/15 rounded-full blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        style={{ top: "60%", right: "5%" }}
      />

      {/* Floating dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-slate-300/40 dark:bg-slate-600/40 rounded-full"
          animate={{
            y: [0, -10, 0],
            x: [0, 5, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
          style={{
            top: `${20 + i * 12}%`,
            right: `${10 + i * 8}%`,
          }}
        />
      ))}
    </div>
  )
}

// Enhanced metric card with sleek effects
const MetricCard = ({ title, value, subtitle, icon: Icon, trend, delay = 0 }: {
  title: string
  value: string | number
  subtitle: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
  delay?: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 hover:border-slate-300/80 dark:hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300">
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className="p-3 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl group-hover:bg-slate-100/80 dark:group-hover:bg-slate-750/80 transition-colors duration-200"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </motion.div>
            {trend && (
              <motion.div 
                className={`text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm ${
                  trend === 'up' ? 'bg-emerald-50/80 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  trend === 'down' ? 'bg-red-50/80 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-slate-50/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400'
                }`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
              </motion.div>
            )}
          </div>
          <div className="space-y-1">
            <motion.h3 
              className="text-2xl font-semibold text-slate-900 dark:text-white"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.2, type: "spring" }}
            >
              {value}
            </motion.h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {title}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Sleek corner accent */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-100/20 to-transparent dark:from-slate-700/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </motion.div>
  )
}

// Enhanced action button with sleek hover effects
const ActionButton = ({ href, icon: Icon, title, description, delay = 0 }: {
  href: string
  icon: any
  title: string
  description: string
  delay?: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href}>
        <div className="group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 hover:border-slate-300/80 dark:hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300 cursor-pointer overflow-hidden">
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-slate-50/30 via-transparent to-slate-50/30 dark:from-slate-800/30 dark:via-transparent dark:to-slate-800/30"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6 }}
          />
          
          <div className="relative z-10 flex items-start gap-4">
            <motion.div 
              className="p-3 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl group-hover:bg-slate-100/80 dark:group-hover:bg-slate-750/80 transition-colors duration-200"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Icon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                {description}
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Enhanced tab trigger with sleek styling
const EnhancedTabsTrigger = ({ value, children, isActive }: { value: string, children: React.ReactNode, isActive: boolean }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative"
    >
      <TabsTrigger 
        value={value}
        className="relative bg-transparent data-[state=active]:bg-white/80 dark:data-[state=active]:bg-slate-900/80 data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm border-0 data-[state=active]:border data-[state=active]:border-slate-200/60 dark:data-[state=active]:border-slate-800/60"
      >
        {children}
        {isActive && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-600 to-slate-800 dark:from-slate-400 dark:to-slate-200 rounded-full"
            layoutId="activeTab"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </TabsTrigger>
    </motion.div>
  )
}

export default function CandidateDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("recent")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterCompany, setFilterCompany] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set())
  const [matchingMode, setMatchingMode] = useState<'smart' | 'customized'>('smart')
  const [customizedMatches, setCustomizedMatches] = useState<MatchedEmployee[]>([])
  const [showCustomizationForm, setShowCustomizationForm] = useState(false)
  const [customizationLoading, setCustomizationLoading] = useState(false)
  // New state for Smart Matching refresh control
  const [smartMatches, setSmartMatches] = useState<MatchedEmployee[]>([])
  const [smartMatchingLoading, setSmartMatchingLoading] = useState(false)
  const [smartMatchingLoaded, setSmartMatchingLoaded] = useState(false)
  const [smartMatchesCached, setSmartMatchesCached] = useState(false)
  const [customizedMatchesCached, setCustomizedMatchesCached] = useState(false)
  const [customizationPrefs, setCustomizationPrefs] = useState({
    targetCompany: '',
    targetRole: '',
    priorityFocus: 'balanced', // 'skills', 'performance', 'mentorship', 'balanced'
    experienceLevel: 'any', // 'junior', 'senior', 'executive', 'any'
    industryPreference: '',
    specificSkills: '',
    responseTimeImportance: 'medium', // 'low', 'medium', 'high'
    additionalRequirements: ''
  })

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user
        const currentUser = authClient.getSession()?.user
        if (!currentUser) {
          throw new Error("User not authenticated")
        }
        setUser(currentUser)

        // Fetch referrals data
        const referralsData = await ReferralAPI.getReferrals({ limit: 50 })

        // Calculate metrics
        const metrics = calculateMetrics(referralsData.referrals)

        // Get recent referrals (last 5)
        const recentReferrals = referralsData.referrals
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)

        // Try to load cached Smart Matches
        try {
          const cachedMatches = await getCachedSmartMatches()
          if (cachedMatches.success && cachedMatches.matches.length > 0) {
            setSmartMatches(cachedMatches.matches)
            setSmartMatchingLoaded(true)
            setSmartMatchesCached(true)
            console.log(`✅ Loaded ${cachedMatches.matches.length} cached Smart Matches`)
          }
        } catch (cacheError) {
          console.log('No cached Smart Matches found - will show empty state')
        }

        setDashboardData({
          metrics,
          recentReferrals,
          recommendedEmployees: [] // Legacy field - not used anymore
        })

      } catch (err) {
        console.error("Dashboard initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [])

  const calculateMetrics = (referrals: Referral[]): DashboardMetrics => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const statusCounts = referrals.reduce((acc, referral) => {
      acc[referral.status] = (acc[referral.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const thisMonthReferrals = referrals.filter(referral => {
      const date = new Date(referral.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }).length

    const lastMonthReferrals = referrals.filter(referral => {
      const date = new Date(referral.created_at)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    }).length

    const acceptedCount = (statusCounts.interview_scheduled || 0) + 
                         (statusCounts.interview_completed || 0) + 
                         (statusCounts.offer_extended || 0) + 
                         (statusCounts.hired || 0)

    const totalReferrals = referrals.length
    const acceptanceRate = totalReferrals > 0 ? Math.round((acceptedCount / totalReferrals) * 100) : 0

    return {
      totalReferrals,
      acceptedReferrals: acceptedCount,
      pendingReferrals: statusCounts.pending || 0,
      rejectedReferrals: statusCounts.rejected || 0,
      reviewingReferrals: statusCounts.reviewing || 0,
      interviewScheduledReferrals: statusCounts.interview_scheduled || 0,
      acceptanceRate,
      lastMonthReferrals,
      thisMonthReferrals
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'reviewing': 'Reviewing',
      'interview_scheduled': 'Accepted',
      'interview_completed': 'Interview Done',
      'offer_extended': 'Offer Extended',
      'hired': 'Hired',
      'rejected': 'Rejected'
    }
    return statusMap[status] || status
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock
      case 'reviewing':
        return Eye
      case 'interview_scheduled':
      case 'interview_completed':
      case 'offer_extended':
      case 'hired':
        return CheckCircle
      case 'rejected':
        return XCircle
      default:
        return Clock
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
      case 'reviewing':
        return 'outline'
      case 'interview_scheduled':
      case 'interview_completed':
      case 'offer_extended':
      case 'hired':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="candidate">
        <ClientOnly>
          <FloatingElements />
          <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
            <motion.div 
              className="text-center space-y-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-16 h-16 border-4 border-slate-200/30 dark:border-slate-700/30 border-t-slate-600 dark:border-t-slate-400 rounded-full mx-auto" />
                <motion.div
                  className="absolute inset-2 border-2 border-slate-300/20 dark:border-slate-600/20 border-t-slate-500 dark:border-t-slate-300 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
              <div className="space-y-3">
                <motion.h3 
                  className="text-xl font-semibold text-slate-900 dark:text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Loading your dashboard
                </motion.h3>
                <motion.p 
                  className="text-slate-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Please wait a moment...
                </motion.p>
              </div>
            </motion.div>
          </div>
        </ClientOnly>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="candidate">
        <ClientOnly>
          <FloatingElements />
          <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
            <motion.div 
              className="text-center space-y-6 max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-16 h-16 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto border border-red-100 dark:border-red-800/50"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </motion.div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Unable to load dashboard</h3>
                <p className="text-slate-500">{error}</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Try again
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </ClientOnly>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { metrics, recentReferrals, recommendedEmployees } = dashboardData
  const monthlyChange = metrics.lastMonthReferrals > 0 
    ? Math.round(((metrics.thisMonthReferrals - metrics.lastMonthReferrals) / metrics.lastMonthReferrals) * 100)
    : metrics.thisMonthReferrals > 0 ? 100 : 0

  // Filter functionality
  const filteredReferrals = recentReferrals.filter(referral => {
    const statusMatch = filterStatus === "all" || referral.status === filterStatus
    const companyMatch = filterCompany === "all" || referral.company === filterCompany
    return statusMatch && companyMatch
  })

  const uniqueCompanies = Array.from(new Set(recentReferrals.map(r => r.company))).sort()
  const uniqueStatuses = Array.from(new Set(recentReferrals.map(r => r.status))).sort()
  
  const clearFilters = () => {
    setFilterStatus("all")
    setFilterCompany("all")
  }

  const hasActiveFilters = filterStatus !== "all" || filterCompany !== "all"

  const handleCustomizedMatching = async () => {
    try {
      setCustomizationLoading(true)
      
      // First, check if we have cached results for these preferences
      try {
        const cachedResults = await getCachedCustomizedMatches(customizationPrefs)
        if (cachedResults.success && cachedResults.matches.length > 0) {
          setCustomizedMatches(cachedResults.matches)
          setCustomizedMatchesCached(true)
          setMatchingMode('customized')
          setShowCustomizationForm(false)
          console.log(`✅ Loaded ${cachedResults.matches.length} cached Customized Matches`)
          return
        }
      } catch (cacheError) {
        console.log('No cached customized matches found - generating new ones')
      }
      
      // Call the customized matching API with user preferences
      const customizedResults = await getPersonalizedMatches({
        targetCompany: customizationPrefs.targetCompany || undefined,
        targetRole: customizationPrefs.targetRole || undefined,
        prioritizePerformance: customizationPrefs.priorityFocus === 'performance',
        prioritizeSkills: customizationPrefs.priorityFocus === 'skills',
        prioritizeMentorship: customizationPrefs.priorityFocus === 'mentorship',
        responseTimeImportance: customizationPrefs.responseTimeImportance as 'low' | 'medium' | 'high',
        experienceLevel: customizationPrefs.experienceLevel,
        specificSkills: customizationPrefs.specificSkills || undefined,
        additionalRequirements: customizationPrefs.additionalRequirements || undefined
      }, 5)

      // Cache the new Customized Matches
      if (customizedResults.success && customizedResults.matches.length > 0) {
        try {
          await cacheCustomizedMatches(customizedResults, customizationPrefs)
          console.log(`✅ Cached ${customizedResults.matches.length} new Customized Matches`)
        } catch (cacheError) {
          console.warn('Failed to cache Customized Matches:', cacheError)
        }
      }

      setCustomizedMatches(customizedResults.matches || [])
      setCustomizedMatchesCached(false) // Fresh matches, not cached
      setMatchingMode('customized')
      setShowCustomizationForm(false)
    } catch (error) {
      console.error('Customized matching failed:', error)
      // Show error toast or notification here
    } finally {
      setCustomizationLoading(false)
    }
  }

  const resetToSmartMatching = () => {
    setMatchingMode('smart')
    setCustomizedMatches([])
    setShowCustomizationForm(false)
  }

  const handleSmartMatchingRefresh = async () => {
    try {
      setSmartMatchingLoading(true)
      
      // Call the Smart Matching API
      const aiMatchesData = await getMyOptimalMatches(undefined, 5).catch(error => {
        console.warn('AI matching failed, using fallback:', error)
        // Fallback to manual employee search if AI matching fails
        return EmployeeAPI.searchEmployees({ limit: 5, sort_by: 'rating' })
          .then(employeesData => ({
            success: true,
            matches: employeesData.employees.map(emp => ({
              employee_id: emp.id,
              employee_name: emp.name,
              employee_position: emp.position || 'Employee',
              employee_company: emp.company || 'Unknown',
              overall_score: 75, // Default moderate score
              confidence_level: 0.5,
              score_breakdown: {
                skills_alignment: 70,
                career_relevance: 70,
                performance_metrics: 80,
                engagement_score: 75,
                neutrality_score: 100
              }
            })),
            summary: { total_evaluated: 0, quality_distribution: { excellent: 0, good: 0, fair: 0 }, average_score: 0, success_patterns: [] },
            total_evaluated: employeesData.employees.length,
            matching_quality: 'fallback',
            message: 'Using fallback recommendations'
          }))
      })

      // Cache the new Smart Matches
      if (aiMatchesData.success && aiMatchesData.matches.length > 0) {
        try {
          await cacheSmartMatches(aiMatchesData)
          console.log(`✅ Cached ${aiMatchesData.matches.length} new Smart Matches`)
        } catch (cacheError) {
          console.warn('Failed to cache Smart Matches:', cacheError)
        }
      }

      setSmartMatches(aiMatchesData.matches || [])
      setSmartMatchingLoaded(true)
      setSmartMatchesCached(false) // Fresh matches, not cached
      setMatchingMode('smart')
    } catch (error) {
      console.error('Smart matching refresh failed:', error)
      // Show error toast or notification here
    } finally {
      setSmartMatchingLoading(false)
    }
  }

  return (
    <DashboardWrapper requiredRole="candidate">
      <DashboardLayout role="candidate">
        <ClientOnly>
          <FloatingElements />
          <div className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">
            {/* Enhanced Header */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Sparkles className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400">
                    Here's your referral activity overview
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Referrals"
                value={metrics.totalReferrals}
                subtitle={monthlyChange >= 0 ? `+${monthlyChange}% from last month` : `${monthlyChange}% from last month`}
                icon={FileText}
                trend={monthlyChange > 0 ? 'up' : monthlyChange < 0 ? 'down' : 'neutral'}
                delay={0.1}
              />
              <MetricCard
                title="Success Rate"
                value={`${metrics.acceptanceRate}%`}
                subtitle={`${metrics.acceptedReferrals} accepted referrals`}
                icon={Target}
                delay={0.15}
              />
              <MetricCard
                title="In Progress"
                value={metrics.pendingReferrals + metrics.reviewingReferrals}
                subtitle="Awaiting response"
                icon={Clock}
                delay={0.2}
              />
              <MetricCard
                title="This Month"
                value={metrics.thisMonthReferrals}
                subtitle={metrics.thisMonthReferrals === 1 ? 'new referral' : 'new referrals'}
                icon={TrendingUp}
                delay={0.25}
              />
            </div>

            {/* Enhanced Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl flex items-center justify-center"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Zap className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h2>
                </div>
                <motion.div whileHover={{ x: 5 }}>
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </motion.div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ActionButton
                  href="/employees"
                  icon={Search}
                  title="Find Employees"
                  description="Discover employees at target companies"
                  delay={0.1}
                />
                <ActionButton
                  href="/referrals/new"
                  icon={Plus}
                  title="New Referral"
                  description="Submit a referral request"
                  delay={0.15}
                />
                <ActionButton
                  href="/free-conversations"
                  icon={MessageSquare}
                  title="Free Conversations"
                  description="Continue discussions with employees"
                  delay={0.2}
                />
                <ActionButton
                  href="/resume-analysis"
                  icon={Brain}
                  title="Resume Analysis"
                  description="Get AI-powered insights"
                  delay={0.25}
                />
              </div>
            </motion.div>

            {/* Enhanced Content Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Tabs defaultValue="recent" className="space-y-6" onValueChange={setActiveTab}>
                <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-2xl p-1.5">
                  <TabsList className="bg-transparent w-full grid grid-cols-2 gap-1">
                    <EnhancedTabsTrigger value="recent" isActive={activeTab === "recent"}>
                      <FileText className="h-4 w-4 mr-2" />
                      Recent Referrals
                    </EnhancedTabsTrigger>
                    <EnhancedTabsTrigger value="recommended" isActive={activeTab === "recommended"}>
                      <Brain className="h-4 w-4 mr-2" />
                      AI Matches
                    </EnhancedTabsTrigger>
                  </TabsList>
                </div>
                
                <AnimatePresence mode="wait">
                  <TabsContent key="recent-tab" value="recent" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Referrals</h3>
                          <motion.div whileHover={{ scale: 1.05 }}>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setShowFilters(!showFilters)}
                              className={`bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 ${showFilters ? 'bg-slate-100/80 dark:bg-slate-700/80' : ''}`}
                            >
                              <Filter className="h-4 w-4 mr-2" />
                              Filter
                              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </Button>
                          </motion.div>
                        </div>

                        {/* Filter Controls */}
                        <AnimatePresence>
                          {showFilters && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 space-y-4"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                      <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All statuses</SelectItem>
                                      {uniqueStatuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                          {formatStatus(status)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                                  <Select value={filterCompany} onValueChange={setFilterCompany}>
                                    <SelectTrigger className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                      <SelectValue placeholder="All companies" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All companies</SelectItem>
                                      {uniqueCompanies.map(company => (
                                        <SelectItem key={company} value={company}>
                                          {company}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-end">
                                  {hasActiveFilters && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={clearFilters}
                                      className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Clear filters
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {hasActiveFilters && (
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                                  <span className="text-sm text-slate-600 dark:text-slate-400">
                                    Showing {filteredReferrals.length} of {recentReferrals.length} referrals
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {recentReferrals.length === 0 ? (
                        <motion.div 
                          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-12 text-center"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <motion.div
                            className="w-16 h-16 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200/60 dark:border-slate-700/60"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <FileText className="h-8 w-8 text-slate-400" />
                          </motion.div>
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">No referrals yet</h3>
                          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                            Get started by requesting your first referral from an employee
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link href="/referrals/new">
                              <Button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-200">
                                Create First Referral
                              </Button>
                            </Link>
                          </motion.div>
                        </motion.div>
                      ) : filteredReferrals.length === 0 ? (
                        <motion.div 
                          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-12 text-center"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <motion.div
                            className="w-16 h-16 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200/60 dark:border-slate-700/60"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <Filter className="h-8 w-8 text-slate-400" />
                          </motion.div>
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">No matching referrals</h3>
                          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                            No referrals match your current filter criteria. Try adjusting your filters.
                          </p>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              variant="outline" 
                              onClick={clearFilters}
                              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Clear filters
                            </Button>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {filteredReferrals.map((referral, index) => {
                            const StatusIcon = getStatusIcon(referral.status)
                            return (
                              <motion.div
                                key={referral.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 hover:border-slate-300/80 dark:hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                                        {referral.position}
                                      </h4>
                                      <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                      >
                                        <Badge variant={getStatusBadgeVariant(referral.status)} className="shrink-0 backdrop-blur-sm">
                                          <StatusIcon className="h-3 w-3 mr-1" />
                                          {formatStatus(referral.status)}
                                        </Badge>
                                      </motion.div>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                        {referral.company}
                                        {referral.employee?.name && ` • ${referral.employee.name}`}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        <FormattedDate date={referral.created_at} />
                                      </p>
                                    </div>
                                  </div>
                                  <Link href={`/referrals/${referral.id}`}>
                                    <Button 
                                      size="sm" 
                                      className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg hover:shadow-xl backdrop-blur-sm"
                                    >
                                      View Details
                                    </Button>
                                  </Link>
                                </div>
                              </motion.div>
                            )
                          })}
                          <motion.div 
                            className="pt-4"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <Link href="/referrals">
                              <Button variant="outline" className="w-full border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all duration-200">
                                View All Referrals
                              </Button>
                            </Link>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent key="recommended-tab" value="recommended" className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4 mb-6">
                        {/* Header with Mode Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-xl flex items-center justify-center"
                              whileHover={{ rotate: 10 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI-Matched Employees</h3>
                            <Badge variant="outline" className={`${
                              matchingMode === 'smart' 
                                ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                : 'bg-purple-50/80 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                            }`}>
                              {matchingMode === 'smart' ? 'Smart Matching' : 'Customized Matching'}
                            </Badge>
                            {/* Cache status indicator */}
                            {(matchingMode === 'smart' && smartMatchesCached) || (matchingMode === 'customized' && customizedMatchesCached) ? (
                              <Badge variant="outline" className="bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs">
                                Cached Results
                              </Badge>
                            ) : (
                              (matchingMode === 'smart' && smartMatchingLoaded) || (matchingMode === 'customized' && customizedMatches.length > 0) ? (
                                <Badge variant="outline" className="bg-amber-50/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs">
                                  Fresh Results
                                </Badge>
                              ) : null
                            )}
                          </div>
                        <motion.div whileHover={{ x: 5 }}>
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            View all
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </motion.div>
                      </div>
                      
                        {/* Mode Toggle Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant={matchingMode === 'smart' ? 'default' : 'outline'}
                            size="sm"
                            onClick={resetToSmartMatching}
                            className={`${
                              matchingMode === 'smart'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                            }`}
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Smart Matching
                          </Button>
                          {matchingMode === 'smart' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSmartMatchingRefresh}
                              disabled={smartMatchingLoading}
                              className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              {smartMatchingLoading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  {smartMatchingLoaded ? 'Refresh Matches' : 'Generate Matches'}
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant={matchingMode === 'customized' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowCustomizationForm(true)}
                            className={`${
                              matchingMode === 'customized'
                                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                : 'border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                            }`}
                          >
                            <Wand2 className="h-4 w-4 mr-2" />
                            Customize Matching
                          </Button>
                          {matchingMode === 'customized' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowCustomizationForm(true)}
                              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Adjust
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Customization Form Modal */}
                      <AnimatePresence>
                        {showCustomizationForm && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 mb-6 shadow-lg"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                <Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                <h4 className="font-semibold text-slate-900 dark:text-white">Customize Your Matching Preferences</h4>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCustomizationForm(false)}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Target Company */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Company</label>
                                <input
                                  type="text"
                                  placeholder="e.g., Google, Microsoft, Apple"
                                  value={customizationPrefs.targetCompany}
                                  onChange={(e) => setCustomizationPrefs(prev => ({ ...prev, targetCompany: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                />
                              </div>

                              {/* Target Role */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Role</label>
                                <input
                                  type="text"
                                  placeholder="e.g., Software Engineer, Product Manager"
                                  value={customizationPrefs.targetRole}
                                  onChange={(e) => setCustomizationPrefs(prev => ({ ...prev, targetRole: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                />
                              </div>

                              {/* Priority Focus */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Priority Focus</label>
                                <select
                                  value={customizationPrefs.priorityFocus}
                                  onChange={(e) => setCustomizationPrefs(prev => ({ ...prev, priorityFocus: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                >
                                  <option value="balanced">Balanced Matching</option>
                                  <option value="skills">Skills & Technical Expertise</option>
                                  <option value="performance">Performance & Success Rate</option>
                                  <option value="mentorship">Mentorship & Guidance</option>
                                </select>
                              </div>

                              {/* Experience Level */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Preferred Experience Level</label>
                                <select
                                  value={customizationPrefs.experienceLevel}
                                  onChange={(e) => setCustomizationPrefs(prev => ({ ...prev, experienceLevel: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                >
                                  <option value="any">Any Experience Level</option>
                                  <option value="junior">Junior (1-3 years)</option>
                                  <option value="senior">Senior (4-8 years)</option>
                                  <option value="executive">Executive (8+ years)</option>
                                </select>
                              </div>

                              {/* Specific Skills */}
                              <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Specific Skills or Technologies</label>
                                <input
                                  type="text"
                                  placeholder="e.g., React, Python, Machine Learning, AWS"
                                  value={customizationPrefs.specificSkills}
                                  onChange={(e) => setCustomizationPrefs(prev => ({ ...prev, specificSkills: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                                />
                              </div>

                              {/* Additional Requirements */}
                              <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Additional Requirements</label>
                                <textarea
                                  placeholder="Any other specific requirements or preferences..."
                                  value={customizationPrefs.additionalRequirements}
                                  onChange={(e) => setCustomizationPrefs(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 resize-none"
                                  rows={3}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-700/60">
                              <Button
                                variant="outline"
                                onClick={() => setShowCustomizationForm(false)}
                                className="border-slate-200/60 dark:border-slate-700/60"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleCustomizedMatching}
                                disabled={customizationLoading}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                {customizationLoading ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Finding Matches...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Find Custom Matches
                                  </>
                                )}
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Display current matches based on mode */}
                      {(matchingMode === 'smart' ? smartMatches : customizedMatches).length === 0 ? (
                        <motion.div 
                          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-12 text-center"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <motion.div
                            className="w-16 h-16 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200/60 dark:border-slate-700/60"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <Users className="h-8 w-8 text-slate-400" />
                          </motion.div>
                          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
                            {matchingMode === 'smart' ? 'Ready to find your perfect matches' : 'No custom matches found'}
                          </h3>
                          <p className="text-slate-500 mb-8">
                            {matchingMode === 'smart' 
                              ? 'Click "Generate Matches" to get AI-powered employee recommendations based on your profile. Once generated, matches will be saved and available across sessions until you refresh them.'
                              : 'Try adjusting your preferences to find employees that match your specific requirements'
                            }
                          </p>
                          {matchingMode === 'smart' && (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="mb-8"
                            >
                              <Button 
                                onClick={handleSmartMatchingRefresh}
                                disabled={smartMatchingLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                {smartMatchingLoading ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating AI Matches...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Smart Matches
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          )}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Link href="/employees">
                              <Button variant="outline" className="border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-900 hover:shadow-lg transition-all duration-200">
                                Browse All Employees
                              </Button>
                            </Link>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          {(matchingMode === 'smart' ? smartMatches : customizedMatches).map((employee, index) => {
                            const expanded = expandedEmployees.has(employee.employee_id)
                            const toggleExpanded = () => {
                              const newExpanded = new Set(expandedEmployees)
                              if (expanded) {
                                newExpanded.delete(employee.employee_id)
                              } else {
                                newExpanded.add(employee.employee_id)
                              }
                              setExpandedEmployees(newExpanded)
                            }
                            return (
                            <motion.div 
                                key={employee.employee_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ y: -2, transition: { duration: 0.2 } }}
                              className="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 hover:border-slate-300/80 dark:hover:border-slate-700/80 hover:shadow-lg hover:shadow-slate-200/20 dark:hover:shadow-slate-900/20 transition-all duration-300"
                            >
                                {/* Header Section */}
                                <div className="flex items-center gap-4 mb-4">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                >
                                  <Avatar className="h-14 w-14 border-2 border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm">
                                    <AvatarImage 
                                        src={undefined} 
                                        alt={employee.employee_name}
                                    />
                                    <AvatarFallback className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold backdrop-blur-sm">
                                        {employee.employee_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                                      {employee.employee_name}
                                  </h4>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                      {employee.employee_position}
                                      {employee.employee_company && ` at ${employee.employee_company}`}
                                  </p>
                                  <div className="flex items-center gap-3 mt-2">
                                      <motion.div 
                                        className="flex items-center gap-1"
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                      >
                                        <Brain className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                          {Math.round(employee.overall_score)}% match
                                        </span>
                                      </motion.div>
                                      <span className="text-xs text-slate-500 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                                        {employee.confidence_level > 0.8 ? 'High Confidence' : 
                                         employee.confidence_level > 0.6 ? 'Good Confidence' : 'Moderate Confidence'}
                                      </span>
                                      {employee.referral_success_prediction && (
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/30 backdrop-blur-sm px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                          {employee.referral_success_prediction.probability}% success
                                      </span>
                                    )}
                                  </div>
                                    {/* Preview of AI insights when collapsed */}
                                    {!expanded && employee.actionable_insights?.why_this_match && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                                        💡 {employee.actionable_insights.why_this_match}
                                      </p>
                                    )}
                                </div>
                                  <div className="flex items-center gap-2">
                                  <Button 
                                      variant="ghost"
                                    size="sm" 
                                      onClick={toggleExpanded}
                                      className="bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200/60 dark:border-blue-700/60 hover:bg-blue-100/80 dark:hover:bg-blue-800/80 text-blue-700 dark:text-blue-300"
                                    >
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      {expanded ? 'Hide Insights' : 'AI Insights'}
                                      <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                    </Button>
                                    <Link href={`/employees/${employee.employee_id}`}>
                                      <Button 
                                        size="sm" 
                                        className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg hover:shadow-xl backdrop-blur-sm"
                                  >
                                    View Profile
                                  </Button>
                                </Link>
                              </div>
                                </div>

                                {/* Expanded AI Insights Section */}
                                <AnimatePresence>
                                  {expanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="border-t border-slate-200/60 dark:border-slate-700/60 pt-6 space-y-6"
                                    >
                                      {/* AI Insights Header */}
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-blue-500" />
                                        <h5 className="font-semibold text-slate-900 dark:text-white">AI Analysis & Insights</h5>
                                      </div>

                                      {/* Why This Match */}
                                      {employee.actionable_insights?.why_this_match && (
                                        <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl p-4 border border-blue-200/60 dark:border-blue-800/60">
                                          <div className="flex items-start gap-3">
                                            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <h6 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Why This Match</h6>
                                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                                {employee.actionable_insights.why_this_match}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Score Breakdown */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                          <h6 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4" />
                                            Match Breakdown
                                          </h6>
                                          <div className="space-y-2">
                                            {[
                                              { label: 'Skills Alignment', value: employee.score_breakdown.skills_alignment, color: 'blue' },
                                              { label: 'Career Relevance', value: employee.score_breakdown.career_relevance, color: 'emerald' },
                                              { label: 'Performance', value: employee.score_breakdown.performance_metrics, color: 'amber' },
                                              { label: 'Engagement', value: employee.score_breakdown.engagement_score, color: 'purple' }
                                            ].map((item) => (
                                              <div key={item.label} className="flex items-center justify-between">
                                                <span className="text-xs text-slate-600 dark:text-slate-400">{item.label}</span>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div 
                                                      className={`h-full bg-${item.color}-500 rounded-full transition-all duration-300`}
                                                      style={{ width: `${item.value}%` }}
                                                    />
                                                  </div>
                                                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-8">
                                                    {Math.round(item.value)}%
                                                  </span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        {/* Success Prediction */}
                                        {employee.referral_success_prediction && (
                                          <div className="space-y-3">
                                            <h6 className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                              <Award className="h-4 w-4" />
                                              Success Prediction
                                            </h6>
                                            <div className="space-y-2">
                                              <div className="bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-sm rounded-lg p-3 border border-emerald-200/60 dark:border-emerald-800/60">
                                                <div className="flex items-center justify-between mb-2">
                                                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Success Rate</span>
                                                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                                    {employee.referral_success_prediction.probability}%
                                                  </span>
                                                </div>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                  Timeline: {employee.referral_success_prediction.timeline_estimate}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Conversation Starters */}
                                      {employee.actionable_insights?.conversation_starters && employee.actionable_insights.conversation_starters.length > 0 && (
                                        <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
                                          <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                              <h6 className="font-medium text-slate-900 dark:text-white mb-3">Conversation Starters</h6>
                                              <div className="space-y-2">
                                                {employee.actionable_insights.conversation_starters.map((starter, i) => (
                                                  <div key={i} className="text-sm text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 rounded-lg p-3 border border-slate-200/40 dark:border-slate-700/40">
                                                    "{starter}"
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Approach Strategy */}
                                      {employee.actionable_insights?.approach_strategy && (
                                        <div className="bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-xl p-4 border border-amber-200/60 dark:border-amber-800/60">
                                          <div className="flex items-start gap-3">
                                            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                              <h6 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Recommended Approach</h6>
                                              <p className="text-sm text-amber-800 dark:text-amber-200">
                                                {employee.actionable_insights.approach_strategy}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  </TabsContent>
                </AnimatePresence>
              </Tabs>
            </motion.div>
          </div>
        </ClientOnly>
      </DashboardLayout>
    </DashboardWrapper>
  )
}
