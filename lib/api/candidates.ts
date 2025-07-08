import { authClient } from "../auth"

const API_BASE_URL = "http://localhost:8000"

// Simple HTTP client wrapper
class HttpClient {
  async get(url: string) {
    const session = authClient.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers,
      cache: 'no-store', // Disable caching
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const errorData = await response.json()
        errorDetails = errorData.detail || errorData.message || JSON.stringify(errorData)
      } catch (e) {
        errorDetails = `Status ${response.status}: ${response.statusText}`
      }
      throw new Error(`API Error: ${errorDetails}`)
    }

    const data = await response.json()
    return data
  }

  async put(url: string, data: any) {
    const session = authClient.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      let errorDetails = ''
      try {
        const errorData = await response.json()
        errorDetails = errorData.detail || errorData.message || JSON.stringify(errorData)
      } catch (e) {
        errorDetails = `Status ${response.status}: ${response.statusText}`
      }
      throw new Error(`API Error: ${errorDetails}`)
    }

    const result = await response.json()
    return result
  }
}

const httpClient = new HttpClient()

// Type definitions
export interface Candidate {
  id: number
  name: string
  email: string
  role: string
  position?: string
  company?: string
  department?: string
  bio?: string
  skills: string[]
  experience_years?: number
  avatar_url?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface CandidateProject {
  id: number
  name: string
  description?: string
  technologies: string[]
  impact?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  url?: string
}

export interface CandidateEducation {
  id: number
  degree: string
  institution: string
  field_of_study?: string
  graduation_year?: number
  gpa?: number
  description?: string
}

export interface CandidateCertification {
  id: number
  name: string
  issuing_organization: string
  issue_date?: string
  expiration_date?: string
  credential_id?: string
  credential_url?: string
}

export interface CandidateLanguage {
  language: string
  proficiency: 'basic' | 'conversational' | 'professional' | 'native'
}

export interface CandidateAchievement {
  id: number
  title: string
  description?: string
  date_achieved?: string
  category?: string
  verification_url?: string
}

export interface DetailedCandidateProfile {
  // Basic info
  id: number
  name: string
  email: string
  role: string
  position?: string
  company?: string
  department?: string
  bio?: string
  skills: string[]
  experience_years?: number
  avatar_url?: string
  
  // Activity data
  last_active: string
  recent_activity_count: number
  is_logged_out: boolean
  
  // Status flags
  is_verified: boolean
  is_active: boolean
  
  // Rich profile data
  projects: CandidateProject[]
  education: CandidateEducation[]
  certifications: CandidateCertification[]
  languages: CandidateLanguage[]
  achievements: CandidateAchievement[]
  
  // Metadata
  location?: string
  joined_date: string
  created_at: string
  updated_at: string
}

export interface CandidateSearchParams {
  search?: string
  department?: string
  skills?: string
  experience_min?: number
  experience_max?: number
  sort_by?: 'name' | 'experience'
  limit?: number
  offset?: number
}

export interface CandidateSearchResponse {
  candidates: Candidate[]
  total_count: number
  departments: string[]
}

export interface CandidateProfileUpdateData {
  bio?: string
  position?: string
  department?: string
  experience_years?: number
  skills?: string[]
  avatar_url?: string
  company?: string
  location?: string
  projects?: Array<{
    name: string
    description?: string
    technologies: string[]
    impact?: string
    start_date?: string
    end_date?: string
    is_current?: boolean
    url?: string
  }>
  education?: Array<{
    degree: string
    institution: string
    field_of_study?: string
    graduation_year?: number
    gpa?: number
    description?: string
  }>
  certifications?: Array<{
    name: string
    issuing_organization: string
    issue_date?: string
    expiration_date?: string
    credential_id?: string
    credential_url?: string
  }>
  languages?: Array<{
    language: string
    proficiency: 'basic' | 'conversational' | 'professional' | 'native'
  }>
  achievements?: Array<{
    title: string
    description?: string
    date_achieved?: string
    category?: string
    verification_url?: string
  }>
}

export class CandidateAPI {
  static async searchCandidates(params?: CandidateSearchParams): Promise<CandidateSearchResponse> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    
    return await httpClient.get(`/users/search-data/candidates?${queryParams.toString()}`)
  }

  static async getCandidateProfile(candidateId: number): Promise<DetailedCandidateProfile> {
    // Add cache-busting timestamp to ensure fresh data
    const timestamp = Date.now()
    return await httpClient.get(`/users/candidates/${candidateId}/profile?t=${timestamp}`)
  }

  static async updateCandidateProfile(
    candidateId: number, 
    data: CandidateProfileUpdateData
  ): Promise<DetailedCandidateProfile> {
    return await httpClient.put(`/users/candidates/${candidateId}/profile`, data)
  }
} 