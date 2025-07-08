"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Filter, Clock, CheckCircle, XCircle, AlertCircle, Users, Briefcase, Loader2, MessageSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ReferralAPI, Referral } from "@/lib/api/referrals"
import { authClient } from "@/lib/auth"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewing: "bg-blue-100 text-blue-800 border-blue-200",
  interview_scheduled: "bg-purple-100 text-purple-800 border-purple-200",
  interview_completed: "bg-indigo-100 text-indigo-800 border-indigo-200",
  offer_extended: "bg-green-100 text-green-800 border-green-200",
  hired: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-red-100 text-red-800 border-red-200"
}

const statusIcons = {
  pending: Clock,
  reviewing: AlertCircle,
  interview_scheduled: Users,
  interview_completed: CheckCircle,
  offer_extended: Briefcase,
  hired: CheckCircle,
  rejected: XCircle
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatStatus(status: string) {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

export default function ReferralsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [total, setTotal] = useState(0)

  useEffect(() => {
    initializePage()
  }, [])

  useEffect(() => {
    if (userRole) {
      loadReferrals()
    }
  }, [userRole, statusFilter])

  const initializePage = async () => {
    try {
      const user = await authClient.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserRole(user.role)
    } catch (error) {
      console.error("Failed to get user:", error)
      toast({
        title: "Error",
        description: "Failed to load user information.",
        variant: "destructive"
      })
    }
  }

  const loadReferrals = async () => {
    setLoading(true)
    try {
      const filters = statusFilter === "all" ? {} : { status: statusFilter }
      const response = await ReferralAPI.getReferrals(filters)
      setReferrals(response.referrals)
      setTotal(response.total)
    } catch (error) {
      console.error("Failed to load referrals:", error)
      toast({
        title: "Error",
        description: "Failed to load referrals. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (referralId: number, newStatus: string) => {
    try {
      await ReferralAPI.updateReferral(referralId, { status: newStatus as any })
      await loadReferrals() // Reload to show updated data
      toast({
        title: "Status updated",
        description: `Referral status updated to ${formatStatus(newStatus)}.`,
      })
    } catch (error) {
      console.error("Failed to update status:", error)
      toast({
        title: "Update failed",
        description: "Failed to update referral status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getPageTitle = () => {
    if (userRole === "candidate") {
      return "My Referral Requests"
    } else if (userRole === "employee") {
      return "Received Referral Requests"
    }
    return "All Referrals"
  }

  const getPageDescription = () => {
    if (userRole === "candidate") {
      return "Track the status of your submitted referral requests"
    } else if (userRole === "employee") {
      return "Manage referral requests sent to you"
    }
    return "Manage all referral requests in the system"
  }

  if (loading && !userRole) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={userRole as any}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h1>
            <p className="text-muted-foreground">{getPageDescription()}</p>
          </div>
          {userRole === "candidate" && (
            <Link href="/referrals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Referral Request
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
              <SelectItem value="interview_completed">Interview Completed</SelectItem>
              <SelectItem value="offer_extended">Offer Extended</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              {referrals.length} of {total} referrals
            </span>
          )}
        </div>

        {/* Referrals List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading referrals...</span>
          </div>
        ) : referrals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No referrals found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {userRole === "candidate" 
                  ? "You haven't submitted any referral requests yet."
                  : "You haven't received any referral requests yet."
                }
              </p>
              {userRole === "candidate" && (
                <Link href="/referrals/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Referral Request
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {referrals.map((referral) => {
              const StatusIcon = statusIcons[referral.status as keyof typeof statusIcons] || Clock
              const otherUser = userRole === "candidate" ? referral.employee : referral.candidate
              
              return (
                <Card key={referral.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherUser?.avatar_url || "/placeholder.svg"} alt={otherUser?.name} />
                          <AvatarFallback>
                            {otherUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-lg">{referral.position}</h3>
                          <p className="text-sm text-muted-foreground">{referral.company}</p>
                          {referral.department && (
                            <p className="text-xs text-muted-foreground">{referral.department}</p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[referral.status as keyof typeof statusColors]} flex items-center gap-1`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {formatStatus(referral.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* User Info */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {userRole === "candidate" ? "Employee:" : "Candidate:"}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{otherUser?.name}</span>
                          {userRole === "employee" && otherUser && (
                            <Link href={`/candidates/${otherUser.id}/profile`}>
                              <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                View Profile
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span>{formatDate(referral.created_at)}</span>
                      </div>

                      {/* Notes */}
                      {referral.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="mt-1 text-gray-700 line-clamp-2">{referral.notes}</p>
                        </div>
                      )}

                      {/* Resume */}
                      {referral.resume_url && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Resume:</span>
                          <button
                            onClick={() => {
                              // Open in new window with specific dimensions for PDF viewing
                              if (referral.resume_url) {
                                const url = ReferralAPI.getFileUrl(referral.resume_url)
                                window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
                              }
                            }}
                            className="ml-2 text-primary hover:underline cursor-pointer bg-transparent border-none p-0"
                          >
                            View Resume
                          </button>
                        </div>
                      )}

                      {/* View Feedback for rejected referrals (candidate only) */}
                      {userRole === "candidate" && referral.status === "rejected" && (referral as any).rejection_feedback && (
                        <div className="flex gap-2 pt-2">
                          <Link href={`/referrals/${referral.id}/rejection-feedback`}>
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                              <MessageSquare className="h-3 w-3" />
                              View Feedback
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* Actions for employees */}
                      {userRole === "employee" && referral.status === "pending" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(referral.id, "reviewing")}
                          >
                            Start Review
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(referral.id, "rejected")}
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {userRole === "employee" && referral.status === "reviewing" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(referral.id, "interview_scheduled")}
                          >
                            Schedule Interview
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(referral.id, "rejected")}
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {userRole === "employee" && referral.status === "interview_scheduled" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(referral.id, "interview_completed")}
                          >
                            Mark Interview Complete
                          </Button>
                        </div>
                      )}

                      {userRole === "employee" && referral.status === "interview_completed" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(referral.id, "offer_extended")}
                          >
                            Extend Offer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(referral.id, "rejected")}
                          >
                            Not Selected
                          </Button>
                        </div>
                      )}

                      {userRole === "employee" && referral.status === "offer_extended" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleStatusUpdate(referral.id, "hired")}
                          >
                            Mark as Hired
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
