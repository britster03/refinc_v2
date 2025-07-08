"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  FileText, 
  AlertTriangle, 
  Eye,
  Download,
  Loader2,
  User
} from "lucide-react"
import Link from "next/link"
import { ReferralAPI, Referral } from "@/lib/api/referrals"
import { authClient } from "@/lib/auth"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertCircle, Award, Target, Brain } from "lucide-react"

interface ReferralDetailPageProps {
  params: { id: string }
}

interface AIAnalysisTabProps {
  analysisDetails: any
}

function AIAnalysisTab({ analysisDetails }: AIAnalysisTabProps) {
  // Debug logging
  console.log("AIAnalysisTab received data:", analysisDetails)
  console.log("Data type:", typeof analysisDetails)
  console.log("Is empty object:", analysisDetails && Object.keys(analysisDetails).length === 0)
  
  if (!analysisDetails) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">No AI analysis available</p>
      </div>
    )
  }
  
  // Check if it's an empty object
  if (typeof analysisDetails === 'object' && Object.keys(analysisDetails).length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">AI analysis data is empty</p>
      </div>
    )
  }

  const {
    overall_match_score = 0,
    match_category = "fair",
    skills_analysis = {},
    experience_analysis = {},
    education_analysis = {},
    cultural_fit = {},
    interview_probability = 0,
    hiring_probability = 0,
    improvement_recommendations = [],
    strengths = [],
    concerns = []
  } = analysisDetails

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Overall Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(overall_match_score)}`}>
                {overall_match_score}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Match</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(interview_probability)}`}>
                {interview_probability}%
              </div>
              <p className="text-sm text-muted-foreground">Interview Probability</p>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(hiring_probability)}`}>
                {hiring_probability}%
              </div>
              <p className="text-sm text-muted-foreground">Hiring Probability</p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={overall_match_score} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Match Quality: {match_category}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skills Analysis */}
      {skills_analysis.technical_skills && (
        <Card>
          <CardHeader>
            <CardTitle>Skills Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skills_analysis.technical_skills.matched_skills?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-600" />
                  Matched Skills
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {skills_analysis.technical_skills.matched_skills.slice(0, 6).map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <Badge variant="outline" className="text-xs">
                        {skill.match_score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {skills_analysis.technical_skills.missing_skills?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Missing Skills
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {skills_analysis.technical_skills.missing_skills.slice(0, 4).map((skill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span className="text-sm">{skill.skill}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {skill.importance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Experience Analysis */}
      {experience_analysis.years_experience && (
        <Card>
          <CardHeader>
            <CardTitle>Experience Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Years of Experience</h4>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {experience_analysis.years_experience.candidate || 0}
                  </span>
                  <span className="text-muted-foreground">years</span>
                  <span className="text-xs text-muted-foreground">
                    (Required: {experience_analysis.years_experience.required || 0})
                  </span>
                </div>
                <Progress 
                  value={experience_analysis.years_experience.match_score || 0} 
                  className="h-1 mt-2" 
                />
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Role Progression</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Career Growth</span>
                    <span>{experience_analysis.role_progression?.career_growth || 0}%</span>
                  </div>
                  <Progress 
                    value={experience_analysis.role_progression?.career_growth || 0} 
                    className="h-1" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths and Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <TrendingUp className="h-4 w-4" />
                Key Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.slice(0, 4).map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {concerns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertCircle className="h-4 w-4" />
                Areas of Concern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {concerns.slice(0, 4).map((concern: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full mt-2 flex-shrink-0" />
                    {concern}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Improvement Recommendations */}
      {improvement_recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Improvement Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {improvement_recommendations.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{rec.area}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  {rec.specific_actions && (
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {rec.specific_actions.slice(0, 2).map((action: string, actionIndex: number) => (
                        <li key={actionIndex}>• {action}</li>
                      ))}
                    </ul>
                  )}
                  {rec.impact_on_match && (
                    <p className="text-xs text-blue-600 mt-1">
                      Potential improvement: +{rec.impact_on_match} points
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ReferralDetailPage({ params }: ReferralDetailPageProps) {
  const session = authClient.getSession()
  const user = session?.user
  const [referral, setReferral] = useState<Referral | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        setLoading(true)
        const referralData = await ReferralAPI.getReferralById(Number(params.id))
        setReferral(referralData)
      } catch (err) {
        console.error('Error fetching referral:', err)
        setError(err instanceof Error ? err.message : 'Failed to load referral')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchReferral()
    }
  }, [params.id])

  // Helper function to format status display
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { icon: Clock, variant: 'outline' as const, label: 'Pending' }
      case 'reviewing':
        return { icon: Eye, variant: 'outline' as const, label: 'Reviewing' }
      case 'interview_scheduled':
        return { icon: Clock, variant: 'default' as const, label: 'Interview Scheduled' }
      case 'interview_completed':
        return { icon: CheckCircle, variant: 'default' as const, label: 'Interview Completed' }
      case 'offer_extended':
        return { icon: CheckCircle, variant: 'default' as const, label: 'Offer Extended' }
      case 'hired':
        return { icon: CheckCircle, variant: 'default' as const, label: 'Hired' }
      case 'rejected':
        return { icon: XCircle, variant: 'destructive' as const, label: 'Rejected' }
      case 'accepted':
        return { icon: CheckCircle, variant: 'default' as const, label: 'Accepted' }
      default:
        return { icon: Clock, variant: 'outline' as const, label: status }
    }
  }

  // Helper function to check if feedback can be provided
  const canProvideFeedback = (status: string) => {
    const feedbackEligibleStatuses = [
      'interview_scheduled',
      'interview_completed', 
      'offer_extended', 
      'hired',
      'rejected'
    ]
    return feedbackEligibleStatuses.includes(status.toLowerCase())
  }

  // Generate timeline based on referral status and dates
  const generateTimeline = (referral: Referral) => {
    const timeline = [
      {
        date: referral.created_at,
        event: "Referral request submitted",
        description: `You submitted a referral request to ${referral.employee?.name || 'the employee'}.`,
        icon: FileText
      }
    ]

    // Add status-based timeline events
    if (referral.status !== 'pending') {
      timeline.push({
        date: referral.updated_at,
        event: "Status updated",
        description: `Referral status changed to ${getStatusInfo(referral.status).label}.`,
        icon: getStatusInfo(referral.status).icon
      })
    }

    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Helper to get valid dashboard role
  const getDashboardRole = () => {
    if (user?.role === "admin") return "employee" // Admin can access employee views
    return (user?.role as "candidate" | "employee") || "candidate"
  }

  if (loading) {
    return (
      <DashboardLayout role={getDashboardRole()}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading referral details...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !referral) {
    return (
      <DashboardLayout role={getDashboardRole()}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <XCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Error Loading Referral</h2>
            <p className="text-muted-foreground mt-1">
              {error || "Referral not found"}
            </p>
          </div>
          <Link href="/referrals">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referrals
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusInfo = getStatusInfo(referral.status)
  const StatusIcon = statusInfo.icon
  const timeline = generateTimeline(referral)

  return (
    <DashboardLayout role={getDashboardRole()}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/referrals" className="flex items-center text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to referrals
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{referral.position}</h1>
              <p className="text-muted-foreground">
                {referral.company} • Submitted on {new Date(referral.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge className="w-fit" variant={statusInfo.variant}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Tabs defaultValue="details">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Referral Request</CardTitle>
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      {referral.ai_analysis_details && (
                        <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                </CardHeader>
                <CardContent>
                  <TabsContent value="details" className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Job Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Company:</div>
                        <div>{referral.company}</div>
                        <div className="text-muted-foreground">Position:</div>
                        <div>{referral.position}</div>
                        {referral.department && (
                          <>
                            <div className="text-muted-foreground">Department:</div>
                            <div>{referral.department}</div>
                          </>
                        )}
                        <div className="text-muted-foreground">Status:</div>
                        <div>
                          <Badge variant={statusInfo.variant} className="text-xs">
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {referral.resume_url && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-semibold">Resume</h3>
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Resume uploaded</span>
                            <div className="flex gap-2">
                              <Link href={`/referrals/${referral.id}/resume`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </Button>
                              </Link>
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={ReferralAPI.getFileUrl(referral.resume_url)} 
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Download
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {referral.notes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-semibold">Additional Notes</h3>
                          <p className="text-sm text-muted-foreground">{referral.notes}</p>
                        </div>
                      </>
                    )}

                    {referral.ai_analysis_score && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-semibold">AI Match Score</h3>
                          <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold text-primary">
                              {Math.round(referral.ai_analysis_score * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">match confidence</div>
                          </div>
                          {referral.ai_analysis_summary && (
                            <p className="text-sm text-muted-foreground">
                              {referral.ai_analysis_summary}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Feedback section for eligible statuses */}
                    {canProvideFeedback(referral.status) && user?.role === 'candidate' && (
                      <>
                        <Separator />
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            <div>
                              <h3 className="font-semibold text-yellow-800">How did this referral go?</h3>
                              <p className="text-sm text-yellow-700 mt-1">
                                Your feedback helps us improve the referral process and maintain quality standards.
                              </p>
                              <Link href={`/referrals/${referral.id}/feedback`}>
                                <Button variant="outline" className="mt-3">
                                  Provide Feedback
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-4">
                      {timeline.map((item, index) => {
                        const ItemIcon = item.icon
                        return (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <ItemIcon className="h-4 w-4" />
                              </div>
                              {index < timeline.length - 1 && <div className="h-full w-px bg-muted mt-2" />}
                            </div>
                            <div className="space-y-1 pb-4">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.event}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(item.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </TabsContent>

                  {referral.ai_analysis_details && (
                    <TabsContent value="ai-analysis" className="space-y-6">
                      <AIAnalysisTab analysisDetails={referral.ai_analysis_details} />
                    </TabsContent>
                  )}
                </CardContent>
              </Card>
            </Tabs>
          </div>

          {/* Employee Info Sidebar */}
          <div className="space-y-6">
            {referral.employee && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Referred by</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={referral.employee.avatar_url} />
                      <AvatarFallback>
                        {referral.employee.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="font-medium">{referral.employee.name}</h4>
                      <p className="text-sm text-muted-foreground">{referral.employee.email}</p>
                      {referral.employee.position && (
                        <p className="text-sm text-muted-foreground">{referral.employee.position}</p>
                      )}
                      {referral.employee.company && (
                        <p className="text-sm text-muted-foreground">{referral.employee.company}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Referral Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Referral Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span>{new Date(referral.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(referral.updated_at).toLocaleDateString()}</span>
                </div>
                {referral.feedback_score && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Feedback Score:</span>
                    <Badge variant="outline">{referral.feedback_score}/5</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
