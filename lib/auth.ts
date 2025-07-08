// Authentication utilities for FastAPI backend
import { redirect } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface AuthUser {
  id: number
  email: string
  name: string
  role: "candidate" | "employee" | "admin"
  avatar_url?: string
  department?: string
  position?: string
  company?: string
  bio?: string
  skills?: string[]
  experience_years?: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: AuthUser
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role: "candidate" | "employee"
  department?: string
  position?: string
  company?: string
  bio?: string
  skills?: string[]
  experience_years?: number
}

export interface EmployeeRegistrationData {
  email: string
  password: string
  name: string
  company: string
  department?: string
  position?: string
  bio?: string
  skills?: string[]
  experience_years?: number
}

export interface OTPRequest {
  email: string
  purpose: string
  user_data?: any
}

export interface OTPVerification {
  email: string
  otp_code: string
  purpose: string
}

export interface OTPResponse {
  success: boolean
  message: string
  expires_in?: number
}

// Token storage utilities
class TokenStorage {
  static setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
    }
  }

  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token')
    }
    return null
  }

  static clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user_data')
    }
  }

  static setUser(user: AuthUser) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  }

  static getUser(): AuthUser | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    }
    return null
  }
}

// API client with authentication
class ApiClient {
  private async makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = TokenStorage.getAccessToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    })

    // Handle token refresh if access token expired
    if (response.status === 401 && accessToken) {
      const refreshToken = TokenStorage.getRefreshToken()
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })

          if (refreshResponse.ok) {
            const { access_token, user } = await refreshResponse.json()
            TokenStorage.setTokens(access_token, refreshToken)
            TokenStorage.setUser(user)

            // Retry original request with new token
            headers['Authorization'] = `Bearer ${access_token}`
            return fetch(`${API_BASE_URL}${url}`, {
              ...options,
              headers,
            })
          } else {
            // Refresh token invalid, redirect to login
            TokenStorage.clearTokens()
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
          TokenStorage.clearTokens()
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login'
          }
        }
      }
    }

    return response
  }

  async get(url: string): Promise<Response> {
    return this.makeRequest(url, { method: 'GET' })
  }

  async post(url: string, data?: any): Promise<Response> {
    return this.makeRequest(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(url: string, data?: any): Promise<Response> {
    return this.makeRequest(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(url: string): Promise<Response> {
    return this.makeRequest(url, { method: 'DELETE' })
  }
}

const apiClient = new ApiClient()

// Client-side auth utilities
export class AuthClient {
  async signUp(email: string, password: string, metadata: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: metadata.name,
        role: metadata.role,
        department: metadata.department,
        position: metadata.position,
        company: metadata.company,
        bio: metadata.bio,
        skills: metadata.skills || [],
        experience_years: metadata.experience_years,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Registration failed')
    }

    const data: LoginResponse = await response.json()
    TokenStorage.setTokens(data.access_token, data.refresh_token)
    TokenStorage.setUser(data.user)
    
    return data
  }

  async signIn(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Login failed')
    }

    const data: LoginResponse = await response.json()
    TokenStorage.setTokens(data.access_token, data.refresh_token)
    TokenStorage.setUser(data.user)
    
    return data
  }

  async signOut(): Promise<void> {
    const refreshToken = TokenStorage.getRefreshToken()
    const accessToken = TokenStorage.getAccessToken()
    
    if (refreshToken && accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })
      } catch (error) {
        console.error('Logout request failed:', error)
      }
    }
    
    TokenStorage.clearTokens()
  }

  async resetPassword(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Password reset failed')
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Password update failed')
    }
  }

  async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser> {
    const response = await apiClient.put('/users/profile', updates)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Profile update failed')
    }

    const updatedUser = await response.json()
    TokenStorage.setUser(updatedUser)
    return updatedUser
  }

  getSession(): { access_token: string; user: AuthUser } | null {
    const accessToken = TokenStorage.getAccessToken()
    const user = TokenStorage.getUser()
    
    if (accessToken && user) {
      return { access_token: accessToken, user }
    }
    
    return null
  }

  async getUser(): Promise<AuthUser | null> {
    const session = this.getSession()
    if (!session) {
      return null
    }

    try {
      const response = await apiClient.get('/auth/me')
      if (response.ok) {
        const user = await response.json()
        TokenStorage.setUser(user)
        return user
      }
    } catch (error) {
      console.error('Failed to get user:', error)
    }

    return session.user
  }

  isAuthenticated(): boolean {
    return !!this.getSession()
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // For now, we'll implement a simple storage event listener
    // In a real app, you might want to use a more sophisticated state management
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token') {
        const session = this.getSession()
        callback(e.newValue ? 'SIGNED_IN' : 'SIGNED_OUT', session)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      
      return {
        unsubscribe: () => {
          window.removeEventListener('storage', handleStorageChange)
        }
      }
    }

    return { unsubscribe: () => {} }
  }

  async requestEmployeeOTP(registrationData: EmployeeRegistrationData): Promise<OTPResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/employee/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to send OTP')
    }

    return await response.json()
  }

  async verifyEmployeeOTP(verificationData: OTPVerification): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/employee/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'OTP verification failed')
    }

    const data: LoginResponse = await response.json()
    TokenStorage.setTokens(data.access_token, data.refresh_token)
    TokenStorage.setUser(data.user)
    
    return data
  }
}

// Server-side auth utilities
export class AuthServer {
  async getSession(accessToken?: string): Promise<{ access_token: string; user: AuthUser } | null> {
    if (!accessToken) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const user = await response.json()
        return { access_token: accessToken, user }
      }
    } catch (error) {
      console.error('Failed to get session:', error)
    }

    return null
  }

  async getUser(accessToken?: string): Promise<AuthUser | null> {
    const session = await this.getSession(accessToken)
    return session?.user || null
  }

  async requireAuth(accessToken?: string): Promise<AuthUser> {
    const user = await this.getUser(accessToken)
    if (!user) {
      redirect("/auth/login")
      throw new Error("Authentication required") // This won't be reached due to redirect
    }
    return user
  }

  async requireRole(allowedRoles: string[], accessToken?: string): Promise<AuthUser> {
    const user = await this.requireAuth(accessToken)
    const userRole = user.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      redirect("/unauthorized")
    }

    return user
  }
}

// Auth context and hooks
export const authClient = new AuthClient()
export const authServer = new AuthServer()

// Middleware helper
export async function withAuth(accessToken?: string) {
  const authServer = new AuthServer()
  const session = await authServer.getSession(accessToken)

  return {
    session,
    user: session?.user || null,
  }
}

// Route protection
export function createAuthGuard(allowedRoles?: string[]) {
  return async function authGuard(accessToken?: string) {
    const authServer = new AuthServer()
    const user = await authServer.getUser(accessToken)

    if (!user) {
      redirect("/auth/login")
      throw new Error("Authentication required") // This won't be reached due to redirect
    }

    if (allowedRoles) {
      const userRole = user.role
      if (!userRole || !allowedRoles.includes(userRole)) {
        redirect("/unauthorized")
        throw new Error("Role not authorized") // This won't be reached due to redirect
      }
    }

    return user
  }
}

// Session management
export class SessionManager {
  private static instance: SessionManager
  private session: { access_token: string; user: AuthUser } | null = null
  private user: AuthUser | null = null

  static getInstance() {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  async initialize() {
    const authClient = new AuthClient()
    const session = authClient.getSession()
    const user = await authClient.getUser()

    this.session = session
    this.user = user

    // Set up auth state listener
    authClient.onAuthStateChange((event, session) => {
      this.session = session
      this.user = session?.user || null

      // Handle auth events
      if (event === "SIGNED_OUT") {
        this.clearSession()
      }
    })
  }

  getSession() {
    return this.session
  }

  getUser() {
    return this.user
  }

  isAuthenticated() {
    return !!this.session && !!this.user
  }

  hasRole(role: string) {
    return this.user?.role === role
  }

  clearSession() {
    this.session = null
    this.user = null
  }
}
