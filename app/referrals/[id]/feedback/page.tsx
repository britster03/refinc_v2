"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Clock,
  MessageSquare,
  TrendingDown
} from "lucide-react"
import { FeedbackAPI, type FeedbackSubmission } from "@/lib/api/feedback"
import { ReferralAPI, type Referral } from "@/lib/api/referrals"
import { toast } from "sonner"

interface FeedbackPageProps {
  params: { id: string }
}

export default function ReferralFeedbackPage({ params }: FeedbackPageProps) {
  const router = useRouter()
  const referralId = parseInt(params.id)
  
  // State management
  const [referral, setReferral] = useState<Referral | null>(null)
  const [feedbackType, setFeedbackType] = useState<string>("")
  const [feedbackText, setFeedbackText] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canSubmitFeedback, setCanSubmitFeedback] = useState(true)
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [submissionSuccess, setSubmissionSuccess] = useState(false)

  // Character count and validation
  const maxChars = 2000
  const minChars = 10
  const charCount = feedbackText.length
  const charProgress = (charCount / maxChars) * 100
  const isTextValid = charCount >= minChars && charCount <= maxChars

  // Feedback type options with enhanced descriptions
  const feedbackOptions = [
    {
      value: "no_response",
      label: "I didn't hear back from anyone",
      description: "No response from HR, hiring manager, or the referring employee",
      severity: "high" as const,
      icon: <XCircle className="h-4 w-4 text-red-500" />
    },
    {
      value: "poor_referral_quality", 
      label: "The referral quality was poor",
      description: "The referral didn't match my qualifications or the job requirements",
      severity: "high" as const,
      icon: <TrendingDown className="h-4 w-4 text-red-500" />
    },
    {
      value: "no_interview",
      label: "I didn't get an interview",
      description: "I heard back but wasn't selected for an interview",
      severity: "medium" as const,
      icon: <Clock className="h-4 w-4 text-yellow-500" />
    },
    {
      value: "rejected_after_interview",
      label: "I was rejected after the interview",
      description: "I interviewed but wasn't selected for the position",
      severity: "low" as const,
      icon: <MessageSquare className="h-4 w-4 text-blue-500" />
    },
    {
      value: "declined_offer",
      label: "I declined the offer",
      description: "I received an offer but chose not to accept it",
      severity: "low" as const,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
    },
    {
      value: "position_filled",
      label: "The position was filled by someone else",
      description: "The company decided to hire a different candidate",
      severity: "low" as const,
      icon: <Info className="h-4 w-4 text-blue-500" />
    },
    {
      value: "other",
      label: "Other reason",
      description: "Please explain the specific situation in the details below",
      severity: "medium" as const,
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  ]

  // Load referral data and check feedback eligibility
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setLoading(true)
        
        // Load referral details
        const referralData = await ReferralAPI.getReferralById(referralId)
        setReferral(referralData)
        
        // Check if feedback can be submitted
        const canSubmit = await FeedbackAPI.canSubmitFeedback(referralId)
        setCanSubmitFeedback(canSubmit)
        
        if (!canSubmit) {
          // If feedback already exists, show success message
          setSubmissionSuccess(true)
        }
        
      } catch (error) {
        console.error('Error loading referral data:', error)
        toast.error('Failed to load referral information')
        router.push('/referrals')
      } finally {
        setLoading(false)
      }
    }

    if (referralId) {
      loadReferralData()
    }
  }, [referralId, router])

  // Validate form data
  const validateForm = (): boolean => {
    const validationErrors = FeedbackAPI.validateFeedbackData({
      referral_id: referralId,
      feedback_type: feedbackType,
      feedback_text: feedbackText
    })

    setErrors(validationErrors)
    return validationErrors.length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting")
      return
    }

    setIsSubmitting(true)
    
    try {
      const feedbackData: FeedbackSubmission = {
        referral_id: referralId,
        feedback_type: feedbackType,
        feedback_text: feedbackText.trim(),
        metadata: {
          user_agent: navigator.userAgent,
          submission_timestamp: new Date().toISOString(),
          form_version: "1.0"
        }
      }

      const result = await FeedbackAPI.submitFeedback(feedbackData)
      
      setSubmissionSuccess(true)
      
      toast.success("Feedback submitted successfully", {
        description: "Your feedback will help improve the referral process."
      })

      // Redirect after a short delay to show success state
      setTimeout(() => {
        router.push(`/referrals/${params.id}?feedback=submitted`)
      }, 2000)

    } catch (error) {
      console.error("Feedback submission error:", error)
      
      if (error instanceof Error) {
        toast.error("Failed to submit feedback", {
          description: error.message
        })
        setErrors([error.message])
      } else {
        toast.error("Failed to submit feedback", {
          description: "An unexpected error occurred. Please try again."
        })
        setErrors(["An unexpected error occurred. Please try again."])
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get severity color for feedback type
  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
    }
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading referral information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Success state
  if (submissionSuccess) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Link
              href={`/referrals/${params.id}`}
              className="flex items-center text-sm text-muted-foreground hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to referral
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Feedback Submitted</h1>
          </div>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900">
                    Thank you for your feedback!
                  </h3>
                  <p className="text-green-700">
                    Your feedback has been submitted and will help improve the referral process. 
                    The referring employee's rating has been updated accordingly.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push(`/referrals/${params.id}`)}>
                Return to Referral
              </Button>
            </CardFooter>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link
            href={`/referrals/${params.id}`}
            className="flex items-center text-sm text-muted-foreground hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to referral
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Report "Fell Through"</h1>
          <p className="text-muted-foreground">
            Let us know what happened with your referral to help improve the process
          </p>
        </div>

        {/* Referral Context Card */}
        {referral && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Referral Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Position</Label>
                  <p className="font-medium">{referral.position}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{referral.company}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline" className="w-fit">
                    {referral.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Cannot Submit Feedback */}
        {!canSubmitFeedback && !submissionSuccess && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Feedback has already been submitted for this referral.
            </AlertDescription>
          </Alert>
        )}

        {/* Feedback Form */}
        {canSubmitFeedback && (
          <Card>
            <CardHeader>
              <CardTitle>What happened with this referral?</CardTitle>
              <CardDescription>
                Your feedback helps us understand what went wrong and improves the experience for future candidates.
                <strong> This will impact the referring employee's rating.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feedback Type Selection */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Why did this referral fall through?</Label>
                <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
                  <div className="space-y-3">
                    {feedbackOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`rounded-lg border-2 p-4 transition-colors ${
                          feedbackType === option.value
                            ? getSeverityColor(option.severity) + ' border-current'
                            : 'border-border hover:border-border/60'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {option.icon}
                              <Label htmlFor={option.value} className="font-medium cursor-pointer">
                                {option.label}
                              </Label>
                              <Badge 
                                variant={option.severity === 'high' ? 'destructive' : option.severity === 'medium' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {option.severity} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Feedback Text */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="feedback" className="text-base font-medium">
                    Please provide detailed feedback
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    {charCount}/{maxChars} characters
                  </div>
                </div>
                <div className="space-y-2">
                  <Textarea
                    id="feedback"
                    placeholder="Please describe what happened in detail. This information helps us improve the referral process and provide better guidance to both candidates and employees."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className={`min-h-[150px] ${!isTextValid && feedbackText ? 'border-red-500' : ''}`}
                    maxLength={maxChars}
                  />
                  <div className="space-y-2">
                    <Progress value={charProgress} className="h-1" />
                    {charCount < minChars && (
                      <p className="text-sm text-muted-foreground">
                        Please provide at least {minChars - charCount} more characters for detailed feedback.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Impact Warning */}
              {feedbackType && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Rating Impact:</strong> This feedback will have a{' '}
                    <strong>{feedbackOptions.find(opt => opt.value === feedbackType)?.severity || 'medium'} impact</strong>{' '}
                    on the referring employee's rating. High impact issues (like no response) will significantly affect their rating.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !feedbackType || !isTextValid}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
