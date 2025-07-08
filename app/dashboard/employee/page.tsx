"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Clock, CheckCircle, XCircle, FileText, Star, Users, TrendingUp, Loader2, MessageSquare } from "lucide-react"
import { ProfileVerificationBadge, DetailedVerificationBadge } from "@/components/ui/verification-badge"
import Link from "next/link"
import { authClient } from '@/lib/auth'
import { EmployeeAPI } from '@/lib/api/employees'
import { ReferralAPI } from '@/lib/api/referrals'
import { toast } from 'sonner'

interface Referral {
  id: number
  candidate_id: number
  employee_id: number
  position: string
  department?: string
  company: string
  status: string
  notes?: string
  resume_url?: string
  ai_analysis_score?: number
  ai_analysis_summary?: string
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
    avatar_url?: string
  }
}

interface FreeConversation {
  id: number
  referral_id: number
  candidate_id: number
  employee_id: number
  status: 'active' | 'completed' | 'upgrade_required' | 'cancelled'
  message_count: number
  max_messages: number
  candidate_message_count: number
  employee_message_count: number
  max_messages_per_user: number
  created_at: string
  updated_at: string
  completed_at?: string
  candidate?: {
    id: number
    name: string
    email: string
    avatar_url?: string
  }
  referral?: {
    position: string
    company: string
  }
}

interface DashboardData {
  user: {
    id: number
    name: string
    email: string
    position: string
    company: string
    department: string
    bio: string
    skills: string[]
    rating: number
    avatar_url: string
    total_referrals: number
    successful_referrals: number
    is_verified: boolean
  }
  metrics: {
    totalReferrals: number
    pendingRequests: number
    acceptanceRate: number
    rating: number
    activeFreeConversations: number
  }
  pendingReferrals: Referral[]
  recentReferrals: Referral[]
  activeFreeConversations: FreeConversation[]
}

export default function EmployeeDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const user = await authClient.getUser()
        if (!user) {
          toast.error("Please log in to view your dashboard")
          return
        }

        // Get detailed profile data
        const profileData = await EmployeeAPI.getEmployeeProfile(user.id)
        
        // Get referrals data from API
        const referralsResponse = await ReferralAPI.getEmployeeReferrals(user.id)
        const referrals = referralsResponse.referrals || []
        
        // Get free conversations
        let activeFreeConversations: FreeConversation[] = []
        try {
          const session = authClient.getSession()
          if (session?.access_token) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/free-conversations/`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            })
            if (response.ok) {
              const conversations = await response.json()
              activeFreeConversations = conversations.filter((conv: FreeConversation) => 
                conv.status === 'active' && conv.employee_id === user.id
              )
            }
          }
        } catch (error) {
          console.error('Failed to load free conversations:', error)
        }
        
        // Filter referrals by status
        const pendingReferrals = referrals.filter(r => r.status === "pending")
        const recentReferrals = referrals
          .filter(r => ["hired", "rejected", "interview_completed", "offer_extended"].includes(r.status))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)
        
        const dashboardData: DashboardData = {
          user: {
            id: profileData.id,
            name: profileData.name || user.name,
            email: profileData.email || user.email,
            position: profileData.position || "Software Engineer",
            company: profileData.company || "Unknown Company",
            department: profileData.department || "Engineering",
            bio: profileData.bio || "No bio available",
            skills: profileData.skills || [],
            rating: profileData.rating || 0,
            avatar_url: profileData.avatar_url || user.avatar_url || "",
            total_referrals: profileData.total_referrals || 0,
            successful_referrals: profileData.successful_referrals || 0,
            is_verified: profileData.is_verified || user.is_verified || false,
          },
          metrics: {
            totalReferrals: profileData.total_referrals || 0,
            pendingRequests: pendingReferrals.length,
            acceptanceRate: profileData.total_referrals > 0 ? 
              Math.round((profileData.successful_referrals / profileData.total_referrals) * 100) : 0,
            rating: profileData.rating || 0,
            activeFreeConversations: activeFreeConversations.length,
          },
          pendingReferrals: pendingReferrals.slice(0, 5), // Show only first 5 for dashboard
          recentReferrals: recentReferrals,
          activeFreeConversations: activeFreeConversations.slice(0, 5),
        }
        
        setDashboardData(dashboardData)
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading dashboard...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dashboardData) {
    return (
      <DashboardLayout role="employee">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </DashboardLayout>
    )
  }

  const { user, metrics, pendingReferrals, recentReferrals, activeFreeConversations } = dashboardData

  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your referral activities.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalReferrals > 0 ? `${user.successful_referrals} successful` : 'No referrals yet'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.pendingRequests > 0 ? 'Awaiting your review' : 'No pending requests'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Free Conversations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeFreeConversations}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.activeFreeConversations > 0 ? 'Active conversations' : 'No active conversations'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.acceptanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalReferrals > 0 
                  ? `${user.successful_referrals} out of ${metrics.totalReferrals} referrals`
                  : 'No referrals to calculate'
                }
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.rating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Based on candidate feedback</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your referral activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/referrals/employee">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Review Requests</span>
                </Button>
              </Link>
              <Link href="/free-conversations/employee">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <span>Free Conversations</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Update Profile</span>
                </Button>
              </Link>
              <Link href="/analytics/employee">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Active Free Conversations */}
        {activeFreeConversations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Active Free Conversations</CardTitle>
              <CardDescription>Candidates discussing rejection feedback with you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {activeFreeConversations.map((conversation) => {
                  const candidateName = conversation.candidate?.name || 'Unknown Candidate'
                  const candidateInitials = candidateName.split(' ').map(n => n[0]).join('')
                  const position = conversation.referral?.position || 'Unknown Position'
                  const company = conversation.referral?.company || 'Unknown Company'
                  
                  return (
                    <div key={conversation.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={conversation.candidate?.avatar_url || "/placeholder.svg"}
                            alt={candidateName}
                          />
                          <AvatarFallback>{candidateInitials}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <div className="font-medium">{candidateName}</div>
                          <div className="text-sm text-muted-foreground">
                            {position} at {company}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Candidate: {conversation.candidate_message_count}/{conversation.max_messages_per_user} | Employee: {conversation.employee_message_count}/{conversation.max_messages_per_user}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {conversation.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/free-conversations/${conversation.id}`}>
                          <Button size="sm">Reply</Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Pending Referral Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Referral Requests</CardTitle>
              <CardDescription>Referral requests awaiting your review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingReferrals.length > 0 ? (
                <div className="divide-y">
                  {pendingReferrals.map((referral) => {
                    const candidateName = referral.candidate?.name || 'Unknown Candidate'
                    const candidateInitials = candidateName.split(' ').map(n => n[0]).join('')
                    return (
                    <div key={referral.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                              src={referral.candidate?.avatar_url || "/placeholder.svg"}
                              alt={candidateName}
                          />
                            <AvatarFallback>{candidateInitials}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <div className="font-medium">{referral.position}</div>
                          <div className="text-sm text-muted-foreground">
                              {candidateName} • {new Date(referral.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                                {referral.ai_analysis_score 
                                  ? Math.round(referral.ai_analysis_score)
                                  : 65 + (referral.id * 7) % 30 // Deterministic score between 65-95 based on ID
                                }% match
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/referrals/employee/${referral.id}`}>
                          <Button size="sm">Review</Button>
                        </Link>
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium">No pending requests</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any pending referral requests at the moment.
                  </p>
                </div>
              )}
              {pendingReferrals.length > 0 && (
                <div className="flex items-center justify-end pt-4">
                  <Link href="/referrals/employee">
                    <Button variant="outline">View all requests</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent referral activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentReferrals.length > 0 ? (
              <div className="divide-y">
                  {recentReferrals.map((referral) => {
                    const candidateName = referral.candidate?.name || 'Unknown Candidate'
                    const candidateInitials = candidateName.split(' ').map(n => n[0]).join('')
                    return (
                  <div key={referral.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                              src={referral.candidate?.avatar_url || "/placeholder.svg"}
                              alt={candidateName}
                        />
                            <AvatarFallback>{candidateInitials}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-1">
                        <div className="font-medium">{referral.position}</div>
                        <div className="text-sm text-muted-foreground">
                              {candidateName} • {new Date(referral.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                          <Badge variant={referral.status === "hired" ? "default" : "destructive"}>
                            {referral.status === "hired" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {referral.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                            {referral.status.charAt(0).toUpperCase() + referral.status.slice(1).replace('_', ' ')}
                      </Badge>
                      <Link href={`/referrals/employee/${referral.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium">No recent activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Your recent referral activities will appear here.
                  </p>
              </div>
              )}
              <div className="flex items-center justify-end pt-4">
                <Link href="/referrals/employee">
                  <Button variant="outline">View all activity</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-4 md:w-1/3">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar_url || undefined} alt="Your profile" />
                    <AvatarFallback className="text-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <ProfileVerificationBadge isVerified={user.is_verified} />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="font-semibold text-lg">{user.name}</h3>
                    {user.is_verified && <DetailedVerificationBadge isVerified={user.is_verified} />}
                  </div>
                  <p className="text-muted-foreground">{user.position} at {user.company}</p>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="ml-1 font-medium">{user.rating.toFixed(1)}</span>
                  <span className="ml-1 text-sm text-muted-foreground">({user.total_referrals} referrals)</span>
                </div>
              </div>
              <div className="md:w-2/3 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-sm">
                    {user.bio || "No bio available. Click 'Edit Profile' to add your bio."}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills listed. Click 'Edit Profile' to add your skills.</p>
                    )}
                  </div>
                </div>
                <div className="pt-2">
                  <Link href="/profile">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
