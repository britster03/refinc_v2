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
      credentials: 'include',
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

    return response.json()
  }

  async post(url: string, data?: any, options?: RequestInit) {
    const session = authClient.getSession()
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string>),
    }

    // Only set Content-Type for non-FormData requests
    // For FormData, let the browser set it automatically with proper boundary
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
      credentials: 'include',
      ...options,
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

    return response.json()
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
      credentials: 'include',
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

    return response.json()
  }

  async delete(url: string) {
    const session = authClient.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
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

    return response.json()
  }
}

const httpClient = new HttpClient()

export interface ReferralCreateData {
  employee_id: number
  position: string
  department?: string
  company: string
  notes?: string
  resume_url?: string
  job_description?: string
}

export interface ReferralUpdateData {
  status?: 'pending' | 'reviewing' | 'interview_scheduled' | 'interview_completed' | 'offer_extended' | 'hired' | 'rejected'
  notes?: string
  feedback_score?: number
  feedback_comments?: string[]
  rejection_feedback?: string
}

export interface Referral {
  id: number
  candidate_id: number
  employee_id: number
  position: string
  department?: string
  company: string
  status: string
  notes?: string
  resume_url?: string
  job_description?: string
  ai_analysis_score?: number
  ai_analysis_summary?: string
  ai_analysis_details?: any
  feedback_score?: number
  feedback_comments?: string[]
  created_at: string
  updated_at: string
  candidate?: {
    id: number
    name: string
    email: string
    avatar_url?: string
  }
  employee?: {
    id: number
    name: string
    email: string
    position?: string
    company?: string
    avatar_url?: string
  }
}

export interface ReferralSearchFilter {
  status?: string
  company?: string
  department?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
}

export class ReferralAPI {
  static getFileUrl(relativeUrl: string): string {
    if (!relativeUrl) return ''
    if (relativeUrl.startsWith('http')) return relativeUrl
    
    // Remove any /api prefix that might have been incorrectly added
    let cleanUrl = relativeUrl
    if (cleanUrl.startsWith('/api/')) {
      cleanUrl = cleanUrl.replace('/api/', '/')
    }
    
    // Ensure the URL starts with a slash
    if (!cleanUrl.startsWith('/')) {
      cleanUrl = '/' + cleanUrl
    }
    
    return `${API_BASE_URL}${cleanUrl}`
  }

  static async createReferral(data: ReferralCreateData): Promise<Referral> {
    return await httpClient.post('/referrals/', data)
  }

  static async getReferrals(filters?: ReferralSearchFilter): Promise<{ referrals: Referral[], total: number }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    return await httpClient.get(`/referrals/?${params.toString()}`)
  }

  static async getReferralById(id: number): Promise<Referral> {
    return await httpClient.get(`/referrals/${id}`)
  }

  static async updateReferral(id: number, data: ReferralUpdateData): Promise<Referral> {
    return await httpClient.put(`/referrals/${id}`, data)
  }

  static async deleteReferral(id: number): Promise<void> {
    await httpClient.delete(`/referrals/${id}`)
  }

  // Get referrals for candidates (referrals they've sent)
  static async getCandidateReferrals(candidateId: number, filters?: ReferralSearchFilter): Promise<{ referrals: Referral[], total: number }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    return await httpClient.get(`/referrals/candidate/${candidateId}?${params.toString()}`)
  }

  // Get referrals for employees (referrals they've received)
  static async getEmployeeReferrals(employeeId: number, filters?: ReferralSearchFilter): Promise<{ referrals: Referral[], total: number }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    
    return await httpClient.get(`/referrals/employee/${employeeId}?${params.toString()}`)
  }

  // Upload resume file
  static async uploadResume(file: File): Promise<{ file_url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    
    // Don't set Content-Type header - let browser set it with proper boundary
    return await httpClient.post('/referrals/upload-resume', formData)
  }

  // Get available companies for referrals
  static async getCompanies(): Promise<string[]> {
    return await httpClient.get('/referrals/companies')
  }

  // Get employees for a specific company
  static async getEmployeesByCompany(company: string): Promise<Array<{
    id: number
    name: string
    position: string
    department: string
    company: string
    rating: number
    avatar_url?: string
  }>> {
    return await httpClient.get(`/referrals/employees?company=${encodeURIComponent(company)}`)
  }

  // Get dashboard analytics for current user
  static async getDashboardAnalytics(): Promise<{
    monthly_trend: Array<{ month: string; count: number }>
    status_distribution: Record<string, number>
    acceptance_rate_trend: Array<{ month: string; rate: number }>
    avg_response_time: number
  }> {
    try {
      return await httpClient.get('/referrals/analytics')
    } catch (error) {
      // Return empty data if analytics endpoint doesn't exist
      console.warn('Analytics endpoint not available:', error)
      return {
        monthly_trend: [],
        status_distribution: {},
        acceptance_rate_trend: [],
        avg_response_time: 0
      }
    }
  }
} 