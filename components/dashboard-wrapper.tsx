"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth"
import { toast } from "sonner"

interface DashboardWrapperProps {
  children: React.ReactNode
  requiredRole?: "candidate" | "employee"
}

export default function DashboardWrapper({ children, requiredRole }: DashboardWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = authClient.getSession()
        
        if (!session) {
          toast.error("Please log in to access the dashboard")
          router.push("/auth/login")
          return
        }

        // If a specific role is required, check it
        if (requiredRole && session.user?.role !== requiredRole) {
          toast.error(`This page is only accessible to ${requiredRole}s`)
          router.push("/")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Authentication check failed:", error)
        toast.error("Authentication failed. Please log in again.")
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
} 