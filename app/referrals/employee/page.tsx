"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowRight, Clock, CheckCircle, XCircle, Brain, Loader2, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ReferralAPI } from "@/lib/api/referrals"
import { authClient } from "@/lib/auth"

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

export default function EmployeeReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchReferrals = async () => {
    try {
      setLoading(true)
      
      // Get current user session to get employee ID
      const session = authClient.getSession()
      if (!session?.user?.id) {
        throw new Error('User not authenticated')
      }
      
      const response = await ReferralAPI.getEmployeeReferrals(session.user.id)
      setReferrals(response.referrals || [])
    } catch (error: any) {
      console.error('Failed to fetch referrals:', error)
      toast({
        title: "Error",
        description: "Failed to fetch referrals. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateReferralStatus = async (referralId: number, newStatus: string) => {
    try {
      setUpdating(referralId)
      await ReferralAPI.updateReferral(referralId, { status: newStatus as any })
      
      // Update local state
      setReferrals(prev => 
        prev.map(ref => 
          ref.id === referralId 
            ? { ...ref, status: newStatus, updated_at: new Date().toISOString() }
            : ref
        )
      )
      
      toast({
        title: "Success",
        description: `Referral ${newStatus === 'reviewing' ? 'moved to review' : newStatus.replace('_', ' ')}`,
      })
    } catch (error: any) {
      console.error('Failed to update referral:', error)
      toast({
        title: "Error", 
        description: "Failed to update referral status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    fetchReferrals()
  }, [])

  const pendingReferrals = referrals.filter((r) => r.status === "pending")
  const reviewingReferrals = referrals.filter((r) => ["reviewing", "interview_scheduled", "interview_completed", "offer_extended"].includes(r.status))
  const completedReferrals = referrals.filter((r) => ["hired", "rejected"].includes(r.status))

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "reviewing":
        return (
          <Badge variant="secondary">
            <Eye className="mr-1 h-3 w-3" />
            Reviewing
          </Badge>
        )
      case "interview_scheduled":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Accepted
          </Badge>
        )
      case "interview_completed":
        return (
          <Badge>
            <CheckCircle className="mr-1 h-3 w-3" />
            Interview Completed
          </Badge>
        )
      case "offer_extended":
        return (
          <Badge>
            <CheckCircle className="mr-1 h-3 w-3" />
            Offer Extended
          </Badge>
        )
      case "hired":
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Hired
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        )
    }
  }

  const ReferralCard = ({ referral }: { referral: Referral }) => {
    const candidateName = referral.candidate?.name || 'Unknown Candidate'
    const candidateInitials = candidateName.split(' ').map(n => n[0]).join('')
    
    return (
      <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={referral.candidate?.avatar_url || "/placeholder.svg"} alt={candidateName} />
            <AvatarFallback>{candidateInitials}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="font-medium">{referral.position}</div>
            <div className="text-sm text-muted-foreground">
              {candidateName} • {new Date(referral.created_at).toLocaleDateString()}
            </div>
                         <div className="text-sm text-muted-foreground">
               {referral.company} {referral.department && `• ${referral.department}`}
             </div>
             <div className="flex items-center gap-2">
               {referral.ai_analysis_score && (
               <Badge variant="outline" className="text-xs flex items-center gap-1">
                 <Brain className="h-3 w-3" />
                   {Math.round(referral.ai_analysis_score * 100)}% match
               </Badge>
               )}
             </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(referral.status)}
          
          {/* View Profile Button */}
          {referral.candidate && (
            <Link href={`/candidates/${referral.candidate.id}/profile`}>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                View Profile
              </Button>
            </Link>
          )}
          
          {referral.status === "pending" && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateReferralStatus(referral.id, 'reviewing')}
                disabled={updating === referral.id}
              >
                {updating === referral.id ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Eye className="h-3 w-3 mr-1" />
                )}
                Review
              </Button>
            </div>
          )}
          
          <Link href={`/referrals/employee/${referral.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Referral Requests</h1>
          <p className="text-muted-foreground">Manage and review referral requests from candidates</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              All
              <Badge variant="outline" className="ml-2">
                {referrals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              <Badge variant="outline" className="ml-2">
                {pendingReferrals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="reviewing">
              In Progress
              <Badge variant="outline" className="ml-2">
                {reviewingReferrals.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <Badge variant="outline" className="ml-2">
                {completedReferrals.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Referral Requests</CardTitle>
                <CardDescription>View all referral requests you've received</CardDescription>
              </CardHeader>
              <CardContent>
                {referrals.length > 0 ? (
                  <div className="divide-y">
                    {referrals.map((referral) => (
                      <ReferralCard key={referral.id} referral={referral} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium">No referral requests</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven't received any referral requests yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>Referral requests awaiting your review</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReferrals.length > 0 ? (
                  <div className="divide-y">
                    {pendingReferrals.map((referral) => (
                      <ReferralCard key={referral.id} referral={referral} />
                    ))}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviewing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
                <CardDescription>Referral requests you're currently processing</CardDescription>
              </CardHeader>
              <CardContent>
                {reviewingReferrals.length > 0 ? (
                  <div className="divide-y">
                    {reviewingReferrals.map((referral) => (
                      <ReferralCard key={referral.id} referral={referral} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium">No referrals in progress</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have any referrals currently being processed.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>Referral requests that have been resolved</CardDescription>
              </CardHeader>
              <CardContent>
                {completedReferrals.length > 0 ? (
                  <div className="divide-y">
                    {completedReferrals.map((referral) => (
                      <ReferralCard key={referral.id} referral={referral} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium">No completed referrals</h3>
                    <p className="text-sm text-muted-foreground">
                      You haven't completed any referral requests yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
