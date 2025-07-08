import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth"

interface User {
  id: number
  email: string
  name: string
  role: "candidate" | "employee" | "admin"
  avatar_url?: string
  department?: string
  position?: string
  company?: string
}

interface Session {
  access_token: string
  user: User
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const session = authClient.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error getting session:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const isAuthenticated = !!user

  return {
    user,
    loading,
    isAuthenticated,
    isCandidate: user?.role === "candidate",
    isEmployee: user?.role === "employee",
    isAdmin: user?.role === "admin"
  }
} 