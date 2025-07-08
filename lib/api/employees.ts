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
}

const httpClient = new HttpClient()

export interface Employee {
  id: number
  name: string
  email: string
  role: string
  position?: string
  company?: string
  department?: string
  bio?: string
  skills?: string[]
  experience_years?: number
  rating?: number
  total_referrals?: number
  successful_referrals?: number
  avatar_url?: string
  is_verified?: boolean
  created_at?: string
  updated_at?: string
}

export interface EmployeeSearchParams {
  company?: string
  search?: string
  department?: string
  skills?: string
  sort_by?: 'rating' | 'name' | 'experience'
  limit?: number
  offset?: number
}

export interface EmployeeSearchResponse {
  employees: Employee[]
  total_count: number
  companies: string[]
  departments: string[]
}

export interface EmployeeProfileUpdateData {
  bio?: string
  position?: string
  department?: string
  experience_years?: number
  skills?: string[]
  company?: string
  location?: string
  avatar_url?: string
  projects?: Array<{
    name: string
    description?: string
    technologies?: string[]
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

export class EmployeeAPI {
  
  static async searchEmployees(params: EmployeeSearchParams = {}): Promise<EmployeeSearchResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.company) searchParams.append('company', params.company)
    if (params.search) searchParams.append('search', params.search)
    if (params.department) searchParams.append('department', params.department)
    if (params.skills) searchParams.append('skills', params.skills)
    if (params.sort_by) searchParams.append('sort_by', params.sort_by)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    
    const data = await httpClient.get(`/users/search-data/employees?${searchParams.toString()}`)
    return data
  }

  static async getEmployeeById(id: number): Promise<Employee> {
    const data = await httpClient.get(`/users/${id}`)
    return data
  }

  static async getEmployeeProfile(id: number): Promise<any> {
    const data = await httpClient.get(`/users/${id}/profile`)
    return data
  }

  static async updateEmployeeProfile(id: number, profileData: EmployeeProfileUpdateData): Promise<any> {
    const session = authClient.getSession()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE_URL}/users/${id}/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  static async getCompanies(): Promise<string[]> {
    const data = await httpClient.get('/users/companies')
    return data
  }

  static async getDepartments(company?: string): Promise<string[]> {
    const params = company ? `?company=${encodeURIComponent(company)}` : ''
    const data = await httpClient.get(`/users/departments${params}`)
    return data
  }
} 