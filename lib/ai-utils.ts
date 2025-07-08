// AI utilities for resume analysis and job matching with advanced agentic capabilities

import type {
  MatchResult,
  SkillMatch,
  ResumeAnalysis,
  PredictiveAnalysis,
  FeedbackAnalysis,
  CandidateInsights,
  EmployeeMetrics,
} from "@/types/ai"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Advanced AI matching types
export interface MatchedEmployee {
  employee_id: number
  employee_name: string
  employee_position: string
  employee_company: string
  overall_score: number
  confidence_level: number
  score_breakdown: {
    skills_alignment: number
    career_relevance: number
    performance_metrics: number
    engagement_score: number
    neutrality_score: number
  }
  match_reasoning?: {
    skills_alignment?: {
      score: number
      technical_overlap: string[]
      domain_expertise: string
      learning_opportunities: string[]
      depth_compatibility: string
    }
    career_relevance?: {
      score: number
      role_alignment: string
      industry_experience: string
      progression_pattern: string
      mentorship_potential: string
    }
    performance_indicators?: {
      score: number
      success_rate: string
      total_referrals: string
      platform_engagement: string
      candidate_satisfaction: string
    }
    availability_factors?: {
      score: number
      recent_activity: string
      response_likelihood: string
      current_workload: string
    }
  }
  referral_success_prediction?: {
    probability: number
    timeline_estimate: string
    success_factors: string[]
    potential_challenges: string[]
  }
  actionable_insights?: {
    why_this_match: string
    approach_strategy: string
    conversation_starters: string[]
    value_proposition: string
  }
}

export interface CandidateMatchingResponse {
  success: boolean
  matches: MatchedEmployee[]
  summary: {
    total_evaluated: number
    quality_distribution: {
      excellent: number
      good: number
      fair: number
    }
    average_score: number
    top_score?: number
    success_patterns: string[]
  }
  total_evaluated: number
  matching_quality: string
  message: string
}

export interface CandidateMatchingRequest {
  candidate_id: number
  target_company?: string
  target_role?: string
  max_matches?: number
  preferences?: {
    prioritize_performance?: boolean
    prioritize_skills?: boolean
    prioritize_mentorship?: boolean
    response_time_importance?: 'low' | 'medium' | 'high'
  }
}

/**
 * Find optimal employee matches for a candidate using advanced AI algorithms
 */
export async function findOptimalEmployeeMatches(
  request: CandidateMatchingRequest
): Promise<CandidateMatchingResponse> {
  try {
    // Use the new GET endpoint for automatic matching
    const queryParams = new URLSearchParams()
    if (request.target_company) {
      queryParams.append('target_company', request.target_company)
    }
    if (request.max_matches) {
      queryParams.append('max_matches', request.max_matches.toString())
    }
    
    const url = `${API_BASE_URL}/api/ai/candidate-matching${queryParams.toString() ? '?' + queryParams.toString() : ''}`
    
    // Get access token using the same method as auth.ts
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      throw new Error('User not authenticated - no access token')
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(`Matching failed: ${errorData.detail || response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Matching failed')
    }

    return result
  } catch (error) {
    console.error('AI matching error:', error)
    throw error
  }
}

/**
 * Get matching recommendations for current user (candidate)
 */
export async function getMyOptimalMatches(
  targetCompany?: string,
  maxMatches: number = 5
): Promise<CandidateMatchingResponse> {
  // Get current user using the same key as auth.ts
  const userStr = localStorage.getItem('user_data')
  if (!userStr) {
    throw new Error('User not authenticated - no user data')
  }
  
  const user = JSON.parse(userStr)
  if (user.role !== 'candidate') {
    throw new Error('Only candidates can request employee matching')
  }

  // Use the GET endpoint that automatically uses the authenticated user
  return findOptimalEmployeeMatches({
    candidate_id: user.id, // This will be ignored by the GET endpoint
    target_company: targetCompany,
    max_matches: maxMatches
  })
}

/**
 * Enhanced matching with specific preferences - calls the new customized matching endpoint
 */
export async function getPersonalizedMatches(
  preferences: {
    targetCompany?: string
    targetRole?: string
    prioritizePerformance?: boolean
    prioritizeSkills?: boolean
    prioritizeMentorship?: boolean
    responseTimeImportance?: 'low' | 'medium' | 'high'
    experienceLevel?: string
    specificSkills?: string
    additionalRequirements?: string
  },
  maxMatches: number = 5
): Promise<CandidateMatchingResponse> {
  const userStr = localStorage.getItem('user_data')
  if (!userStr) {
    throw new Error('User not authenticated - no user data')
  }
  
  const user = JSON.parse(userStr)
  if (user.role !== 'candidate') {
    throw new Error('Only candidates can request employee matching')
  }

  // Determine priority focus based on boolean flags
  let priorityFocus = 'balanced'
  if (preferences.prioritizeSkills) {
    priorityFocus = 'skills'
  } else if (preferences.prioritizePerformance) {
    priorityFocus = 'performance'
  } else if (preferences.prioritizeMentorship) {
    priorityFocus = 'mentorship'
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/customized-matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        target_company: preferences.targetCompany,
        target_role: preferences.targetRole,
        priority_focus: priorityFocus,
        experience_level: preferences.experienceLevel || 'any',
        specific_skills: preferences.specificSkills,
        response_time_importance: preferences.responseTimeImportance || 'medium',
        additional_requirements: preferences.additionalRequirements,
        max_matches: maxMatches
      })
    })

    if (!response.ok) {
      throw new Error(`Customized matching failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.message || 'Customized matching failed')
    }

    return result
  } catch (error) {
    console.error('Customized matching error:', error)
    throw error
  }
}

/**
 * Get cached Smart Matching results
 */
export async function getCachedSmartMatches(): Promise<CandidateMatchingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/cached-smart-matches`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get cached matches: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error getting cached smart matches:', error)
    throw error
  }
}

/**
 * Cache Smart Matching results
 */
export async function cacheSmartMatches(matchesData: any): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/cache-smart-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(matchesData)
    })

    if (!response.ok) {
      throw new Error(`Failed to cache matches: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error caching smart matches:', error)
    throw error
  }
}

/**
 * Generate a hash for customization preferences
 */
function generatePreferencesHash(preferences: any): string {
  const prefsString = JSON.stringify(preferences, Object.keys(preferences).sort())
  // Simple hash function for preferences
  let hash = 0
  for (let i = 0; i < prefsString.length; i++) {
    const char = prefsString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Get cached Customized Matching results for specific preferences
 */
export async function getCachedCustomizedMatches(preferences: any): Promise<CandidateMatchingResponse> {
  try {
    const preferencesHash = generatePreferencesHash(preferences)
    
    const response = await fetch(`${API_BASE_URL}/api/ai/cached-customized-matches?preferences_hash=${preferencesHash}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get cached customized matches: ${response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error getting cached customized matches:', error)
    throw error
  }
}

/**
 * Cache Customized Matching results with preferences
 */
export async function cacheCustomizedMatches(matchesData: any, preferences: any): Promise<void> {
  try {
    const preferencesHash = generatePreferencesHash(preferences)
    
    const response = await fetch(`${API_BASE_URL}/api/ai/cache-customized-matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        matches_data: matchesData,
        preferences_hash: preferencesHash
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to cache customized matches: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error caching customized matches:', error)
    throw error
  }
}

// Enhanced resume analysis with comprehensive AI pipeline
export async function analyzeResume(resumeText: string, jobDescription?: string): Promise<ResumeAnalysis> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/comprehensive-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
        analysis_type: 'comprehensive'
      })
    })

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.detail || 'Analysis failed')
    }

    // Transform the comprehensive analysis result to match our ResumeAnalysis type
    const analysisData = result.data
    const agentResults = analysisData.agent_results
    const finalAssessment = analysisData.final_assessment

    // Extract skills from skills agent
    const skillsData = agentResults.skills?.data || {}
    const extractedSkills = skillsData.extracted_skills || []

    // Extract resume analysis from resume agent
    const resumeData = agentResults.resume?.data || {}

    // Transform to our expected format
    return {
      skills: extractedSkills.map((skill: any) => ({
        name: skill.skill,
        level: skill.experience_level,
        years: parseInt(skill.years_experience) || 0,
        confidence: skill.confidence,
        trending: skill.category === 'emerging_skills'
      })),
      experience: resumeData.section_analysis?.work_experience?.positions || [
        {
          title: "Experience Analysis",
          company: "AI Analysis",
          duration: "Comprehensive",
          highlights: finalAssessment?.executive_summary?.key_strengths || [
            "Professional experience analyzed",
            "Career progression evaluated",
            "Skills alignment assessed"
          ],
          technologies: extractedSkills.slice(0, 8).map((s: any) => s.skill),
          impact: `Overall assessment: ${finalAssessment?.executive_summary?.overall_assessment || 'good'}`
        }
      ],
      education: resumeData.section_analysis?.education?.degrees || [
        {
          degree: "Education Analysis",
          institution: "AI Assessment",
          year: new Date().getFullYear().toString(),
          gpa: "N/A",
          relevantCourses: extractedSkills.slice(0, 5).map((s: any) => s.skill)
        }
      ],
      summary: finalAssessment?.executive_summary?.recommendation || 
        "Comprehensive AI analysis completed with detailed insights and recommendations.",
      strengths: finalAssessment?.executive_summary?.key_strengths || [
        "Strong technical foundation",
        "Relevant experience",
        "Good skill alignment"
      ],
      improvementAreas: finalAssessment?.executive_summary?.key_concerns || [
        "Continue skill development",
        "Enhance resume presentation",
        "Focus on market alignment"
      ],
      careerLevel: determineCareerLevel(extractedSkills, resumeData),
      salaryRange: estimateSalaryRange(extractedSkills, resumeData),
      marketDemand: determineMarketDemand(skillsData.market_analysis),
      aiConfidence: result.metadata?.confidence || 0.85
    }
  } catch (error) {
    console.error('Resume analysis error:', error)
    throw error
  }
}

// Advanced job matching with semantic analysis
export async function matchResumeToJob(resumeText: string, jobDescription: string): Promise<MatchResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/job-matching`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
        include_recommendations: true
      })
    })

    if (!response.ok) {
      throw new Error(`Job matching failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.detail || 'Job matching failed')
    }

    const matchingData = result.data
    const skillsAnalysis = matchingData.skills_analysis?.technical_skills || {}

  return {
      overallScore: matchingData.overall_match_score || 0,
      jobFit: matchingData.match_category || 'fair',
      skillMatches: (skillsAnalysis.matched_skills || []).map((skill: any) => ({
        skill: skill.skill,
        match: skill.match_score / 100,
        required: skill.importance === 'critical',
        level: skill.resume_level
      })),
      missingSkills: (skillsAnalysis.missing_skills || []).map((skill: any) => skill.skill),
      strongSkills: skillsAnalysis.strengths || [],
      improvementSuggestions: (matchingData.improvement_recommendations || []).map((rec: any) => 
        `${rec.area}: ${rec.specific_actions?.join(', ') || 'Focus on improvement'}`
      ),
      interviewProbability: matchingData.interview_probability || 0,
      competitionLevel: matchingData.competitive_positioning?.market_competitiveness || 'average',
    marketInsights: {
         averageSalary: estimateAverageSalary(matchingData),
         demandLevel: matchingData.advanced_metrics?.growth_potential > 70 ? 'High' : 'Medium',
         growthProjection: matchingData.advanced_metrics?.growth_potential > 70 ? '+15%' : '+8%',
         topCompanies: ["Google", "Meta", "Amazon", "Microsoft"]
       }
    }
  } catch (error) {
    console.error('Job matching error:', error)
    throw error
  }
}

// Skills extraction with advanced categorization
export async function extractSkills(resumeText: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/skills-extraction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        resume_text: resumeText
      })
    })

    if (!response.ok) {
      throw new Error(`Skills extraction failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.detail || 'Skills extraction failed')
    }

    return result.data
     } catch (error) {
     console.error('Skills extraction error:', error)
     throw error instanceof Error ? error : new Error('Skills extraction failed')
   }
}

// Resume quality analysis
export async function analyzeResumeQuality(resumeText: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/resume-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        resume_text: resumeText
      })
    })

    if (!response.ok) {
      throw new Error(`Resume analysis failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.detail || 'Resume analysis failed')
    }

    return result.data
  } catch (error) {
    console.error('Resume quality analysis error:', error)
    throw error
  }
}

// Find similar resumes using vector search
export async function findSimilarResumes(queryText: string, limit: number = 5): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/similar-resumes?query=${encodeURIComponent(queryText)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Similar resumes search failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.detail || 'Similar resumes search failed')
    }

    return result.data
  } catch (error) {
    console.error('Similar resumes search error:', error)
    throw error
  }
}

// Get AI service health status
export async function getAIHealthStatus(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`, {
      method: 'GET'
    })

    const result = await response.json()
    
    // Transform the backend response to match frontend expectations
  return {
      healthy: result.status === 'healthy',
      status: result.status,
      components: result.components,
      metadata: result.metadata
    }
  } catch (error) {
    console.error('AI health check error:', error)
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Helper functions
function determineCareerLevel(skills: any[], resumeData: any): "Junior" | "Mid" | "Senior" | "Lead" | "Principal" {
  const skillCount = skills.length
  const experienceIndicators = resumeData.preliminary_metrics?.experience_indicators || {}
  
  if (experienceIndicators.resume_level === 'principal' || skillCount > 25) return "Principal"
  if (experienceIndicators.resume_level === 'senior' || skillCount > 20) return "Senior"
  if (experienceIndicators.resume_level === 'mid' || skillCount > 15) return "Mid"
  return "Junior"
}

function estimateSalaryRange(skills: any[], resumeData: any): { min: number; max: number } {
  const baseMin = 60000
  const baseMax = 80000
  const skillMultiplier = Math.min(skills.length * 2000, 40000)

  return {
    min: baseMin + skillMultiplier,
    max: baseMax + skillMultiplier + 20000
  }
}

function determineMarketDemand(marketAnalysis: any): "Low" | "Medium" | "High" {
  if (!marketAnalysis) return "Medium"
  
  const demandLevel = marketAnalysis.market_demand?.overall_demand
  if (demandLevel === 'high') return "High"
  if (demandLevel === 'low') return "Low"
  return "Medium"
}

function estimateAverageSalary(matchingData: any): number {
  const salaryAlignment = matchingData.salary_alignment
  if (salaryAlignment?.job_offer_range) {
    // Parse salary range if available
    const range = salaryAlignment.job_offer_range
    if (typeof range === 'string') {
      const numbers = range.match(/\d+/g)
      if (numbers && numbers.length >= 2) {
        return (parseInt(numbers[0]) + parseInt(numbers[1])) / 2 * 1000
      }
    }
  }
  
  // Default estimation based on match score
  const baseScore = matchingData.overall_match_score || 50
  return 60000 + (baseScore * 1000)
}

// Legacy function for backward compatibility
// Privacy and Consent Management
export async function grantConsent(consentType: string, granted: boolean): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        consent_type: consentType,
        granted: granted
      })
    })

    if (!response.ok) {
      throw new Error(`Consent update failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Consent management error:', error)
    throw error
  }
}

export async function getConsentStatus(consentType: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/consent/${consentType}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Consent check failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Consent check error:', error)
    throw error
  }
}

// Market Intelligence
export async function getMarketIntelligence(skills: string[], includeSalaryData: boolean = true, cacheDurationHours: number = 1): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/market-intelligence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        skills: skills,
        include_salary_data: includeSalaryData,
        include_trend_analysis: true,
        cache_duration_hours: cacheDurationHours
      })
    })

    if (!response.ok) {
      throw new Error(`Market intelligence failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Market intelligence error:', error)
    throw error
  }
}

export async function getSkillDemand(skill: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/skill-demand/${encodeURIComponent(skill)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Skill demand analysis failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Skill demand error:', error)
    throw error
  }
}

export async function refreshMarketData(skills: string[]): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/refresh-market-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        skills: skills,
        include_salary_data: true,
        include_trend_analysis: true
      })
    })

    if (!response.ok) {
      throw new Error(`Market data refresh failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Market data refresh error:', error)
    throw error
  }
}

export async function getMarketStats(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/market-stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Market stats failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Market stats error:', error)
    throw error
  }
}

// Enhanced Analysis Sessions
export async function createAnalysisSession(
  resumeText: string, 
  jobDescription?: string,
  preAnalysisInput?: {
    roadmap_duration_weeks?: number
    career_goals?: string[]
    learning_time_hours_per_week?: number
    priority_areas?: string[]
  }
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analysis-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
        pre_analysis_input: preAnalysisInput
      })
    })

    if (!response.ok) {
      throw new Error(`Analysis session creation failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Analysis session creation error:', error)
    throw error
  }
}

export async function getAnalysisSession(sessionToken: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analysis-session/${sessionToken}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Get analysis session failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Get analysis session error:', error)
    throw error
  }
}

export async function submitAnalysisFeedback(
  sessionToken: string,
  feedbackData: {
    feedback_type: string
    feedback_text: string
    specific_areas?: string[]
    satisfaction_score?: number
    reanalysis_requested?: boolean
  }
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analysis-session/${sessionToken}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(feedbackData)
    })

    if (!response.ok) {
      throw new Error(`Feedback submission failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Feedback submission error:', error)
    throw error
  }
}

export async function requestAnalysisRefinement(
  sessionToken: string,
  refinementRequest: {
    feedback_type: string
    feedback_text: string
    specific_areas: string[]
  }
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analysis-session/${sessionToken}/refine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(refinementRequest)
    })

    if (!response.ok) {
      throw new Error(`Analysis refinement failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Analysis refinement error:', error)
    throw error
  }
}

export async function completeAnalysisSession(sessionToken: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analysis-session/${sessionToken}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    })

    if (!response.ok) {
      throw new Error(`Session completion failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Session completion error:', error)
    throw error
  }
}

export async function generatePredictiveAnalysis(
  analysis: ResumeAnalysis,
  jobContext: { description: string }
): Promise<PredictiveAnalysis> {
  // Use the comprehensive analysis for predictive insights
  try {
    const matchResult = await matchResumeToJob(
      `Skills: ${analysis.skills.map(s => s.name).join(', ')}. Experience: ${analysis.experience.map(e => e.title).join(', ')}.`,
      jobContext.description
    )

  return {
       hiringProbability: matchResult.interviewProbability || 65,
       timeToHire: 14,
       salaryNegotiationRange: { 
         min: analysis.salaryRange?.min || 60000, 
         max: analysis.salaryRange?.max || 100000 
       },
       retentionProbability: 85,
       performancePrediction: Math.min(matchResult.overallScore + 5, 100),
       cultureFitScore: Math.min(matchResult.overallScore + 10, 100),
       factors: [
         {
           factor: "Skills Alignment",
           score: Math.min(analysis.skills.length * 4, 100),
           impact: 0.3
         },
         {
           factor: "Experience Relevance", 
           score: Math.min(analysis.experience.length * 25, 100),
           impact: 0.25
         },
         {
           factor: "Market Demand",
           score: analysis.marketDemand === "High" ? 90 : analysis.marketDemand === "Medium" ? 70 : 50,
           impact: 0.2
         }
       ],
       recommendations: matchResult.improvementSuggestions.slice(0, 5),
       riskFactors: ["Market competition", "Skill alignment gaps"],
       confidenceLevel: 0.85
     }
  } catch (error) {
    console.error('Predictive analysis error:', error)
    // Return fallback data
    return {
      hiringProbability: 65,
      timeToHire: 14,
      salaryNegotiationRange: { min: 60000, max: 100000 },
      retentionProbability: 80,
      performancePrediction: 70,
      cultureFitScore: 75,
      factors: [
        { factor: "Skills Match", score: 70, impact: 0.4 },
        { factor: "Experience", score: 65, impact: 0.35 },
        { factor: "Cultural Fit", score: 75, impact: 0.25 }
      ],
      recommendations: [
        "Enhance technical skills presentation",
        "Highlight relevant project experience",
        "Improve resume formatting and structure"
      ],
      riskFactors: ["Limited data for analysis"],
      confidenceLevel: 0.6
    }
  }
}

// Enhanced Analysis Functions with Iterative Refinement

export interface PreAnalysisPreferences {
  roadmapDuration: number;
  careerGoals: string;
  targetRole: string;
  targetCompany: string;
  salaryExpectations: string;
  preferredIndustries: string[];
  learningTimeCommitment: number;
  priorityAreas: string[];
}

export interface EnhancedAnalysisRequest {
  resume_text: string;
  job_description?: string;
  preferences: PreAnalysisPreferences;
}

export interface FeedbackData {
  satisfaction: number;
  areas_to_improve: string[];
  specific_feedback: string;
  focus_changes: string[];
}

export interface IterationRequest {
  feedback_data: FeedbackData;
  improvement_areas: string[];
}

export async function performEnhancedAnalysis(request: EnhancedAnalysisRequest): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/enhanced-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Enhanced analysis failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    throw error;
  }
}

export async function requestAnalysisIteration(sessionKey: string, request: IterationRequest): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analysis-iteration/${sessionKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Analysis iteration failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Analysis iteration error:', error);
    throw error;
  }
}

export async function checkVectorReadiness(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/vector-readiness`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
    });

    if (!response.ok) {
      throw new Error(`Vector readiness check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Vector readiness check error:', error);
    throw error;
  }
}
