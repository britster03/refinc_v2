"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  Building2,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Brain,
  MessageSquare,
  Coins,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { NotificationDropdown } from "@/components/notifications/notification-dropdown"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { authClient } from "@/lib/auth"

interface DashboardLayoutProps {
  children: ReactNode
  role: "candidate" | "employee"
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const user = await authClient.getUser()
      setCurrentUser(user)
    }
    loadUser()
  }, [])

  // Activity heartbeat - update user activity every 5 minutes while app is active
  useEffect(() => {
    const updateActivity = async () => {
      try {
        const session = authClient.getSession()
        if (session?.access_token) {
          // Make a simple API call to update activity
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })
          
          // If unauthorized, clear the heartbeat to prevent further calls
          if (response.status === 401) {
            if (heartbeatRef.current) {
              clearInterval(heartbeatRef.current)
            }
          }
        }
      } catch (error) {
        console.error('Failed to update activity:', error)
        // Clear heartbeat on persistent errors
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
        }
      }
    }

    // Start heartbeat (every 5 minutes)
    heartbeatRef.current = setInterval(updateActivity, 5 * 60 * 1000)

    // Cleanup on unmount
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [])

  // Also update activity on user interactions
  useEffect(() => {
    const handleUserActivity = () => {
      // Debounce activity updates - only update if last update was more than 2 minutes ago
      const lastUpdate = localStorage.getItem('last_activity_update')
      const now = Date.now()
      
      if (!lastUpdate || now - parseInt(lastUpdate) > 2 * 60 * 1000) {
        localStorage.setItem('last_activity_update', now.toString())
        
        // Update activity on next tick to avoid blocking UI
        setTimeout(async () => {
          try {
            const session = authClient.getSession()
            if (session?.access_token) {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              })
              
              // If unauthorized, clear the heartbeat to prevent further calls
              if (response.status === 401) {
                if (heartbeatRef.current) {
                  clearInterval(heartbeatRef.current)
                }
              }
            }
          } catch (error) {
            // Silently ignore activity update errors but clear heartbeat if persistent
            if (heartbeatRef.current) {
              clearInterval(heartbeatRef.current)
            }
          }
        }, 0)
      }
    }

    // Listen for user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [])

  const candidateNavItems = [
    { href: "/dashboard/candidate", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/employees", label: "Find Employees", icon: <Users className="h-5 w-5" /> },
    { href: "/referrals", label: "My Referrals", icon: <FileText className="h-5 w-5" /> },
    { href: "/coins", label: "Coins & Rewards", icon: <Coins className="h-5 w-5" /> },
    { href: "/premium-conversations", label: "Premium Conversations", icon: <MessageSquare className="h-5 w-5" /> },
    { href: "/premium-conversations/history", label: "Conversation History", icon: <FileText className="h-5 w-5" /> },
    { href: "/profile", label: "My Profile", icon: <Users className="h-5 w-5" /> },
    { href: "/resume-analysis", label: "Resume Analysis", icon: <Brain className="h-5 w-5" /> },
    { href: "/analytics/candidate", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]

  const employeeNavItems = [
    { href: "/dashboard/employee", label: "Dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/referrals/employee", label: "Referral Requests", icon: <FileText className="h-5 w-5" /> },
    { href: "/coins", label: "Coins & Rewards", icon: <Coins className="h-5 w-5" /> },
    { href: "/premium-conversations/employee", label: "Premium Conversations", icon: <MessageSquare className="h-5 w-5" /> },
    { href: "/profile", label: "My Profile", icon: <Users className="h-5 w-5" /> },
    { href: "/analytics/employee", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { href: "/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
    { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ]

  const navItems = role === "candidate" ? candidateNavItems : employeeNavItems

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!currentUser?.name) return "U"
    return currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
  }

  return (
    <NotificationProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3 font-bold text-xl transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-foreground">ReferralInc</span>
            </Link>
            <div className="flex items-center gap-3">
              <NotificationDropdown />
                              <div className="flex items-center gap-3">
                  <UserAvatar
                    src={currentUser?.avatar_url}
                    alt={currentUser?.name || "User"}
                    name={currentUser?.name || "User"}
                    size="sm"
                  />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-none">{currentUser?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {role}
                  </p>
                </div>
              </div>
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <div className="flex flex-col gap-6 py-4">
                    <div className="flex items-center justify-start">
                      <div className="flex items-center gap-3 font-bold text-lg">
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                          <span className="text-base font-bold text-primary-foreground">R</span>
                        </div>
                        <span className="text-foreground">ReferralInc</span>
                      </div>
                    </div>
                    <nav className="flex flex-col gap-1">
                      {navItems.map((item) => (
                        <Link key={item.href} href={item.href}>
                          <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                            {item.icon}
                            <span>{item.label}</span>
                          </Button>
                        </Link>
                      ))}
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start h-10 px-3 gap-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          try {
                            // Clear heartbeat immediately
                            if (heartbeatRef.current) {
                              clearInterval(heartbeatRef.current)
                            }
                            // Clear activity tracking timestamp
                            localStorage.removeItem('last_activity_update')
                            
                            await authClient.signOut()
                            window.location.href = '/auth/login'
                          } catch (error) {
                            console.error('Logout failed:', error)
                            // Still clear timers and redirect on error
                            if (heartbeatRef.current) {
                              clearInterval(heartbeatRef.current)
                            }
                            localStorage.removeItem('last_activity_update')
                            window.location.href = '/auth/login'
                          }
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </Button>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="hidden w-64 flex-col border-r bg-muted/30 lg:flex">
            <div className="flex flex-col gap-1 p-6">
              <div className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant="ghost" className="w-full justify-start h-10 px-3 gap-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground">
                      {item.icon}
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
              <div className="border-t my-2" />
              <Button 
                variant="ghost" 
                className="w-full justify-start h-10 px-3 gap-3 text-sm font-medium text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  try {
                    // Clear heartbeat immediately
                    if (heartbeatRef.current) {
                      clearInterval(heartbeatRef.current)
                    }
                    // Clear activity tracking timestamp
                    localStorage.removeItem('last_activity_update')
                    
                    await authClient.signOut()
                    window.location.href = '/auth/login'
                  } catch (error) {
                    console.error('Logout failed:', error)
                    // Still clear timers and redirect on error
                    if (heartbeatRef.current) {
                      clearInterval(heartbeatRef.current)
                    }
                    localStorage.removeItem('last_activity_update')
                    window.location.href = '/auth/login'
                  }
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
            </div>
          </aside>
          <main className="flex-1 overflow-auto bg-background">
            <div className="container mx-auto max-w-7xl px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  )
}
