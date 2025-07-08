"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { RejectionFeedbackViewer } from "@/components/RejectionFeedbackViewer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { ReferralAPI, Referral } from "@/lib/api/referrals"
import { authClient } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"
import { use } from "react"

interface RejectionFeedbackPageProps {
  params: Promise<{ id: string }>
}

export default function RejectionFeedbackPage({ params }: RejectionFeedbackPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [referral, setReferral] = useState<Referral | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReferralAndFeedback()
  }, [resolvedParams.id])

  const fetchReferralAndFeedback = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check authentication
      const user = await authClient.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      if (user.role !== 'candidate') {
        setError("Only candidates can view rejection feedback")
        return
      }

      // Fetch referral details
      const referralData = await ReferralAPI.getReferralById(parseInt(resolvedParams.id))
      
      // Verify this is a rejected referral with feedback
      if (referralData.status !== 'rejected') {
        setError("This referral has not been rejected")
        return
      }

      if (!(referralData as any).rejection_feedback) {
        setError("No rejection feedback is available for this referral")
        return
      }

      // Verify the candidate owns this referral
      if (referralData.candidate_id !== user.id) {
        setError("You don't have permission to view this referral's feedback")
        return
      }

      setReferral(referralData)

    } catch (error: any) {
      console.error("Failed to fetch rejection feedback:", error)
      setError("Failed to load rejection feedback. Please try again.")
      toast({
        title: "Error",
        description: "Failed to load rejection feedback.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading rejection feedback...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href="/referrals">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Referrals
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-red-600">Unable to Load Feedback</h3>
                <p className="text-muted-foreground max-w-md">
                  {error}
                </p>
                <Link href="/referrals">
                  <Button>
                    Return to Referrals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!referral) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href="/referrals">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Referrals
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Referral Not Found</h3>
                <p className="text-muted-foreground">
                  The referral you're looking for doesn't exist or you don't have access to it.
                </p>
                <Link href="/referrals">
                  <Button>
                    Return to Referrals
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Link href="/referrals">
            <Button variant="ghost" size="sm" className="w-fit">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referrals
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Rejection Feedback</h1>
            <p className="text-muted-foreground">
              {referral.position} at {referral.company}
            </p>
          </div>
        </div>

        {/* Rejection Feedback Viewer */}
        <RejectionFeedbackViewer
          rejectionFeedback={(referral as any).rejection_feedback}
          rejectionFeedbackAnalysis={(referral as any).rejection_feedback_analysis}
          referralId={referral.id}
          employeeName={referral.employee?.name || "Employee"}
          position={referral.position}
          company={referral.company}
        />
      </div>
    </DashboardLayout>
  )
} 