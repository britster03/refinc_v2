// Enhanced types for AI-related features with comprehensive data structures

export interface Skill {
  name: string
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  years: number
  confidence?: number
  trending?: boolean
}

export interface Experience {
  title: string
  company: string
  duration: string
  highlights: string[]
  technologies?: string[]
  impact?: string
}

export interface Education {
  degree: string
  institution: string
  year: string
  gpa?: string
  relevantCourses?: string[]
}

export interface ResumeAnalysis {
  skills: Skill[]
  experience: Experience[]
  education: Education[]
  summary: string
  strengths?: string[]
  improvementAreas?: string[]
  careerLevel?: "Junior" | "Mid" | "Senior" | "Lead" | "Principal"
  salaryRange?: { min: number; max: number }
  marketDemand?: "Low" | "Medium" | "High"
  aiConfidence?: number
}

export interface SkillMatch {
  skill: string
  required: boolean
  match: number
  importance?: "low" | "medium" | "high" | "critical"
  marketDemand?: "low" | "medium" | "high"
}

export interface MatchResult {
  overallScore: number
  skillMatches: SkillMatch[]
  missingSkills: string[]
  strongSkills: string[]
  improvementSuggestions: string[]
  jobFit: "Poor" | "Low" | "Moderate" | "Strong" | "Excellent"
  salaryAlignment?: {
    candidateRange: { min: number; max: number }
    jobRange: { min: number; max: number }
    alignment: "Poor" | "Fair" | "Good" | "Excellent"
  }
  cultureFit?: number
  interviewProbability?: number
  hiringProbability?: number
  competitionLevel?: "Low" | "Medium" | "High"
  marketInsights?: {
    demandLevel: string
    averageSalary: number
    growthProjection: string
    topCompanies: string[]
  }
}

export interface FeedbackAnalysis {
  sentiment: "positive" | "neutral" | "negative"
  score: number
  confidence?: number
  keyPoints: string[]
  themes?: Array<{
    theme: string
    mentions: number
    sentiment: "positive" | "neutral" | "negative"
  }>
  emotionalTone?: string
  actionableInsights?: string[]
  comparisonToAverage?: {
    betterThan: number
    category: string
  }
}

export interface PredictiveAnalysis {
  hiringProbability: number
  timeToHire: number
  salaryNegotiationRange: { min: number; max: number }
  retentionProbability: number
  performancePrediction: number
  cultureFitScore: number
  factors: Array<{
    factor: string
    impact: number
    score: number
  }>
  recommendations: string[]
  riskFactors: string[]
  confidenceLevel: number
}

export interface CandidateInsights {
  overallRating: number
  strengths: string[]
  weaknesses: string[]
  skillGaps: Array<{
    skill: string
    currentLevel: string
    requiredLevel: string
    priority: "Low" | "Medium" | "High"
  }>
  interviewFocus: string[]
  developmentPlan: string[]
  marketComparison: {
    percentile: number
    averageExperience: string
    salaryBenchmark: string
  }
}

export interface EmployeeMetrics {
  totalReferrals: number
  successfulReferrals: number
  successRate: number
  averageResponseTime: number
  candidateSatisfaction: number
  monthlyTrends: Array<{
    month: string
    referrals: number
    successful: number
  }>
  topSkillsReferred: Array<{
    skill: string
    count: number
  }>
  feedbackSummary: {
    positive: number
    neutral: number
    negative: number
    commonPraise: string[]
    improvementAreas: string[]
  }
  engagementScore: number
  ranking: {
    companyRank: number
    departmentRank: number
    overallRank: number
  }
}

export interface NotificationAnalysis {
  priority: "low" | "medium" | "high" | "urgent"
  deliveryMethod: string[]
  timing: "immediate" | "batched" | "scheduled"
  personalization: string
  engagement: {
    openRate: number
    clickRate: number
    responseRate: number
  }
}

export interface MarketInsights {
  skillDemand: Array<{
    skill: string
    demand: "Low" | "Medium" | "High"
    growth: number
    averageSalary: number
  }>
  industryTrends: Array<{
    trend: string
    impact: "Low" | "Medium" | "High"
    timeframe: string
  }>
  competitorAnalysis: Array<{
    company: string
    hiringRate: number
    averagePackage: number
    requirements: string[]
  }>
}

export interface RealTimeMetrics {
  activeUsers: number
  referralsToday: number
  successfulMatches: number
  averageMatchScore: number
  topPerformingEmployees: Array<{
    id: string
    name: string
    score: number
  }>
  trendingSkills: string[]
  systemHealth: {
    uptime: number
    responseTime: number
    errorRate: number
  }
}
