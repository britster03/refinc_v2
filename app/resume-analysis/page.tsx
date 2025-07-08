"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  getAIHealthStatus, 
  grantConsent, 
  getConsentStatus,
  createAnalysisSession,
  getAnalysisSession,
  submitAnalysisFeedback,
  requestAnalysisRefinement,
  completeAnalysisSession,
  getMarketIntelligence,
  getSkillDemand
} from "@/lib/ai-utils"
import PreAnalysisForm, { AnalysisPreferences } from "@/components/PreAnalysisForm"
import IterativeFeedbackForm, { FeedbackData } from "@/components/IterativeFeedbackForm"
import { toast } from "sonner"
import { checkAuthentication, createTestUser } from '@/lib/auth-check'
import {
  Upload,
  FileText,
  Brain,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Download,
  Sparkles,
  Zap,
  Users,
  Lightbulb,
  Star,
  Clock,
  Award,
  BarChart3,
  Shield,
  Settings,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Lock,
  Globe,
  Coins,
  Calendar,
  BookOpen,
  Repeat,
  CheckSquare,
  Building,
  MapPin,
  DollarSign,
  Mail,
  ExternalLink,
  Filter,
  AlertTriangle,
  ArrowRight
} from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

interface SkillData {
  skill: string
  experience_level: string
  years_experience: string
  confidence: number
  category: string
  market_demand: string
  context?: string
  proficiency_indicators?: string[]
}

interface JobPosting {
  title: string
  company: string
  location: string
  salary?: string
  posted_date: string
  description: string
  source: string
  validation_score?: number
  is_fresh?: boolean
  company_domain?: string
  contact_email?: string
  debug_info?: any
  url?: string
}

interface MarketIntelligence {
  market_analysis: {
    enabled: boolean
    data: {
      market_demand: {
        overall_demand: string
        trending_skills: string[]
        stable_skills: string[]
        declining_skills: string[]
      }
      salary_analysis: {
        estimated_range: { min: number; max: number }
        market_position: string
        growth_potential: string
        location_impact: string
      }
      industry_insights: {
        primary_industries: string[]
        emerging_opportunities: string[]
        industry_growth: string[]
        remote_opportunities: string
      }
      competitive_landscape: any
    }
  }
  insights: {
    key_opportunities: string[]
    salary_optimization: any
    market_positioning: any
    recommendations: any[]
  }
  metadata: {
    analysis_timestamp: string
    skills_analyzed: number
    data_sources: string[]
    data_freshness: string
  }
  job_postings?: JobPosting[]
  skills_analysis?: Record<string, any>
  scraping_stats?: {
    total_jobs_found: number
    sources_successful: string[]
    scraping_time_seconds: number
  }
}

interface AssessmentResult {
  agent_results: {
    skills: {
      success: boolean
      data: {
        extracted_skills: SkillData[]
        skill_categories: Record<string, SkillData[]>
        market_analysis: any
        skill_gaps?: {
          missing_complementary_skills: string[]
          suggested_additions: string[]
          skill_depth_recommendations: string[]
        }
      }
      confidence: number
    }
    resume: {
      success: boolean
      data: {
        overall_score: number
        section_analysis: any
        strengths: string[]
        weaknesses: string[]
        priority_improvements: any[]
        ats_compatibility: {
          score: number
          keyword_density: number
          format_compatibility: number
          section_headers: number
          recommendations: string[]
        }
        content_quality: {
          readability_score: number
          professional_language: number
          action_verbs_count: number
          quantifiable_achievements: number
          improvement_areas: string[]
        }
      }
      confidence: number
    }
    matching?: {
      success: boolean
      data: any
      confidence: number
    }
  }
  final_assessment: {
    executive_summary: {
      overall_assessment: string
    overall_score: number
    key_strengths: string[]
      key_concerns: string[]
      recommendation: string
      confidence_level: number
    }
    detailed_analysis: any
    strategic_recommendations: any
    risk_assessment: any
    next_steps: {
      for_candidate: string[]
      for_recruiter: string[]
      for_hiring_manager: string[]
      timeline: string
    }
  }
  metadata: {
    confidence: number
    processing_time: number
    timestamp: string
  }
  market_intelligence?: MarketIntelligence
  actionable_insights?: {
    priority_actions: any[]
    skill_development_roadmap: any
    career_strategy: any
    success_metrics: any
  }
}

interface ConsentStatus {
  market_analysis: boolean
  data_contribution: boolean
  resume_storage: boolean
}

interface AnalysisSession {
  session_token: string
  session_id: number
  current_iteration: number
  max_iterations: number
  can_refine: boolean
  iterations: any[]
  feedback: any[]
  session_info: any
}

export default function ResumeAnalysisPage() {
  // Core state
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AssessmentResult | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [aiHealthy, setAiHealthy] = useState(true)
  const [analysisStep, setAnalysisStep] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Enhanced features state
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null)
  const [loadingMarketData, setLoadingMarketData] = useState(false)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [jobFilters, setJobFilters] = useState({
    minSalary: 0,
    maxSalary: 200000,
    location: '',
    freshOnly: false,
    minValidationScore: 0.6
  })
  const [jobsDisplayLimit, setJobsDisplayLimit] = useState(10)

  // Privacy and consent state
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>({
    market_analysis: false,
    data_contribution: false,
    resume_storage: false
  })
  const [showConsentDialog, setShowConsentDialog] = useState(false)

  // Session and feedback state
  const [currentSession, setCurrentSession] = useState<AnalysisSession | null>(null)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [satisfactionScore, setSatisfactionScore] = useState(3)

  // Pre-analysis and iterative feedback state
  const [showPreAnalysisForm, setShowPreAnalysisForm] = useState(false)
  const [analysisPreferences, setAnalysisPreferences] = useState<AnalysisPreferences | null>(null)
  const [showIterativeFeedback, setShowIterativeFeedback] = useState(false)
  const [refinementLoading, setRefinementLoading] = useState(false)

  const analysisSteps = [
    "Initializing enhanced AI pipeline...",
    "Processing consent and privacy settings...",
    "Extracting skills with market context...",
    "Analyzing resume quality and structure...",
    "Gathering real-time market intelligence...",
    "Validating job authenticity and freshness...",
    "Processing job matching algorithms...",
    "Generating personalized recommendations...",
    "Synthesizing comprehensive assessment...",
  ]

  const checkAIHealth = async () => {
    try {
      const health = await getAIHealthStatus()
      setAiHealthy(health.status === "healthy")
      if (health.status !== "healthy") {
        toast.error("AI services are currently experiencing issues")
      }
    } catch (error) {
      setAiHealthy(false)
      toast.error("Unable to connect to AI services")
    }
  }

  const loadConsentStatus = async () => {
    try {
      const marketConsent = await getConsentStatus("market_analysis")
      const dataConsent = await getConsentStatus("data_contribution")
      const storageConsent = await getConsentStatus("resume_storage")

      setConsentStatus({
        market_analysis: marketConsent.granted,
        data_contribution: dataConsent.granted,
        resume_storage: storageConsent.granted
      })
    } catch (error) {
      console.error("Failed to load consent status:", error)
    }
  }

  const handleConsentChange = async (consentType: keyof ConsentStatus, granted: boolean) => {
    try {
      await grantConsent(consentType, granted)
      setConsentStatus(prev => ({ ...prev, [consentType]: granted }))
      toast.success(`${granted ? 'Granted' : 'Revoked'} consent for ${consentType?.replace('_', ' ') || consentType}`)
    } catch (error) {
      console.error('Consent update failed:', error)
      toast.error('Failed to update consent settings')
    }
  }

  // Check AI health and load consent status on mount
  const [authStatus, setAuthStatus] = useState<{isAuthenticated: boolean, message: string}>({
    isAuthenticated: false,
    message: 'Checking...'
  })

  useEffect(() => {
    checkAIHealth()
    loadConsentStatus()
    
    // Check authentication status
    const authCheck = checkAuthentication()
    setAuthStatus(authCheck)
  }, [])

  const handleEnhancedAnalysis = async () => {
    if (!resumeText.trim()) {
      toast.error("Please enter your resume text")
      return
    }

    if (!aiHealthy) {
      toast.error("AI services are currently unavailable")
      return
    }

    // Check authentication
    const authCheck = checkAuthentication()
    if (!authCheck.isAuthenticated) {
      toast.error(authCheck.message, {
        description: "Click here to create a test user for development",
        action: {
          label: "Create Test User",
          onClick: () => {
            createTestUser()
            toast.success("Test user created! Try starting analysis again.")
          }
        }
      })
      return
    }

    setIsAnalyzing(true)
    setAnalysisStep(0)

    try {
      // Create analysis session first (optional - for enhanced tracking)
      try {
        const sessionPayload = {
          resume_text: resumeText,
          job_description: jobDescription || undefined,
          pre_analysis_input: analysisPreferences ? {
            roadmap_duration_weeks: analysisPreferences.roadmapDuration,
            career_goals: [analysisPreferences.careerGoals],
            learning_time_hours_per_week: analysisPreferences.learningTimeCommitment,
            priority_areas: analysisPreferences.priorityAreas,
            target_role: analysisPreferences.targetRole,
            target_company: analysisPreferences.targetCompany,
            salary_expectations: analysisPreferences.salaryExpectations,
            preferred_industries: analysisPreferences.preferredIndustries
          } : {
            roadmap_duration_weeks: 12,
            career_goals: [],
            learning_time_hours_per_week: 5,
            priority_areas: []
          }
        }
        const sessionResponse = await createAnalysisSession(JSON.stringify(sessionPayload))

        if (sessionResponse?.success) {
          setCurrentSession(sessionResponse.data)
        }
      } catch (sessionError) {
        console.log('Session creation optional - continuing with analysis')
      }

      // Step-by-step analysis with visual feedback
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }

      // Use the comprehensive analysis endpoint
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/ai/comprehensive-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription || undefined,
          analysis_type: 'comprehensive'
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Debug logging
      console.log('=== API RESPONSE DEBUG ===')
      console.log('Full result:', JSON.stringify(result, null, 2))
      console.log('Result.data structure:', result.data)
      console.log('Final assessment:', result.data?.final_assessment)
      console.log('Overall score:', result.data?.final_assessment?.executive_summary?.overall_score)
      console.log('Key strengths:', result.data?.final_assessment?.executive_summary?.key_strengths)
      console.log('Key concerns:', result.data?.final_assessment?.executive_summary?.key_concerns)
      console.log('Data metadata:', result.data?.metadata)
      console.log('Root metadata:', result.metadata)
      console.log('Confidence from root:', result.metadata?.confidence)
      console.log('=========================')
      
      if (!result.success) {
        throw new Error(result.detail || 'Analysis failed')
      }

      // Combine data with root metadata for proper structure
      const enhancedData = {
        ...result.data,
        metadata: result.metadata // Use root metadata which has confidence
      }
      
      setAnalysisResult(enhancedData)

      // Get market intelligence if user has consent
      if (consentStatus.market_analysis && result.data?.agent_results?.skills?.data?.extracted_skills) {
        await loadMarketIntelligence(result.data.agent_results.skills.data.extracted_skills)
      }

      setActiveTab("overview")
      toast.success("Enhanced analysis completed successfully!")
      
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep(0)
    }
  }

  const loadMarketIntelligence = async (extractedSkills: SkillData[], forceRefresh = false) => {
    console.log('=== MARKET INTELLIGENCE CONSENT CHECK ===')
    console.log('Consent status:', consentStatus)
    console.log('Market analysis consent:', consentStatus.market_analysis)
    console.log('Extracted skills:', extractedSkills?.length || 0)
    console.log('==========================================')
    
    if (!consentStatus.market_analysis) {
      console.log('❌ Market analysis consent not granted - skipping market intelligence')
      return
    }

    setLoadingMarketData(true)
    try {
      const skills = extractedSkills.slice(0, 10).map(s => s.skill) // Top 10 skills
      console.log('🔍 Loading market intelligence for skills:', skills)
      
      // Use cache duration of 0 to force fresh data when forceRefresh is true
      const cacheDuration = forceRefresh ? 0 : 1
      const marketData = await getMarketIntelligence(skills, true, cacheDuration)
      
      if (marketData.success) {
        console.log('=== MARKET INTELLIGENCE DEBUG ===')
        console.log('Market data structure:', JSON.stringify(marketData.data, null, 2))
        console.log('Skills analysis keys:', Object.keys(marketData.data.skills_analysis || {}))
        console.log('================================')
        
        setMarketIntelligence(marketData.data)
        
        // Extract job postings from market data
        const allJobPostings: JobPosting[] = []
        if (marketData.data.skills_analysis) {
          Object.values(marketData.data.skills_analysis).forEach((skillData: any) => {
            console.log('Skill data structure:', skillData)
            if (skillData.job_postings) {
              console.log('Found job postings for skill:', skillData.job_postings.length)
              allJobPostings.push(...skillData.job_postings)
            }
          })
        }
        
        // Also check if job_postings are at the root level
        if (marketData.data.job_postings) {
          console.log('Found root level job postings:', marketData.data.job_postings.length)
          allJobPostings.push(...marketData.data.job_postings)
        }
        
        console.log('Total job postings extracted:', allJobPostings.length)
        setJobPostings(allJobPostings)
        
        const refreshMessage = forceRefresh ? ' (fresh data)' : ''
        toast.success(`Loaded ${allJobPostings.length} job opportunities from market intelligence${refreshMessage}`)
      } else {
        console.log('❌ Market intelligence failed:', marketData)
        toast.error('Market intelligence request failed')
      }
    } catch (error) {
      console.error('Market intelligence failed:', error)
      toast.error('Failed to load market intelligence')
    } finally {
      setLoadingMarketData(false)
    }
  }

  const handlePreAnalysisSubmit = (preferences: AnalysisPreferences) => {
    setAnalysisPreferences(preferences)
    setShowPreAnalysisForm(false)
    toast.success("Preferences saved! Starting personalized analysis...")
    
    // Automatically trigger analysis with preferences
    setTimeout(() => {
      handleEnhancedAnalysis()
    }, 500)
  }

  const handleIterativeFeedback = async (feedbackData: FeedbackData) => {
    if (!currentSession) {
      toast.error("No active session for refinement")
      return
    }

    setRefinementLoading(true)
    
    try {
      // Submit feedback to the backend
      const feedbackResponse = await submitAnalysisFeedback(currentSession.session_token, {
        satisfaction_score: feedbackData.satisfaction,
        feedback_text: feedbackData.specific_feedback,
        feedback_type: "refinement_request",
        specific_areas: feedbackData.areas_to_improve,
        reanalysis_requested: true
      })

      if (feedbackResponse.success) {
        // Request analysis refinement
        const refinementResponse = await requestAnalysisRefinement(
          currentSession.session_token,
          {
            feedback_type: "refinement_request",
            feedback_text: feedbackData.specific_feedback,
            specific_areas: feedbackData.areas_to_improve
          }
        )

        if (refinementResponse.success) {
          // Update analysis result with refined data
          setAnalysisResult(refinementResponse.data)
          setShowIterativeFeedback(false)
          
          // Reload market intelligence if needed
          if (consentStatus.market_analysis && refinementResponse.data?.agent_results?.skills?.data?.extracted_skills) {
            await loadMarketIntelligence(refinementResponse.data.agent_results.skills.data.extracted_skills)
          }
          
          toast.success("Analysis refined successfully!")
        } else {
          throw new Error(refinementResponse.error || 'Refinement failed')
        }
      } else {
        throw new Error(feedbackResponse.error || 'Feedback submission failed')
      }
    } catch (error) {
      console.error('Iterative feedback failed:', error)
      toast.error(error instanceof Error ? error.message : 'Refinement failed')
    } finally {
      setRefinementLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check authentication first
    const authCheck = checkAuthentication()
    if (!authCheck.isAuthenticated) {
      toast.error(authCheck.message, {
        description: "Click here to create a test user for development",
        action: {
          label: "Create Test User",
          onClick: () => {
            createTestUser()
            toast.success("Test user created! Try uploading again.")
          }
        }
      })
      return
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt']
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file')
      return
    }

    // Check file size (5MB limit) 
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    setIsAnalyzing(true)
    setAnalysisStep(1)
    toast.info('Processing document...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Add vision processing option for PDFs
      const useVision = fileExtension === '.pdf' && window.confirm(
        'Would you like to use advanced vision processing to preserve formatting? (Recommended for complex layouts)'
      )
      
      if (useVision) {
        formData.append('use_vision', 'true')
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/ai/process-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Document processing failed')
      }

      const result = await response.json()
      
      if (result.success && result.extracted_text) {
        setResumeText(result.extracted_text)
        
        // Show processing info
        const processingInfo = result.processing_info
        const message = `Document processed successfully using ${processingInfo.processing_method}. ` +
          `${processingInfo.pages_processed > 0 ? `${processingInfo.pages_processed} pages processed. ` : ''}` +
          `${processingInfo.vision_used ? 'Vision processing used for better formatting. ' : ''}` +
          `Extracted ${result.extracted_text.length} characters.`
        
        toast.success(message)
        
        // Automatically start analysis if preferences are set
        if (analysisPreferences) {
          setTimeout(() => {
            handleEnhancedAnalysis()
          }, 1000)
        }
      } else {
        throw new Error('No text could be extracted from the document')
      }

    } catch (error) {
      console.error('Document processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process document')
    } finally {
      setIsAnalyzing(false)
      setAnalysisStep(0)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  const formatSalary = (salary: string | number | undefined) => {
    if (!salary) return 'Not specified'
    if (typeof salary === 'string') {
      if (salary.includes('$')) return salary
      const num = parseInt(salary.replace(/[^0-9]/g, ''))
      return num ? `$${num.toLocaleString()}` : salary
    }
    if (typeof salary === 'number') {
      return `$${salary.toLocaleString()}`
    }
    return 'Not specified'
  }

  const getValidationScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getValidationBadge = (score: number) => {
    if (score >= 0.8) return { variant: "default" as const, text: "Verified" }
    if (score >= 0.6) return { variant: "secondary" as const, text: "Validated" }
    return { variant: "destructive" as const, text: "Unverified" }
  }

  const cleanJobDescription = (description: string) => {
    if (!description) return ""
    
    // Remove HTML tags and decode HTML entities
    const cleanText = description
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
    
    // Truncate to reasonable length for preview
    return cleanText.length > 300 ? cleanText.substring(0, 300) + '...' : cleanText
  }

  const handleLoadMoreJobs = () => {
    setJobsDisplayLimit(prev => prev + 10)
  }

  const filteredJobPostings = jobPostings.filter(job => {
    // Fresh jobs filter
    if (jobFilters.freshOnly && !job.is_fresh) return false
    
    // Validation score filter
    if (job.validation_score && job.validation_score < jobFilters.minValidationScore) return false
    
    // Location filter
    if (jobFilters.location && jobFilters.location.trim() !== '') {
      const locationLower = job.location.toLowerCase()
      const filterLower = jobFilters.location.toLowerCase()
      if (!locationLower.includes(filterLower)) return false
    }
    
    // Salary filter - improved parsing
    if (job.salary && typeof job.salary === 'string') {
      // Extract all numbers from salary string
      const salaryNumbers = job.salary.match(/\d+/g)
      if (salaryNumbers && salaryNumbers.length > 0) {
        // Take the largest number as the salary (handles ranges like "80k-120k")
        const salaryNum = Math.max(...salaryNumbers.map(num => {
          const parsed = parseInt(num)
          // Handle k/K notation (e.g., "80k" -> 80000)
          if (job.salary && job.salary.toLowerCase().includes('k') && parsed < 1000) {
            return parsed * 1000
          }
          return parsed
        }))
        
        if (salaryNum < jobFilters.minSalary || salaryNum > jobFilters.maxSalary) {
          return false
        }
      }
    }
    
    return true
  })

  // Reset display limit when filters change
  const handleFilterChange = (newFilters: typeof jobFilters) => {
    setJobFilters(newFilters)
    setJobsDisplayLimit(10) // Reset to show first 10 jobs
  }

  return (
    <DashboardLayout role="candidate">
      <motion.div className="flex flex-col gap-8" variants={staggerContainer} initial="initial" animate="animate">
        {/* Header */}
        <motion.div className="flex flex-col gap-4" variants={fadeInUp}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Agentic AI Resume Analysis
              </h1>
              <p className="text-muted-foreground text-lg">
                Advanced multi-agent AI pipeline with skills extraction, quality analysis, and intelligent job matching
              </p>
            </div>
          </div>
        </motion.div>

        {!aiHealthy && (
          <motion.div variants={fadeInUp}>
            <Alert className="mb-6 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                AI services are currently experiencing issues. Some features may be unavailable.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Authentication Status */}
        <motion.div variants={fadeInUp}>
          <Alert className={`mb-6 ${authStatus.isAuthenticated ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            {authStatus.isAuthenticated ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
            <AlertDescription className={authStatus.isAuthenticated ? 'text-green-800' : 'text-orange-800'}>
              <div className="flex items-center justify-between">
                <span>{authStatus.message}</span>
                {!authStatus.isAuthenticated && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      createTestUser()
                      const newAuthCheck = checkAuthentication()
                      setAuthStatus(newAuthCheck)
                      toast.success("Test user created successfully!")
                    }}
                    className="ml-4"
                  >
                    Create Test User
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Input Section */}
        <motion.div className="grid gap-6 lg:grid-cols-2" variants={fadeInUp}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Upload Resume
              </CardTitle>
              <CardDescription>Upload your resume or paste the content below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">PDF, DOC, DOCX, TXT</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-text">Or paste resume content</Label>
                <Textarea
                  id="resume-text"
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[200px] border-blue-200 focus:border-blue-400"
                />
                <div className="text-sm text-muted-foreground">
                  {resumeText.length} characters
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Job Description (Optional)
              </CardTitle>
              <CardDescription>Add a job description for targeted matching analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="job-description">Job description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here for enhanced matching..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[200px] border-purple-200 focus:border-purple-400"
                />
                <div className="text-sm text-muted-foreground">
                  {jobDescription.length} characters
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Analyze Button */}
        <motion.div className="flex justify-center gap-4" variants={fadeInUp}>
          <Button
            onClick={() => setShowPreAnalysisForm(true)}
            disabled={!resumeText.trim() || isAnalyzing || !aiHealthy}
            variant="outline"
            size="lg"
            className="border-purple-200 hover:bg-purple-50 px-6 py-3"
          >
            <Settings className="mr-2 h-5 w-5" />
            Personalize Analysis
          </Button>

          <Button
            onClick={handleEnhancedAnalysis}
            disabled={!resumeText.trim() || isAnalyzing || !aiHealthy}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {analysisSteps[analysisStep]}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {analysisPreferences ? 'Start Personalized Analysis' : 'Analyze with Agentic AI'}
              </>
            )}
          </Button>
        </motion.div>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <motion.div variants={fadeInUp}>
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      AI Agents Processing
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(((analysisStep + 1) / analysisSteps.length) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((analysisStep + 1) / analysisSteps.length) * 100} 
                    className="h-3 bg-white"
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {analysisSteps[analysisStep]}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {analysisResult && (
          <motion.div className="space-y-8" variants={staggerContainer}>
                      {/* Overall Score */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-xl">
                <CardContent className="p-8">
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${getScoreColor(analysisResult.final_assessment?.executive_summary?.overall_score || 0)}`}>
                        {analysisResult.final_assessment?.executive_summary?.overall_score || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                                              <Badge variant={getScoreBadgeVariant(analysisResult.final_assessment?.executive_summary?.overall_score || 0)} className="mt-2">
                          {analysisResult.final_assessment?.executive_summary?.recommendation?.replace(/_/g, ' ') || 'No recommendation'}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2 text-blue-600">
                        {Math.round((analysisResult.metadata?.confidence || 0) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">AI Confidence</div>
                      <Badge variant="default" className="mt-2 bg-blue-100 text-blue-800">
                        High Accuracy
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2 text-purple-600">
                        {(analysisResult.metadata?.processing_time || 0).toFixed(1)}s
                      </div>
                      <div className="text-sm text-muted-foreground">Processing Time</div>
                      <Badge variant="secondary" className="mt-2">
                        Multi-Agent
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2 text-green-600">
                        {analysisResult.agent_results.skills.data?.extracted_skills?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Skills Identified</div>
                      <Badge variant="default" className="mt-2 bg-green-100 text-green-800">
                        Comprehensive
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Key Strengths
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.final_assessment?.executive_summary?.key_strengths && Array.isArray(analysisResult.final_assessment.executive_summary.key_strengths) ? 
                          analysisResult.final_assessment.executive_summary.key_strengths.map((strength, index) => (
                          <Badge key={index} variant="default" className="bg-green-100 text-green-800 border-green-200">
                            {strength}
                          </Badge>
                          )) : (
                            <Badge variant="outline" className="text-muted-foreground">No strengths data available</Badge>
                          )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Areas for Improvement
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.final_assessment?.executive_summary?.key_concerns && Array.isArray(analysisResult.final_assessment.executive_summary.key_concerns) ? 
                          analysisResult.final_assessment.executive_summary.key_concerns.map((concern: string, index: number) => (
                          <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              {concern}
                          </Badge>
                          )) : (
                            <Badge variant="outline" className="text-muted-foreground">No concerns data available</Badge>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

                      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg overflow-x-auto">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">Overview</TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">Skills Analysis</TabsTrigger>
                <TabsTrigger value="market" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">Market Intel</TabsTrigger>
                <TabsTrigger value="jobs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">Job Opportunities</TabsTrigger>
                <TabsTrigger value="resume" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">Resume Quality</TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-xs">AI Insights</TabsTrigger>
              </TabsList>

                          {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.final_assessment.executive_summary ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Match Score</span>
                            <span className="font-bold text-lg text-green-600">
                              {analysisResult.final_assessment.executive_summary.overall_score}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Recommendation</span>
                            <Badge className="bg-green-100 text-green-800">
                              {analysisResult.final_assessment.executive_summary.recommendation?.replace(/_/g, ' ') || 'Good fit'}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Processing Time</span>
                            <span className="font-medium">
                              {(analysisResult.metadata?.processing_time || 0).toFixed(1)}s
                            </span>
                          </div>
                          
                          {/* LLM Explanation for Overall Score */}
                          {analysisResult.final_assessment.executive_summary.overall_assessment && (
                            <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-green-500">
                              <h5 className="text-sm font-semibold text-green-800 mb-2">🤖 AI Assessment Reasoning:</h5>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {analysisResult.final_assessment.executive_summary.overall_assessment}
                              </p>
                            </div>
                          )}

                          {/* Strategic Recommendations Preview */}
                          {analysisResult.final_assessment.strategic_recommendations?.immediate_actions && (
                            <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-blue-500">
                              <h5 className="text-sm font-semibold text-blue-800 mb-2">⚡ Top Immediate Actions:</h5>
                              <div className="space-y-2">
                                {analysisResult.final_assessment.strategic_recommendations.immediate_actions.slice(0, 2).map((action: any, index: number) => (
                                  <div key={index} className="text-xs text-gray-700">
                                    <span className="font-medium">{action.action}</span>
                                    <span className="text-gray-500 ml-2">({action.priority} priority)</span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <button 
                                  onClick={() => setActiveTab('market')}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  → View all strategic recommendations in Market Intel tab
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Comprehensive analysis complete</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Key Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Skills Identified</span>
                          <span className="font-bold text-lg text-blue-600">
                            {analysisResult.agent_results.skills.data?.extracted_skills?.length || 0}
                          </span>
                          </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">AI Confidence</span>
                          <span className="font-bold text-lg text-blue-600">
                            {Math.round((analysisResult.metadata?.confidence || 0) * 100)}%
                          </span>
                        </div>
                        {marketIntelligence && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Job Opportunities</span>
                            <span className="font-bold text-lg text-blue-600">
                              {jobPostings.length}
                          </span>
                          </div>
                        )}
                        {!marketIntelligence && consentStatus.market_analysis && analysisResult && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadMarketIntelligence(analysisResult.agent_results.skills.data?.extracted_skills || [], true)}
                              disabled={loadingMarketData}
                              className="w-full"
                            >
                              {loadingMarketData ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                  Loading Market Data...
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  Load Job Opportunities
                                </>
                              )}
                            </Button>
                        </div>
                        )}

                        {/* Real Backend Insights */}
                        <div className="space-y-3 mt-4">
                          {/* Risk Assessment from Backend */}
                          {analysisResult.final_assessment.risk_assessment?.success_probability && (
                            <div className="p-3 bg-white rounded-lg border-l-4 border-orange-500">
                              <h5 className="text-sm font-semibold text-orange-800 mb-2">📊 Success Probability:</h5>
                              <p className="text-xs text-gray-600 leading-relaxed">
                                <strong>{analysisResult.final_assessment.risk_assessment.success_probability}%</strong> likelihood of success based on current profile.
                                Retention likelihood: <strong>{analysisResult.final_assessment.risk_assessment.retention_likelihood}%</strong>
                              </p>
                            </div>
                          )}

                          {/* Next Steps from Backend */}
                          {analysisResult.final_assessment.next_steps?.for_candidate && (
                            <div className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                              <h5 className="text-sm font-semibold text-green-800 mb-2">🎯 Next Steps for You:</h5>
                              <div className="space-y-1">
                                {analysisResult.final_assessment.next_steps.for_candidate.slice(0, 3).map((step: string, index: number) => (
                                  <p key={index} className="text-xs text-gray-600">• {step}</p>
                                ))}
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-purple-600" />
                        Privacy & Consent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Market Analysis</span>
                          <Checkbox 
                            checked={consentStatus.market_analysis}
                            onCheckedChange={(checked) => handleConsentChange('market_analysis', checked as boolean)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Data Contribution</span>
                          <Checkbox 
                            checked={consentStatus.data_contribution}
                            onCheckedChange={(checked) => handleConsentChange('data_contribution', checked as boolean)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Resume Storage</span>
                          <Checkbox 
                            checked={consentStatus.resume_storage}
                            onCheckedChange={(checked) => handleConsentChange('resume_storage', checked as boolean)}
                          />
                        </div>
                        {analysisResult && consentStatus.market_analysis && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadMarketIntelligence(analysisResult.agent_results.skills.data?.extracted_skills || [], true)}
                            disabled={loadingMarketData}
                            className="w-full mt-3"
                          >
                            {loadingMarketData ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                                Refreshing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Fresh Market Data
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Analysis Insights */}
                <div className="space-y-6">

                  {/* Risk Assessment */}
                  {analysisResult.final_assessment.risk_assessment && (
                    <Card className="bg-gradient-to-br from-red-50 to-pink-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          Risk Assessment
                        </CardTitle>
                        <CardDescription>
                          Potential challenges and mitigation strategies identified by AI
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-white rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {analysisResult.final_assessment.risk_assessment.success_probability || 0}%
                              </div>
                              <div className="text-xs text-muted-foreground">Success Probability</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {analysisResult.final_assessment.risk_assessment.retention_likelihood || 0}%
                              </div>
                              <div className="text-xs text-muted-foreground">Retention Likelihood</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                {analysisResult.final_assessment.risk_assessment.performance_prediction || 0}%
                              </div>
                              <div className="text-xs text-muted-foreground">Performance Prediction</div>
                            </div>
                          </div>

                          {analysisResult.final_assessment.risk_assessment.hiring_risks && (
                            <div>
                              <h4 className="font-semibold text-red-800 mb-3">⚠️ Identified Risks & Mitigations</h4>
                              <div className="space-y-3">
                                {analysisResult.final_assessment.risk_assessment.hiring_risks.map((risk: any, idx: number) => (
                                  <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-red-500">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="destructive">{risk.probability} probability</Badge>
                                      <Badge variant="secondary">{risk.impact} impact</Badge>
                                    </div>
                                    <h5 className="font-medium mb-1">Risk: {risk.risk}</h5>
                                    <p className="text-sm text-gray-600">
                                      <strong>Mitigation:</strong> {risk.mitigation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Next Steps */}
                  {analysisResult.final_assessment.next_steps && (
                    <Card className="bg-gradient-to-br from-green-50 to-blue-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ArrowRight className="h-5 w-5 text-green-600" />
                          Next Steps & Action Plan
                        </CardTitle>
                        <CardDescription>
                          Personalized roadmap based on your analysis results
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-6 md:grid-cols-3">
                          {analysisResult.final_assessment.next_steps.for_candidate && (
                            <div>
                              <h4 className="font-semibold text-green-800 mb-3">👤 For You (Candidate)</h4>
                              <ul className="space-y-2">
                                {analysisResult.final_assessment.next_steps.for_candidate.map((step: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {analysisResult.final_assessment.next_steps.for_recruiter && (
                            <div>
                              <h4 className="font-semibold text-blue-800 mb-3">🎯 For Recruiters</h4>
                              <ul className="space-y-2">
                                {analysisResult.final_assessment.next_steps.for_recruiter.map((step: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {analysisResult.final_assessment.next_steps.for_hiring_manager && (
                            <div>
                              <h4 className="font-semibold text-purple-800 mb-3">👔 For Hiring Managers</h4>
                              <ul className="space-y-2">
                                {analysisResult.final_assessment.next_steps.for_hiring_manager.map((step: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm">
                                    <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        
                        {analysisResult.final_assessment.next_steps.timeline && (
                          <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-green-500">
                            <h5 className="text-sm font-semibold text-green-800 mb-1">⏱️ Recommended Timeline:</h5>
                            <p className="text-sm text-gray-600">{analysisResult.final_assessment.next_steps.timeline}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Refinement Actions */}
                {analysisResult && currentSession && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-orange-600" />
                        Improve Analysis
                      </CardTitle>
                      <CardDescription>
                        Not satisfied? Get a refined analysis based on your feedback
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Session iterations: {currentSession.current_iteration || 0} / {currentSession.max_iterations || 3}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Refinements available: {(currentSession.max_iterations || 3) - (currentSession.current_iteration || 0)}
                          </p>
                        </div>
                        <Button 
                          onClick={() => setShowIterativeFeedback(true)}
                          disabled={!currentSession.can_refine || refinementLoading}
                          className="bg-gradient-to-r from-orange-600 to-red-600"
                        >
                          {refinementLoading ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Refining...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Improve Analysis
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Market Intelligence Tab */}
              <TabsContent value="market" className="space-y-6">
                {marketIntelligence ? (
                  <div className="space-y-6">
                    {/* Market Overview */}
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-emerald-600" />
                          Market Intelligence Overview
                        </CardTitle>
                        <CardDescription>
                          Real-time market analysis based on {marketIntelligence.metadata.skills_analyzed} skills
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">
                              {marketIntelligence.scraping_stats?.total_jobs_found || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Jobs Found</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {marketIntelligence.scraping_stats?.sources_successful?.length || 0}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Sources</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {marketIntelligence.scraping_stats?.scraping_time_seconds || 0}s
                            </div>
                            <div className="text-sm text-muted-foreground">Scan Time</div>
                          </div>
                        </div>
                        {marketIntelligence.scraping_stats?.sources_successful && Array.isArray(marketIntelligence.scraping_stats.sources_successful) && (
                          <div className="mt-4">
                            <div className="text-sm font-medium mb-2">Active Data Sources:</div>
                            <div className="flex flex-wrap gap-2">
                              {marketIntelligence.scraping_stats.sources_successful.map((source, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Real Market Analysis Data */}
                        {marketIntelligence.market_analysis?.data && (
                          <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-emerald-500">
                            <h5 className="text-sm font-semibold text-emerald-800 mb-2">📊 Market Overview:</h5>
                            <div className="space-y-2 text-sm text-gray-700">
                              {marketIntelligence.market_analysis.data.market_demand && (
                                <p><strong>Overall Demand:</strong> {marketIntelligence.market_analysis.data.market_demand.overall_demand}</p>
                              )}
                              {marketIntelligence.market_analysis.data.salary_analysis && (
                                <p><strong>Market Position:</strong> {marketIntelligence.market_analysis.data.salary_analysis.market_position}</p>
                              )}
                              <p><strong>Data Freshness:</strong> {marketIntelligence.metadata.data_freshness}</p>
                              <p><strong>Analysis Timestamp:</strong> {new Date(marketIntelligence.metadata.analysis_timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        )}

                        {/* Industry Insights from Backend */}
                        {marketIntelligence.market_analysis?.data?.industry_insights && (
                          <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-blue-500">
                            <h5 className="text-sm font-semibold text-blue-800 mb-2">🏭 Industry Insights:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                              <div>
                                <p className="font-medium mb-1">Primary Industries:</p>
                                <div className="flex flex-wrap gap-1">
                                  {marketIntelligence.market_analysis.data.industry_insights.primary_industries.map((industry: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{industry}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium mb-1">Emerging Opportunities:</p>
                                <div className="flex flex-wrap gap-1">
                                  {marketIntelligence.market_analysis.data.industry_insights.emerging_opportunities.map((opp: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">{opp}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Market Demand Trends */}
                        {marketIntelligence.market_analysis?.data?.market_demand && (
                          <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-green-500">
                            <h5 className="text-sm font-semibold text-green-800 mb-2">📈 Market Demand Trends:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-green-700 mb-1">Trending Skills:</p>
                                <div className="space-y-1">
                                  {marketIntelligence.market_analysis.data.market_demand.trending_skills.slice(0, 3).map((skill: string, idx: number) => (
                                    <Badge key={idx} className="bg-green-100 text-green-800 text-xs block w-fit">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-blue-700 mb-1">Stable Skills:</p>
                                <div className="space-y-1">
                                  {marketIntelligence.market_analysis.data.market_demand.stable_skills.slice(0, 3).map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs block w-fit">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-red-700 mb-1">Declining Skills:</p>
                                <div className="space-y-1">
                                  {marketIntelligence.market_analysis.data.market_demand.declining_skills.slice(0, 3).map((skill: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs block w-fit border-red-200 text-red-700">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Salary Analysis from Backend */}
                        {marketIntelligence.market_analysis?.data?.salary_analysis && (
                          <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-purple-500">
                            <h5 className="text-sm font-semibold text-purple-800 mb-2">💰 Salary Analysis:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="font-bold text-purple-600">
                                  ${(marketIntelligence.market_analysis.data.salary_analysis.estimated_range.min / 1000).toFixed(0)}k - ${(marketIntelligence.market_analysis.data.salary_analysis.estimated_range.max / 1000).toFixed(0)}k
                                </div>
                                <div className="text-xs text-gray-600">Estimated Range</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="font-bold text-purple-600 capitalize">
                                  {marketIntelligence.market_analysis.data.salary_analysis.market_position.replace(/_/g, ' ')}
                                </div>
                                <div className="text-xs text-gray-600">Market Position</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="font-bold text-purple-600 capitalize">
                                  {marketIntelligence.market_analysis.data.salary_analysis.growth_potential}
                                </div>
                                <div className="text-xs text-gray-600">Growth Potential</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded">
                                <div className="font-bold text-purple-600 capitalize">
                                  {marketIntelligence.market_analysis.data.salary_analysis.location_impact}
                                </div>
                                <div className="text-xs text-gray-600">Location Impact</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Individual Skills Analysis using Real Data */}
                    {analysisResult && analysisResult.agent_results.skills.data?.extracted_skills && (
                      <Card className="border-0 shadow-lg">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            Individual Skills Analysis
                          </CardTitle>
                          <CardDescription>
                            Detailed analysis of each skill identified from your resume
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {analysisResult.agent_results.skills.data.extracted_skills.slice(0, 6).map((skillData: SkillData, index: number) => (
                              <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-blue-50">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold">{skillData.skill}</h3>
                                  <div className="flex gap-2">
                                    <Badge variant={skillData.market_demand === 'high' ? 'default' : skillData.market_demand === 'medium' ? 'secondary' : 'outline'}>
                                      {skillData.market_demand} demand
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {skillData.category?.replace(/_/g, ' ') || 'general'}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-blue-600">
                                      {Math.round((skillData.confidence || 0) * 100)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">AI Confidence</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-green-600 capitalize">
                                      {skillData.experience_level}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Experience Level</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-purple-600">
                                      {skillData.years_experience}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Experience</div>
                                  </div>
                                  <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-orange-600 capitalize">
                                      {skillData.market_demand}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Market Demand</div>
                                  </div>
                                </div>

                                {/* Skill Context and Detection */}
                                {skillData.context && (
                                  <div className="p-3 bg-white rounded-lg border-l-4 border-blue-500 mb-3">
                                    <h5 className="text-sm font-semibold text-blue-800 mb-2">📝 Detection Context:</h5>
                                    <p className="text-sm text-gray-700">{skillData.context}</p>
                                  </div>
                                )}

                                {/* Proficiency Indicators */}
                                {skillData.proficiency_indicators && skillData.proficiency_indicators.length > 0 && (
                                  <div className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                                    <h5 className="text-sm font-semibold text-green-800 mb-2">🎯 Proficiency Indicators:</h5>
                                    <div className="flex flex-wrap gap-1">
                                      {skillData.proficiency_indicators.map((indicator: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                                          {indicator}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Market Insights */}
                    {marketIntelligence.insights && (
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Real Strategic Recommendations from Backend */}
                        {analysisResult?.final_assessment?.strategic_recommendations?.immediate_actions && (
                          <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                            <CardHeader>
                              <CardTitle className="text-green-800 text-base">🚀 Strategic Recommendations</CardTitle>
                              <CardDescription className="text-green-700">
                                AI-generated strategic actions based on comprehensive analysis
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3 mb-4">
                                {analysisResult.final_assessment.strategic_recommendations.immediate_actions.slice(0, 3).map((action: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                                        {action.priority} priority
                                      </Badge>
                                      <Badge variant="outline">{action.timeline}</Badge>
                                      <Badge variant="outline" className="text-xs">{action.difficulty}</Badge>
                                    </div>
                                    <h6 className="font-medium text-sm mb-1">{action.action}</h6>
                                    <p className="text-xs text-gray-600">Expected impact: {action.expected_impact}</p>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                                <h5 className="text-sm font-semibold text-green-800 mb-2">💡 Implementation Strategy:</h5>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  These recommendations are prioritized by our AI based on market demand, your current profile, and potential impact. 
                                  Start with high-priority actions that offer the best return on investment.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Real Salary Analysis from Backend */}
                        {marketIntelligence.skills_analysis && Object.keys(marketIntelligence.skills_analysis).length > 0 && (
                          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
                            <CardHeader>
                              <CardTitle className="text-blue-800 text-base">💰 Real Market Salary Data</CardTitle>
                              <CardDescription className="text-blue-700">
                                Live salary insights from actual job postings
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {Object.entries(marketIntelligence.skills_analysis).slice(0, 3).map(([skill, data]: [string, any], idx: number) => {
                                  const salaryData = data.salary_data || {}
                                  const avgSalary = salaryData.average_salary
                                  const salaryRange = salaryData.salary_range || {}
                                  const jobCount = data.job_postings?.length || 0
                                  
                                  return (
                                    <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-blue-500">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                          {skill}
                                        </Badge>
                                        <span className="text-xs text-gray-500">{jobCount} jobs found</span>
                                      </div>
                                      {avgSalary && (
                                        <div className="text-sm">
                                          <span className="font-semibold text-blue-800">Average: ${avgSalary.toLocaleString()}</span>
                                          {salaryRange.min && salaryRange.max && (
                                            <span className="text-gray-600 ml-2">
                                              (Range: ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()})
                          </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-blue-500">
                                <h5 className="text-sm font-semibold text-blue-800 mb-2">📊 Market Intelligence:</h5>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  This data is scraped from real job postings in the current market. Use these insights to benchmark your salary expectations and negotiate effectively.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {/* Real Actionable Insights from Backend */}
                    {analysisResult?.actionable_insights?.priority_actions && (
                      <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-purple-600" />
                            Actionable Insights
                          </CardTitle>
                          <CardDescription>
                            Priority actions ranked by impact and effort from comprehensive AI analysis
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysisResult.actionable_insights.priority_actions
                              .sort((a: any, b: any) => a.priority - b.priority)
                              .slice(0, 4).map((action: any, idx: number) => (
                              <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary">{action.category}</Badge>
                                  <Badge variant="outline">Priority {idx + 1}</Badge>
                                  <Badge variant="outline" className="text-xs">{action.effort_required} effort</Badge>
                                  <Badge variant="outline" className="text-xs">{action.time_to_impact}</Badge>
                                </div>
                                <h5 className="font-medium mb-2">{action.action}</h5>
                                <p className="text-sm text-gray-600 mb-2">{action.expected_outcome}</p>
                                {action.resources_needed && action.resources_needed.length > 0 && (
                                  <div className="mt-2">
                                    <div className="text-xs font-medium text-purple-700 mb-1">Resources Needed:</div>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                      {action.resources_needed.map((resource: string, resourceIdx: number) => (
                                        <li key={resourceIdx} className="flex items-start gap-1">
                                          <div className="w-1 h-1 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                          {resource}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 p-3 bg-white rounded-lg border-l-4 border-purple-500">
                            <h5 className="text-sm font-semibold text-purple-800 mb-2">🎯 Prioritization Strategy:</h5>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              Actions are ranked by priority score (1-10) considering impact potential, effort required, and time to results. 
                              Focus on high-priority, low-effort actions first for quick wins.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Market Intelligence Not Available</h3>
                      <p className="text-muted-foreground mb-4">
                        Enable market analysis consent to get real-time job market insights
                      </p>
                      {!consentStatus.market_analysis && (
                        <Button
                          onClick={() => handleConsentChange('market_analysis', true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          Enable Market Analysis
                        </Button>
                      )}
                      {consentStatus.market_analysis && analysisResult && (
                        <Button
                          onClick={() => loadMarketIntelligence(analysisResult.agent_results.skills.data?.extracted_skills || [], true)}
                          disabled={loadingMarketData}
                          className="bg-gradient-to-r from-blue-600 to-purple-600"
                        >
                          {loadingMarketData ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Loading Market Data...
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4 mr-2" />
                              Load Market Intelligence
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Job Opportunities Tab */}
              <TabsContent value="jobs" className="space-y-6">
                {jobPostings.length > 0 ? (
                  <div className="space-y-6">
                    {/* Job Filters */}
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-blue-600" />
                          Filter Job Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-2">
                            <Label>Salary Range</Label>
                            <div className="px-3 space-y-3">
                              <div>
                                <Label className="text-xs text-muted-foreground">Minimum</Label>
                                <Slider
                                  value={[jobFilters.minSalary]}
                                  onValueChange={(value) => handleFilterChange({...jobFilters, minSalary: value[0]})}
                                  max={jobFilters.maxSalary}
                                  step={10000}
                                  className="mb-1"
                                />
                                <div className="text-sm text-muted-foreground">
                                  ${jobFilters.minSalary.toLocaleString()}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Maximum</Label>
                                <Slider
                                  value={[jobFilters.maxSalary]}
                                  onValueChange={(value) => handleFilterChange({...jobFilters, maxSalary: value[0]})}
                                  max={500000}
                                  min={jobFilters.minSalary}
                                  step={10000}
                                  className="mb-1"
                                />
                                <div className="text-sm text-muted-foreground">
                                  ${jobFilters.maxSalary.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Location</Label>
                            <Input
                              placeholder="e.g., Remote, New York"
                              value={jobFilters.location}
                              onChange={(e) => handleFilterChange({...jobFilters, location: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Validation Score</Label>
                            <div className="px-3">
                              <Slider
                                value={[jobFilters.minValidationScore]}
                                onValueChange={(value) => handleFilterChange({...jobFilters, minValidationScore: value[0]})}
                                max={1}
                                step={0.1}
                                className="mb-2"
                              />
                              <div className="text-sm text-muted-foreground">
                                Min: {(jobFilters.minValidationScore * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Options</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="fresh-only"
                                  checked={jobFilters.freshOnly}
                                  onCheckedChange={(checked) => handleFilterChange({...jobFilters, freshOnly: checked as boolean})}
                                />
                                <Label htmlFor="fresh-only" className="text-sm">Fresh jobs only</Label>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFilterChange({
                                  minSalary: 0,
                                  maxSalary: 200000,
                                  location: '',
                                  freshOnly: false,
                                  minValidationScore: 0.6
                                })}
                                className="w-full"
                              >
                                Clear Filters
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Filter Results Summary */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                              Showing {filteredJobPostings.slice(0, jobsDisplayLimit).length} of {filteredJobPostings.length} jobs
                              {filteredJobPostings.length !== jobPostings.length && (
                                <span className="ml-1">
                                  (filtered from {jobPostings.length} total)
                          </span>
                              )}
                            </span>
                            {(jobFilters.location || jobFilters.freshOnly || jobFilters.minSalary > 0 || jobFilters.maxSalary < 200000 || jobFilters.minValidationScore > 0.6) && (
                              <Badge variant="secondary" className="text-xs">
                                Filters Active
                              </Badge>
                            )}
                        </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Job Listings */}
                    <div className="space-y-4">
                      {filteredJobPostings.slice(0, jobsDisplayLimit).map((job, idx) => (
                        <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <span className="flex items-center gap-1">
                                    <Building className="h-4 w-4" />
                                    {job.company}
                          </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {job.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {job.posted_date}
                          </span>
                        </div>
                              </div>
                              <div className="text-right">
                                {job.salary && (
                                  <div className="font-semibold text-green-600 mb-2">
                                    {formatSalary(job.salary)}
                                  </div>
                                )}
                                {job.validation_score && (
                                  <Badge {...getValidationBadge(job.validation_score)}>
                                    {getValidationBadge(job.validation_score).text}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 mb-3">
                              <Badge variant="outline" className="text-xs">
                                {job.source}
                              </Badge>
                              {job.is_fresh && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Fresh
                                </Badge>
                              )}
                              {job.company_domain && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Globe className="h-3 w-3" />
                                  {job.company_domain}
                          </span>
                              )}
                              {job.contact_email && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  Contact Available
                          </span>
                              )}
                        </div>

                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {cleanJobDescription(job.description)}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {job.validation_score && (
                                  <span className={`text-xs ${getValidationScoreColor(job.validation_score)}`}>
                                    Validation: {(job.validation_score * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                              {job.url && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Job
                                  </a>
                                </Button>
                              )}
                      </div>
                    </CardContent>
                  </Card>
                      ))}
                </div>

                    {filteredJobPostings.length > jobsDisplayLimit && (
                      <div className="text-center">
                        <Button variant="outline" onClick={handleLoadMoreJobs}>
                          Load More Jobs ({filteredJobPostings.length - jobsDisplayLimit} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Job Opportunities Available</h3>
                      <p className="text-muted-foreground mb-4">
                        {consentStatus.market_analysis 
                          ? "Run analysis to discover job opportunities based on your skills"
                          : "Enable market analysis to find job opportunities"
                        }
                      </p>
                      {!consentStatus.market_analysis && (
                        <Button 
                          onClick={() => handleConsentChange('market_analysis', true)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600"
                        >
                          Enable Job Discovery
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                {/* Strategic Recommendations from Backend */}
                {analysisResult.final_assessment.strategic_recommendations && (
                  <div className="space-y-6">
                    {/* Immediate Actions */}
                    {analysisResult.final_assessment.strategic_recommendations.immediate_actions && (
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-orange-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Immediate Actions Required
                          </CardTitle>
                          <CardDescription>High-priority actions to take right now</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysisResult.final_assessment.strategic_recommendations.immediate_actions.map((action: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4 bg-white">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'}>
                                    {action.priority} priority
                                  </Badge>
                                  <Badge variant="outline">{action.timeline}</Badge>
                                  <Badge variant="outline">{action.difficulty}</Badge>
                                </div>
                                <h4 className="font-semibold mb-2">{action.action}</h4>
                                <p className="text-sm text-gray-600 mb-2">{action.expected_impact}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Skill Development Roadmap */}
                    {analysisResult.final_assessment.strategic_recommendations.skill_development && (
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            Skill Development Roadmap
                          </CardTitle>
                          <CardDescription>Personalized learning path based on market analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysisResult.final_assessment.strategic_recommendations.skill_development.map((skill: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold">{skill.skill}</h4>
                                  <div className="flex gap-2">
                                    <Badge variant="outline">{skill.current_level} → {skill.target_level}</Badge>
                                    <Badge variant={skill.market_impact === 'high' ? 'default' : 'secondary'}>
                                      {skill.market_impact} impact
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">Timeline: {skill.timeline}</p>
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Learning Path:</h5>
                                  <ul className="space-y-1">
                                    {skill.learning_path.map((step: string, idx: number) => (
                                      <li key={idx} className="text-sm flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                        {step}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Career Guidance */}
                    {analysisResult.final_assessment.strategic_recommendations.career_guidance && (
                      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-600" />
                            Career Strategy
                          </CardTitle>
                          <CardDescription>Strategic career advice based on your profile</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysisResult.final_assessment.strategic_recommendations.career_guidance.map((guidance: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4 bg-white">
                                <h4 className="font-semibold mb-2 capitalize">{guidance.area.replace(/_/g, ' ')}</h4>
                                <p className="text-sm text-gray-600 mb-3">{guidance.recommendation}</p>
                                <p className="text-sm text-gray-500 mb-3"><strong>Why:</strong> {guidance.rationale}</p>
                                <div>
                                  <h5 className="text-sm font-medium mb-2">Success Metrics:</h5>
                                  <ul className="space-y-1">
                                    {guidance.success_metrics.map((metric: string, idx: number) => (
                                      <li key={idx} className="text-sm flex items-start gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                        {metric}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Risk Assessment */}
                {analysisResult.final_assessment.risk_assessment && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-yellow-600" />
                        Risk Assessment & Success Prediction
                      </CardTitle>
                      <CardDescription>AI-powered analysis of potential challenges and success probability</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {analysisResult.final_assessment.risk_assessment.success_probability}%
                          </div>
                          <div className="text-sm text-gray-600">Success Probability</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {analysisResult.final_assessment.risk_assessment.retention_likelihood}%
                          </div>
                          <div className="text-sm text-gray-600">Retention Likelihood</div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {analysisResult.final_assessment.risk_assessment.performance_prediction}%
                          </div>
                          <div className="text-sm text-gray-600">Performance Prediction</div>
                        </div>
                      </div>

                      {analysisResult.final_assessment.risk_assessment.hiring_risks && (
                        <div>
                          <h4 className="font-semibold mb-3">Identified Risks & Mitigation Strategies:</h4>
                          <div className="space-y-3">
                            {analysisResult.final_assessment.risk_assessment.hiring_risks.map((risk: any, index: number) => (
                              <div key={index} className="border rounded-lg p-4 bg-white">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={risk.probability === 'high' ? 'destructive' : risk.probability === 'medium' ? 'secondary' : 'outline'}>
                                    {risk.probability} probability
                                  </Badge>
                                  <Badge variant={risk.impact === 'high' ? 'destructive' : 'secondary'}>
                                    {risk.impact} impact
                                  </Badge>
                                </div>
                                <h5 className="font-medium mb-2">{risk.risk}</h5>
                                <p className="text-sm text-gray-600"><strong>Mitigation:</strong> {risk.mitigation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actionable Insights */}
                {analysisResult.actionable_insights && (
                  <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-purple-600" />
                        Actionable Insights & Roadmap
                      </CardTitle>
                      <CardDescription>Comprehensive action plan with prioritized recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.actionable_insights.priority_actions && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">Priority Actions (Ranked by Impact):</h4>
                          {analysisResult.actionable_insights.priority_actions
                            .sort((a: any, b: any) => a.priority - b.priority)
                            .map((action: any, index: number) => (
                            <div key={index} className="border rounded-lg p-4 bg-white">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="default">Priority {index + 1}</Badge>
                                <Badge variant="outline">{action.effort_required} effort</Badge>
                                <Badge variant="secondary">{action.time_to_impact}</Badge>
                              </div>
                              <h5 className="font-medium mb-2">{action.action}</h5>
                              <p className="text-sm text-gray-600 mb-3">{action.expected_outcome}</p>
                              {action.resources_needed && (
                                <div>
                                  <span className="text-sm font-medium">Resources needed:</span>
                                  <ul className="text-sm text-gray-600 mt-1">
                                    {action.resources_needed.map((resource: string, idx: number) => (
                                      <li key={idx}>• {resource}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Extracted Skills</CardTitle>
                  <CardDescription>
                    AI-identified skills with experience levels and market demand analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.agent_results.skills.data?.extracted_skills ? (
                    <div className="space-y-6">
                      {/* Skills Overview with Real Backend Data */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">📊 Skills Analysis Results</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-lg text-blue-600">
                              {analysisResult.agent_results.skills.data.extracted_skills.length}
                            </div>
                            <div className="text-blue-700">Skills Found</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-green-600">
                              {Math.round((analysisResult.agent_results.skills?.confidence || 0) * 100)}%
                            </div>
                            <div className="text-blue-700">AI Confidence</div>
                          </div>
                          {analysisResult.agent_results.skills.data.market_analysis?.high_demand_skills && (
                            <div className="text-center">
                              <div className="font-bold text-lg text-orange-600">
                                {analysisResult.agent_results.skills.data.market_analysis.high_demand_skills.length}
                              </div>
                              <div className="text-blue-700">High Demand</div>
                            </div>
                          )}
                          {analysisResult.agent_results.skills.data.skill_gaps?.suggested_additions && (
                            <div className="text-center">
                              <div className="font-bold text-lg text-purple-600">
                                {analysisResult.agent_results.skills.data.skill_gaps.suggested_additions.length}
                              </div>
                              <div className="text-blue-700">Suggestions</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysisResult.agent_results.skills.data.extracted_skills && Array.isArray(analysisResult.agent_results.skills.data.extracted_skills) ? 
                          analysisResult.agent_results.skills.data.extracted_skills.slice(0, 12).map((skill, index) => (
                            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-semibold text-lg">{skill.skill}</div>
                                <Badge variant="outline" className="text-xs">
                                  {skill.category?.replace(/_/g, ' ') || 'general'}
                                </Badge>
                          </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Experience:</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {skill.experience_level} • {skill.years_experience}
                                  </Badge>
                          </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">AI Confidence:</span>
                                  <div className="flex items-center gap-1 flex-1">
                                    <Progress value={(skill.confidence || 0) * 100} className="flex-1 h-2" />
                                    <span className="text-xs font-medium">{Math.round((skill.confidence || 0) * 100)}%</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground">Market Demand:</span>
                                  <Badge 
                                    variant={skill.market_demand === 'high' ? 'default' : skill.market_demand === 'medium' ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                            {skill.market_demand} demand
                          </Badge>
                        </div>

                                {skill.context && (
                                  <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                                    <span className="font-medium">Context:</span> {skill.context}
                                  </div>
                                )}

                                {skill.proficiency_indicators && skill.proficiency_indicators.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-xs text-muted-foreground">Detected from:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {skill.proficiency_indicators.map((indicator: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                          {indicator}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )) : (
                            <div className="text-center text-muted-foreground py-8">
                              No skills data available
                            </div>
                          )}
                      </div>

                      {/* Market Analysis Section */}
                      {analysisResult.agent_results.skills.data.market_analysis && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">📊 Market Intelligence</h3>
                          
                          {/* High Demand Skills */}
                          {analysisResult.agent_results.skills.data.market_analysis.high_demand_skills && (
                            <Card className="bg-green-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-green-800 text-base">🔥 High Demand Skills</CardTitle>
                                <CardDescription className="text-green-700">
                                  These skills from your resume are currently in high demand in the job market
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex flex-wrap gap-2">
                                  {analysisResult.agent_results.skills.data.market_analysis.high_demand_skills.map((skill: string, idx: number) => (
                                    <Badge key={idx} className="bg-green-100 text-green-800 border-green-200">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Salary Impact */}
                          {analysisResult.agent_results.skills.data.market_analysis.salary_impact && (
                            <Card className="bg-blue-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-blue-800 text-base">💰 Salary Impact Analysis</CardTitle>
                                <CardDescription className="text-blue-700">
                                  How your skills impact potential salary ranges
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {analysisResult.agent_results.skills.data.market_analysis.salary_impact.high_value && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">High Value Skills (Premium Salary Impact):</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {analysisResult.agent_results.skills.data.market_analysis.salary_impact.high_value.map((skill: string, idx: number) => (
                                        <Badge key={idx} className="bg-blue-100 text-blue-800 border-blue-200">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {analysisResult.agent_results.skills.data.market_analysis.salary_impact.moderate_value && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">Moderate Value Skills:</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {analysisResult.agent_results.skills.data.market_analysis.salary_impact.moderate_value.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="secondary">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Skill Gaps & Recommendations */}
                          {analysisResult.agent_results.skills.data.skill_gaps && (
                            <Card className="bg-orange-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-orange-800 text-base">🎯 Skill Development Opportunities</CardTitle>
                                <CardDescription className="text-orange-700">
                                  AI-identified gaps and recommendations to enhance your profile
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {analysisResult.agent_results.skills.data.skill_gaps.suggested_additions && (
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">Recommended Skills to Add:</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {analysisResult.agent_results.skills.data.skill_gaps.suggested_additions.map((skill: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="border-orange-200 text-orange-800">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                    <p className="text-xs text-orange-600 mt-2">
                                      💡 Adding these skills could significantly improve your market competitiveness
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}

                          {/* Industry Trends */}
                          {analysisResult.agent_results.skills.data.market_analysis.industry_trends && (
                            <Card className="bg-purple-50">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-purple-800 text-base">📈 Industry Trends</CardTitle>
                                <CardDescription className="text-purple-700">
                                  Current market trends relevant to your skill set
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {analysisResult.agent_results.skills.data.market_analysis.industry_trends.map((trend: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                      <span>{trend}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No skills data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resume" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Quality Analysis</CardTitle>
                  <CardDescription>
                    Detailed assessment of your resume structure, content, and presentation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisResult.agent_results.resume.data ? (
                    <div className="space-y-6">
                      {/* Overall Score with Explanation */}
                      <div className="text-center bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
                        <div className={`text-4xl font-bold ${getScoreColor(analysisResult.agent_results.resume.data.overall_score)}`}>
                          {analysisResult.agent_results.resume.data.overall_score}%
                        </div>
                        <div className="text-muted-foreground mb-2">Overall Resume Score</div>
                        <div className="text-sm text-gray-600 max-w-md mx-auto">
                          This score reflects the overall quality of your resume based on content structure, 
                          ATS compatibility, professional presentation, and industry standards.
                        </div>
                      </div>

                      {/* Section Analysis */}
                      {analysisResult.agent_results.resume.data.section_analysis && (
                        <Card className="bg-gray-50">
                          <CardHeader>
                            <CardTitle className="text-base">📋 Section-by-Section Analysis</CardTitle>
                            <CardDescription>
                              Detailed breakdown of each resume section with specific recommendations
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {Object.entries(analysisResult.agent_results.resume.data.section_analysis).map(([section, data]: [string, any]) => (
                              <div key={section} className="border rounded-lg p-4 bg-white">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold capitalize">{section.replace(/_/g, ' ')}</h4>
                                  <div className="flex items-center gap-2">
                                    {data.present !== undefined && (
                                      <Badge variant={data.present ? "default" : "destructive"} className="text-xs">
                                        {data.present ? "Present" : "Missing"}
                                      </Badge>
                                    )}
                                    {data.quality !== undefined && (
                                      <Badge variant="secondary" className="text-xs">
                                        {data.quality}% Quality
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {data.issues && data.issues.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-sm font-medium text-red-700 mb-2">Issues Identified:</h5>
                                    <ul className="space-y-1">
                                      {data.issues.map((issue: string, idx: number) => (
                                        <li key={idx} className="text-sm text-red-600 flex items-start gap-2">
                                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          {issue}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {data.recommendations && data.recommendations.length > 0 && (
                        <div>
                                    <h5 className="text-sm font-medium text-blue-700 mb-2">Recommendations:</h5>
                                    <ul className="space-y-1">
                                      {data.recommendations.map((rec: string, idx: number) => (
                                        <li key={idx} className="text-sm text-blue-600 flex items-start gap-2">
                                          <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          {rec}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Strengths and Weaknesses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="bg-green-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-green-800 text-base">✅ Strengths</CardTitle>
                            <CardDescription className="text-green-700">
                              What's working well in your resume
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                          <ul className="space-y-2">
                              {analysisResult.agent_results.resume.data.strengths && Array.isArray(analysisResult.agent_results.resume.data.strengths) ? 
                                analysisResult.agent_results.resume.data.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{strength}</span>
                              </li>
                                )) : (
                                  <li className="text-sm text-muted-foreground">No strengths data available</li>
                                )}
                          </ul>
                          </CardContent>
                        </Card>

                        <Card className="bg-yellow-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-yellow-800 text-base">⚠️ Areas to Improve</CardTitle>
                            <CardDescription className="text-yellow-700">
                              Opportunities for enhancement
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                          <ul className="space-y-2">
                              {analysisResult.agent_results.resume.data.weaknesses && Array.isArray(analysisResult.agent_results.resume.data.weaknesses) ? 
                                analysisResult.agent_results.resume.data.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{weakness}</span>
                              </li>
                                )) : (
                                  <li className="text-sm text-muted-foreground">No weaknesses data available</li>
                                )}
                          </ul>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Priority Improvements */}
                      {analysisResult.agent_results.resume.data.priority_improvements && (
                        <Card className="bg-orange-50">
                          <CardHeader>
                            <CardTitle className="text-orange-800 text-base">🎯 Priority Improvements</CardTitle>
                            <CardDescription className="text-orange-700">
                              Most impactful changes you can make, ranked by priority and effort required
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {analysisResult.agent_results.resume.data.priority_improvements && Array.isArray(analysisResult.agent_results.resume.data.priority_improvements) ? 
                                analysisResult.agent_results.resume.data.priority_improvements.slice(0, 3).map((improvement: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-4 bg-white">
                                    <div className="flex items-center gap-2 mb-3">
                                  <Badge variant={improvement.priority === 'high' ? 'destructive' : improvement.priority === 'medium' ? 'secondary' : 'outline'}>
                                    {improvement.priority} priority
                                  </Badge>
                                      <span className="font-medium capitalize">{improvement.area}</span>
                                </div>
                                    <p className="text-sm text-gray-600 mb-3">{improvement.description}</p>
                                    
                                    {improvement.action_items && improvement.action_items.length > 0 && (
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Action Items:</h5>
                                        <ul className="space-y-1">
                                          {improvement.action_items.map((action: string, idx: number) => (
                                            <li key={idx} className="text-sm flex items-start gap-2">
                                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                              {action}
                                            </li>
                                          ))}
                                        </ul>
                              </div>
                                    )}
                                  </div>
                                )) : (
                                  <div className="text-sm text-muted-foreground">No priority improvements data available</div>
                                )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* ATS Compatibility */}
                      {analysisResult.agent_results.resume.data.ats_compatibility && (
                        <Card className="bg-blue-50">
                          <CardHeader>
                            <CardTitle className="text-blue-800 text-base">🤖 ATS Compatibility Analysis</CardTitle>
                            <CardDescription className="text-blue-700">
                              How well your resume works with Applicant Tracking Systems
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Overall ATS Score:</span>
                              <div className="flex items-center gap-2">
                                <Progress value={analysisResult.agent_results.resume.data.ats_compatibility.score || 0} className="w-20" />
                                <span className="text-sm font-bold">{analysisResult.agent_results.resume.data.ats_compatibility.score || 0}%</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-blue-600">
                                  {analysisResult.agent_results.resume.data.ats_compatibility.keyword_density || 0}%
                                </div>
                                <div className="text-xs text-muted-foreground">Keyword Density</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-blue-600">
                                  {analysisResult.agent_results.resume.data.ats_compatibility.format_compatibility || 0}%
                                </div>
                                <div className="text-xs text-muted-foreground">Format Compatibility</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-blue-600">
                                  {analysisResult.agent_results.resume.data.ats_compatibility.section_headers || 0}%
                                </div>
                                <div className="text-xs text-muted-foreground">Section Headers</div>
                              </div>
                            </div>

                            {analysisResult.agent_results.resume.data.ats_compatibility.recommendations && (
                              <div className="mt-4">
                                <h5 className="text-sm font-medium mb-2">ATS Optimization Tips:</h5>
                                <ul className="space-y-1">
                                  {analysisResult.agent_results.resume.data.ats_compatibility.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx} className="text-sm flex items-start gap-2">
                                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                          </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Content Quality Metrics */}
                      {analysisResult.agent_results.resume.data.content_quality && (
                        <Card className="bg-purple-50">
                          <CardHeader>
                            <CardTitle className="text-purple-800 text-base">📝 Content Quality Metrics</CardTitle>
                            <CardDescription className="text-purple-700">
                              Analysis of writing quality, readability, and professional language use
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-purple-600">
                                  {analysisResult.agent_results.resume.data.content_quality.readability_score || 0}%
                                </div>
                                <div className="text-xs text-muted-foreground">Readability</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-purple-600">
                                  {analysisResult.agent_results.resume.data.content_quality.professional_language || 0}%
                                </div>
                                <div className="text-xs text-muted-foreground">Professional Language</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-purple-600">
                                  {analysisResult.agent_results.resume.data.content_quality.action_verbs_count || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Action Verbs</div>
                              </div>
                              <div className="text-center p-3 bg-white rounded">
                                <div className="text-lg font-bold text-purple-600">
                                  {analysisResult.agent_results.resume.data.content_quality.quantifiable_achievements || 0}
                                </div>
                                <div className="text-xs text-muted-foreground">Quantified Results</div>
                              </div>
                            </div>

                            {analysisResult.agent_results.resume.data.content_quality.improvement_areas && (
                              <div>
                                <h5 className="text-sm font-medium mb-2">Content Improvement Areas:</h5>
                                <ul className="space-y-1">
                                  {analysisResult.agent_results.resume.data.content_quality.improvement_areas.map((area: string, idx: number) => (
                                    <li key={idx} className="text-sm flex items-start gap-2">
                                      <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-600" />
                                      {area}
                                    </li>
                                  ))}
                                </ul>
                        </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No resume analysis data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Next Steps & Recommendations</CardTitle>
                  <CardDescription>
                    Actionable steps to improve your resume and job prospects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.final_assessment?.next_steps?.for_candidate && Array.isArray(analysisResult.final_assessment.next_steps.for_candidate) ? 
                      analysisResult.final_assessment.next_steps.for_candidate.map((step: string, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm">{step}</p>
                        </div>
                      </div>
                      )) : (
                        <div className="text-sm text-muted-foreground">No next steps data available</div>
                      )}
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
                    <p className="text-sm text-blue-800">
                      Focus on the high-priority improvements first for maximum impact. 
                      Consider using the job matching feature by adding a specific job description 
                      to get targeted recommendations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <motion.div className="flex justify-center gap-4" variants={fadeInUp}>
            <Button variant="outline" className="flex items-center gap-2 border-purple-200 hover:bg-purple-50">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
              <FileText className="mr-2 h-4 w-4" />
              Save Analysis
            </Button>
          </motion.div>
        </motion.div>
      )}
      </motion.div>

      {/* Pre-Analysis Form Modal */}
      <AnimatePresence>
        {showPreAnalysisForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPreAnalysisForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <PreAnalysisForm
                onSubmit={handlePreAnalysisSubmit}
                isLoading={isAnalyzing}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Iterative Feedback Modal */}
      <AnimatePresence>
        {showIterativeFeedback && analysisResult && currentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowIterativeFeedback(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <IterativeFeedbackForm
                analysisResult={analysisResult.final_assessment}
                onSubmitFeedback={handleIterativeFeedback}
                isLoading={refinementLoading}
                remainingIterations={(currentSession.max_iterations || 3) - (currentSession.current_iteration || 0)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
