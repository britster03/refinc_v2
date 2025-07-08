"use client"

import { useState, useEffect, use } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Clock, CheckCircle, XCircle, FileText, Download, Loader2, Brain, Eye, TrendingUp, Target, BarChart3, PieChart } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ReferralAPI, Referral } from "@/lib/api/referrals"

export default function EmployeeReferralDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [referral, setReferral] = useState<Referral | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState("")
  const { toast } = useToast()

  const fetchReferral = async () => {
    try {
      setLoading(true)
      const data = await ReferralAPI.getReferralById(Number(resolvedParams.id))
      setReferral(data)
    } catch (error: any) {
      console.error('Failed to fetch referral:', error)
      toast({
        title: "Error",
        description: "Failed to load referral details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateReferralStatus = async (newStatus: string) => {
    if (!referral) return
    
    try {
      setUpdating(true)
      const updateData: any = { status: newStatus }
      
      if (feedback.trim()) {
        if (newStatus === 'rejected') {
          // For rejections, use rejection_feedback field
          updateData.rejection_feedback = feedback.trim()
        } else {
          // For other statuses, use feedback_comments
          updateData.feedback_comments = [feedback.trim()]
        }
      }
      
      console.log('Updating referral status:', { referralId: referral.id, updateData })
      const updatedReferral = await ReferralAPI.updateReferral(referral.id, updateData)
      console.log('Updated referral received:', updatedReferral)
      
      setReferral(updatedReferral)
      
      toast({
        title: "Success",
        description: `Referral ${newStatus === 'interview_scheduled' ? 'accepted - interview scheduled' : newStatus.replace('_', ' ')}`,
      })
      
      // Clear feedback after successful update
      if (newStatus === 'rejected') {
        setFeedback('')
      }
      
      // Optionally refresh the data to ensure consistency
      setTimeout(() => {
        fetchReferral()
      }, 1000)
      
    } catch (error: any) {
      console.error('Failed to update referral:', error)
      toast({
        title: "Error",
        description: "Failed to update referral status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleAccept = () => {
    updateReferralStatus('interview_scheduled')
  }

  const handleReject = () => {
    if (feedback.trim()) {
      updateReferralStatus('rejected')
    } else {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback before rejecting the referral.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchReferral()
  }, [resolvedParams.id])

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

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!referral) {
    return (
      <DashboardLayout role="employee">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Referral not found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The referral you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link href="/referrals/employee">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referrals
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const candidateName = referral.candidate?.name || 'Unknown Candidate'
  const candidateInitials = candidateName.split(' ').map(n => n[0]).join('')

  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/referrals/employee" className="flex items-center text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to referrals
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Referral Request</h1>
              <p className="text-muted-foreground">
                {referral.position} • Received on {new Date(referral.created_at).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(referral.status)}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Tabs defaultValue="details">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Referral Details</CardTitle>
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="resume">Resume</TabsTrigger>
                      {referral.ai_analysis_summary && (
                        <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
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
                        {referral.ai_analysis_score && (
                          <>
                            <div className="text-muted-foreground">AI Match Score:</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Brain className="h-3 w-3" />
                                {Math.round(referral.ai_analysis_score * 100)}% match
                              </Badge>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {referral.notes && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h3 className="font-semibold">Additional Notes from Candidate</h3>
                          <p className="text-sm whitespace-pre-wrap">{referral.notes}</p>
                        </div>
                      </>
                    )}
                    {/* Status Update Actions */}
                    {(referral.status === "reviewing" || 
                      referral.status === "interview_scheduled" || 
                      referral.status === "interview_completed" || 
                      referral.status === "offer_extended") && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h3 className="font-semibold">Update Status</h3>
                          
                          {/* Reviewing Status Actions */}
                          {referral.status === "reviewing" && (
                            <div className="flex flex-col gap-4">
                              <div className="grid gap-2">
                                <Textarea
                                  placeholder="Provide feedback to the candidate (optional)"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  className="min-h-[100px]"
                                  disabled={updating}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={handleAccept} 
                                  className="flex-1"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Accept & Schedule Interview
                                </Button>
                                <Button 
                                  onClick={handleReject} 
                                  variant="outline" 
                                  className="flex-1"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Decline Referral
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Interview Scheduled Actions */}
                          {referral.status === "interview_scheduled" && (
                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-muted-foreground">
                                Interview has been scheduled. Update the status once the interview is completed.
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => updateReferralStatus('interview_completed')} 
                                  className="flex-1"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Mark Interview Completed
                                </Button>
                                <Button 
                                  onClick={() => updateReferralStatus('rejected')} 
                                  variant="outline"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Cancel Interview
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Interview Completed Actions */}
                          {referral.status === "interview_completed" && (
                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-muted-foreground">
                                Interview completed. What's the next step for this candidate?
                              </p>
                              <div className="grid gap-2">
                                <Button 
                                  onClick={() => updateReferralStatus('offer_extended')} 
                                  className="w-full"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Extend Job Offer
                                </Button>
                                <Button 
                                  onClick={() => updateReferralStatus('rejected')} 
                                  variant="outline"
                                  className="w-full"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Not Selected After Interview
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Offer Extended Actions */}
                          {referral.status === "offer_extended" && (
                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-muted-foreground">
                                Job offer has been extended. Update when candidate responds to the offer.
                              </p>
                              <div className="grid gap-2">
                                <Button 
                                  onClick={() => updateReferralStatus('hired')} 
                                  className="w-full"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Mark as Hired (Offer Accepted)
                                </Button>
                                <Button 
                                  onClick={() => updateReferralStatus('rejected')} 
                                  variant="outline"
                                  className="w-full"
                                  disabled={updating}
                                >
                                  {updating ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Offer Declined by Candidate
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Success Message for Final States */}
                    {(referral.status === "hired" || referral.status === "rejected") && (
                      <>
                        <Separator />
                        <div className={`rounded-md p-4 ${referral.status === "hired" ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            {referral.status === "hired" ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-500" />
                            )}
                            <div>
                              <h3 className={`font-semibold ${referral.status === "hired" ? "text-green-800" : "text-gray-800"}`}>
                                {referral.status === "hired" ? "Referral Successful!" : "Referral Completed"}
                              </h3>
                              <p className={`text-sm ${referral.status === "hired" ? "text-green-700" : "text-gray-700"}`}>
                                {referral.status === "hired" 
                                  ? "Congratulations! The candidate has been successfully hired through your referral."
                                  : "This referral has been completed. The candidate can provide feedback about the process."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="resume" className="space-y-4">
                    {referral.resume_url ? (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span>Resume.pdf</span>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`${ReferralAPI.getFileUrl(referral.resume_url || '')}?download=true`} target="_blank" rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        </div>
                        <div className="aspect-[3/4] rounded-md border bg-white overflow-hidden">
                          {referral.resume_url.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                              src={ReferralAPI.getFileUrl(referral.resume_url || '')}
                              className="w-full h-full border-0"
                              title="Resume Preview"
                              allow="fullscreen"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-8">
                              <div className="text-center">
                                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="font-medium text-lg mb-2">Document Preview</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  This file type cannot be previewed in the browser
                                </p>
                                <Button variant="outline" asChild>
                                  <a href={`${ReferralAPI.getFileUrl(referral.resume_url || '')}?download=true`} target="_blank" rel="noopener noreferrer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download to View
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium">No resume uploaded</h3>
                        <p className="text-sm text-muted-foreground">
                          The candidate hasn't uploaded a resume for this referral.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  {referral.ai_analysis_summary && (
                    <TabsContent value="analysis" className="space-y-8">
                      {(() => {
                        try {
                          let analysisData = null;
                          if (referral.ai_analysis_details) {
                            if (typeof referral.ai_analysis_details === 'string') {
                              analysisData = JSON.parse(referral.ai_analysis_details);
                            } else if (typeof referral.ai_analysis_details === 'object') {
                              analysisData = referral.ai_analysis_details;
                            }
                          }
                          
                          return (
                            <div className="space-y-8">
                              {/* Executive Summary */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-blue-100">
                                    <Brain className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h2 className="text-xl font-bold text-gray-900">AI Analysis Report</h2>
                                    <p className="text-sm text-gray-600">Comprehensive candidate evaluation powered by advanced AI</p>
                                  </div>
                                  {referral.ai_analysis_score && (
                                    <div className="text-right">
                                      <div className="text-3xl font-bold text-gray-900">
                                        {Math.round(referral.ai_analysis_score * 100)}%
                                        {analysisData?.score_override && (
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            Corrected
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-600">Overall Match</div>
                                      {analysisData?.score_override && (
                                        <div className="text-xs text-yellow-700 mt-1">
                                          Originally {Math.round(analysisData.score_override.original_score)}%
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {referral.ai_analysis_score && (
                                  <div className="space-y-3">
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                      <div 
                                        className={`h-4 rounded-full transition-all duration-500 ${
                                          referral.ai_analysis_score >= 0.8 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                                          referral.ai_analysis_score >= 0.6 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                                          'bg-gradient-to-r from-red-400 to-red-600'
                                        }`}
                                        style={{ width: `${referral.ai_analysis_score * 100}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                      <span>Poor Match</span>
                                      <span>Excellent Match</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Executive Summary */}
                                {analysisData?.executive_summary && (
                                  <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                      Executive Summary
                                    </h3>
                                    <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">{analysisData.executive_summary}</p>
                                  </div>
                                )}
                                
                                {/* Basic Summary Fallback */}
                                {!analysisData?.executive_summary && referral.ai_analysis_summary && (
                                  <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-3">Analysis Summary</h3>
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{referral.ai_analysis_summary}</p>
                                  </div>
                                )}
                              </div>

                              {analysisData && (
                                <>
                                  {/* Skills Analysis */}
                                  {analysisData.skills_analysis && (
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-emerald-100">
                                          <div className="w-6 h-6 rounded-full bg-emerald-600"></div>
                                        </div>
                                        <div>
                                          <h3 className="text-xl font-bold text-gray-900">Skills Analysis</h3>
                                          <p className="text-sm text-gray-600">Technical and soft skills evaluation</p>
                                        </div>
                                      </div>

                                      {/* Skills Analysis Summary */}
                                      {analysisData.skills_analysis.analysis_summary && (
                                        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                                          <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                            Skills Assessment Overview
                                          </h4>
                                          <p className="text-emerald-800 leading-relaxed">{analysisData.skills_analysis.analysis_summary}</p>
                                        </div>
                                      )}
                                      
                                      {/* Skills Visualization Dashboard */}
                                      {analysisData.skills_analysis.technical_skills && (
                                        <div className="space-y-6">
                                          {/* Skills Overview Chart */}
                                          <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-4">
                                              <BarChart3 className="h-5 w-5 text-blue-600" />
                                              <h4 className="font-semibold text-gray-900">Skills Match Analysis</h4>
                                            </div>
                                            
                                            {/* Skills Distribution Chart */}
                                            <div className="space-y-4">
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                                                  <div className="text-2xl font-bold text-green-600">
                                                    {analysisData.skills_analysis.technical_skills.matched_skills?.length || 0}
                                                  </div>
                                                  <div className="text-sm text-green-700">Matched Skills</div>
                                                </div>
                                                <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                                                  <div className="text-2xl font-bold text-red-600">
                                                    {analysisData.skills_analysis.technical_skills.missing_skills?.length || 0}
                                                  </div>
                                                  <div className="text-sm text-red-700">Missing Skills</div>
                                                </div>
                                                <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                                                  <div className="text-2xl font-bold text-orange-600">
                                                    {analysisData.skills_analysis.technical_skills.matched_skills?.filter((s: any) => s.importance === 'critical').length || 0}
                                                  </div>
                                                  <div className="text-sm text-orange-700">Critical Skills</div>
                                                </div>
                                                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                                                  <div className="text-2xl font-bold text-blue-600">
                                                    {analysisData.skills_analysis.technical_skills.matched_skills ? 
                                                      Math.round(analysisData.skills_analysis.technical_skills.matched_skills.reduce((acc: number, skill: any) => acc + skill.match_score, 0) / analysisData.skills_analysis.technical_skills.matched_skills.length) : 0}%
                                                  </div>
                                                  <div className="text-sm text-blue-700">Avg Match</div>
                                                </div>
                                              </div>

                                              {/* Skills Breakdown Chart */}
                                              {analysisData.skills_analysis.technical_skills.matched_skills && analysisData.skills_analysis.technical_skills.matched_skills.length > 0 && (
                                                <div className="space-y-3">
                                                  <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-green-600" />
                                                    Skills Performance Analysis
                                                  </h5>
                                                  {analysisData.skills_analysis.technical_skills.matched_skills.map((skill: any, index: number) => (
                                                    <div key={index} className="space-y-2">
                                                      <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                          <span className="font-medium text-gray-900">{skill.skill}</span>
                                                          <Badge 
                                                            variant={skill.importance === 'critical' ? 'destructive' : skill.importance === 'important' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                          >
                                                            {skill.importance}
                                                          </Badge>
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                          {skill.resume_level} → {skill.required_level} ({skill.match_score}%)
                                                        </div>
                                                      </div>
                                                      <div className="relative">
                                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                                          <div 
                                                            className={`h-3 rounded-full transition-all duration-500 ${
                                                              skill.match_score >= 90 ? 'bg-green-500' :
                                                              skill.match_score >= 75 ? 'bg-blue-500' :
                                                              skill.match_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                            style={{ width: `${skill.match_score}%` }}
                                                          ></div>
                                                        </div>
                                                        <div className="absolute right-0 top-0 mt-4 text-xs text-gray-500">
                                                          {skill.match_score}%
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {analysisData.skills_analysis.technical_skills.missing_skills && analysisData.skills_analysis.technical_skills.missing_skills.length > 0 && (
                                            <div className="space-y-2">
                                              <h5 className="font-medium text-orange-700">⚠ Missing Technical Skills ({analysisData.skills_analysis.technical_skills.missing_skills.length})</h5>
                                              <div className="grid gap-2">
                                                {analysisData.skills_analysis.technical_skills.missing_skills.map((skill: any, index: number) => (
                                                  <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                                                    <div className="flex items-center gap-2">
                                                      <Badge variant="outline" className="border-orange-300 text-orange-700">
                                                        {skill.skill}
                                                      </Badge>
                                                      <span className="text-xs text-orange-600">
                                                        {skill.learning_difficulty} to learn
                                                      </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-xs text-orange-600">Market demand: {skill.market_demand}</span>
                                                      <Badge 
                                                        variant={skill.importance === 'critical' ? 'destructive' : skill.importance === 'important' ? 'default' : 'secondary'}
                                                        className="text-xs"
                                                      >
                                                        {skill.importance}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Soft Skills */}
                                      {analysisData.skills_analysis.soft_skills && (
                                        <div className="space-y-2">
                                          <h5 className="font-medium text-blue-700">Soft Skills Assessment</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="p-3 rounded-lg bg-blue-50">
                                              <div className="text-lg font-bold text-blue-700">
                                                {analysisData.skills_analysis.soft_skills.leadership_indicators}%
                                              </div>
                                              <div className="text-sm text-blue-600">Leadership</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-blue-50">
                                              <div className="text-lg font-bold text-blue-700">
                                                {analysisData.skills_analysis.soft_skills.communication_indicators}%
                                              </div>
                                              <div className="text-sm text-blue-600">Communication</div>
                                            </div>
                                            <div className="p-3 rounded-lg bg-blue-50">
                                              <div className="text-lg font-bold text-blue-700">
                                                {analysisData.skills_analysis.soft_skills.teamwork_indicators}%
                                              </div>
                                              <div className="text-sm text-blue-600">Teamwork</div>
                                            </div>
                                          </div>
                                          {analysisData.skills_analysis.soft_skills.matched_skills && analysisData.skills_analysis.soft_skills.matched_skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {analysisData.skills_analysis.soft_skills.matched_skills.map((skill: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                                                  {skill}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Experience Analysis */}
                                  {analysisData.experience_analysis && (
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-100">
                                          <div className="w-6 h-6 rounded-full bg-purple-600"></div>
                                        </div>
                                        <div>
                                          <h3 className="text-xl font-bold text-gray-900">Experience Analysis</h3>
                                          <p className="text-sm text-gray-600">Career progression and industry relevance</p>
                                        </div>
                                      </div>

                                      {/* Experience Analysis Summary */}
                                      {analysisData.experience_analysis.analysis_summary && (
                                        <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200">
                                          <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                                            Experience Assessment Overview
                                          </h4>
                                          <p className="text-purple-800 leading-relaxed">{analysisData.experience_analysis.analysis_summary}</p>
                                        </div>
                                      )}
                                      
                                      {/* Experience Analytics Dashboard */}
                                      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                          <TrendingUp className="h-5 w-5 text-purple-600" />
                                          <h4 className="font-semibold text-gray-900">Experience Analytics Dashboard</h4>
                                        </div>

                                        {/* Experience Metrics */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                          {analysisData.experience_analysis.years_experience && (
                                            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                                              <div className="text-3xl font-bold text-purple-700">
                                                {analysisData.experience_analysis.years_experience.candidate}
                                              </div>
                                              <div className="text-sm text-purple-600">Years Experience</div>
                                              <div className="text-xs text-purple-500 mt-1">
                                                Required: {analysisData.experience_analysis.years_experience.required}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {analysisData.experience_analysis.years_experience && (
                                            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                                              <div className="text-3xl font-bold text-blue-700">
                                                {analysisData.experience_analysis.years_experience.match_score}%
                                              </div>
                                              <div className="text-sm text-blue-600">Experience Match</div>
                                            </div>
                                          )}
                                          
                                          {analysisData.experience_analysis.industry_experience && (
                                            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                                              <div className="text-3xl font-bold text-green-700">
                                                {analysisData.experience_analysis.industry_experience.match_score}%
                                              </div>
                                              <div className="text-sm text-green-600">Industry Match</div>
                                            </div>
                                          )}

                                          {analysisData.experience_analysis.role_progression && (
                                            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                                              <div className="text-3xl font-bold text-amber-700">
                                                {Math.round((analysisData.experience_analysis.role_progression.career_growth + analysisData.experience_analysis.role_progression.leadership_experience + analysisData.experience_analysis.role_progression.project_complexity) / 3)}%
                                              </div>
                                              <div className="text-sm text-amber-600">Career Growth</div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Experience Breakdown Chart */}
                                        {analysisData.experience_analysis.role_progression && (
                                          <div className="space-y-4">
                                            <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                              <PieChart className="h-4 w-4 text-purple-600" />
                                              Role Progression Analysis
                                            </h5>
                                            
                                            <div className="space-y-3">
                                              <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Career Growth Trajectory</span>
                                                <span className="text-sm text-gray-600">{analysisData.experience_analysis.role_progression.career_growth}%</span>
                                              </div>
                                              <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                  className="h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
                                                  style={{ width: `${analysisData.experience_analysis.role_progression.career_growth}%` }}
                                                ></div>
                                              </div>

                                              <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Leadership Experience</span>
                                                <span className="text-sm text-gray-600">{analysisData.experience_analysis.role_progression.leadership_experience}%</span>
                                              </div>
                                              <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                  className="h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                                                  style={{ width: `${analysisData.experience_analysis.role_progression.leadership_experience}%` }}
                                                ></div>
                                              </div>

                                              <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-700">Project Complexity</span>
                                                <span className="text-sm text-gray-600">{analysisData.experience_analysis.role_progression.project_complexity}%</span>
                                              </div>
                                              <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div 
                                                  className="h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                                                  style={{ width: `${analysisData.experience_analysis.role_progression.project_complexity}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Industry Experience Details */}
                                      {analysisData.experience_analysis.industry_experience && (
                                        <div className="space-y-2">
                                          <h5 className="font-medium text-purple-700">Industry Experience</h5>
                                          {analysisData.experience_analysis.industry_experience.relevant_industries && (
                                            <div className="flex flex-wrap gap-2">
                                              {analysisData.experience_analysis.industry_experience.relevant_industries.map((industry: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                                                  {industry}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                          {analysisData.experience_analysis.industry_experience.transferable_experience && (
                                            <div>
                                              <span className="text-sm text-purple-600">Transferable Experience: </span>
                                              <div className="flex flex-wrap gap-2 mt-1">
                                                {analysisData.experience_analysis.industry_experience.transferable_experience.map((exp: string, index: number) => (
                                                  <Badge key={index} variant="outline" className="border-purple-300 text-purple-700">
                                                    {exp}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Role Progression */}
                                      {analysisData.experience_analysis.role_progression && (
                                        <div className="space-y-2">
                                          <h5 className="font-medium text-purple-700">Role Progression Indicators</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="p-2 rounded bg-purple-50">
                                              <div className="text-lg font-bold text-purple-700">
                                                {analysisData.experience_analysis.role_progression.career_growth}%
                                              </div>
                                              <div className="text-xs text-purple-600">Career Growth</div>
                                            </div>
                                            <div className="p-2 rounded bg-purple-50">
                                              <div className="text-lg font-bold text-purple-700">
                                                {analysisData.experience_analysis.role_progression.leadership_experience}%
                                              </div>
                                              <div className="text-xs text-purple-600">Leadership</div>
                                            </div>
                                            <div className="p-2 rounded bg-purple-50">
                                              <div className="text-lg font-bold text-purple-700">
                                                {analysisData.experience_analysis.role_progression.project_complexity}%
                                              </div>
                                              <div className="text-xs text-purple-600">Project Complexity</div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Strengths */}
                                  {analysisData.strengths && analysisData.strengths.length > 0 && (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-lg flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        Key Strengths
                                      </h4>
                                      <div className="space-y-2">
                                        {analysisData.strengths.map((strength: string, index: number) => (
                                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
                                            <p className="text-sm text-green-800">{strength}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Concerns */}
                                  {analysisData.concerns && analysisData.concerns.length > 0 && (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-lg flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                        Areas of Concern
                                      </h4>
                                      <div className="space-y-2">
                                        {analysisData.concerns.map((concern: string, index: number) => (
                                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-orange-50">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                                            <p className="text-sm text-orange-800">{concern}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Recommendations */}
                                  {(analysisData.improvement_recommendations?.recommendations || analysisData.improvement_recommendations) && (
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-100">
                                          <div className="w-6 h-6 rounded-full bg-amber-600"></div>
                                        </div>
                                        <div>
                                          <h3 className="text-xl font-bold text-gray-900">Development Recommendations</h3>
                                          <p className="text-sm text-gray-600">Strategic guidance for candidate growth</p>
                                        </div>
                                      </div>

                                      {/* Recommendations Summary */}
                                      {analysisData.improvement_recommendations?.summary && (
                                        <div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                                          <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                                            Development Strategy Overview
                                          </h4>
                                          <p className="text-amber-800 leading-relaxed">{analysisData.improvement_recommendations.summary}</p>
                                        </div>
                                      )}
                                      <div className="space-y-4">
                                        {(analysisData.improvement_recommendations?.recommendations || analysisData.improvement_recommendations || []).map((rec: any, index: number) => (
                                          <div key={index} className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <Badge 
                                                  variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                                  className="text-xs"
                                                >
                                                  {rec.priority} priority
                                                </Badge>
                                                <span className="text-sm font-medium text-blue-700">{rec.area}</span>
                                              </div>
                                              {rec.impact_on_match && (
                                                <span className="text-xs text-blue-600">+{rec.impact_on_match}% match</span>
                                              )}
                                            </div>
                                            <div className="space-y-2">
                                              {rec.specific_actions && rec.specific_actions.length > 0 && (
                                                <div>
                                                  <span className="text-xs font-medium text-blue-700">Actions:</span>
                                                  <ul className="text-sm text-blue-800 ml-4 list-disc">
                                                    {rec.specific_actions.map((action: string, actionIndex: number) => (
                                                      <li key={actionIndex}>{action}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              {rec.timeline && (
                                                <div className="text-xs text-blue-600">
                                                  <span className="font-medium">Timeline:</span> {rec.timeline}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Strategic Recommendations */}
                                  {analysisData.strategic_recommendations && (
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-100">
                                          <div className="w-6 h-6 rounded-full bg-indigo-600"></div>
                                        </div>
                                        <div>
                                          <h3 className="text-xl font-bold text-gray-900">Strategic Recommendations</h3>
                                          <p className="text-sm text-gray-600">Executive guidance for hiring decisions</p>
                                        </div>
                                      </div>

                                      <div className="grid gap-6">
                                        {/* Hiring Manager Brief */}
                                        {analysisData.strategic_recommendations.hiring_manager_brief && (
                                          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
                                            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                              Hiring Manager Brief
                                            </h4>
                                            <p className="text-indigo-800 leading-relaxed">{analysisData.strategic_recommendations.hiring_manager_brief}</p>
                                          </div>
                                        )}

                                        {/* Interview Strategy */}
                                        {analysisData.strategic_recommendations.interview_strategy && (
                                          <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                                            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                              <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                              Interview Strategy
                                            </h4>
                                            <p className="text-green-800 leading-relaxed">{analysisData.strategic_recommendations.interview_strategy}</p>
                                          </div>
                                        )}

                                        {/* Onboarding & Retention */}
                                        <div className="grid md:grid-cols-2 gap-4">
                                          {analysisData.strategic_recommendations.onboarding_considerations && (
                                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                              <h5 className="font-semibold text-purple-900 mb-2">Onboarding Considerations</h5>
                                              <p className="text-purple-800 text-sm leading-relaxed">{analysisData.strategic_recommendations.onboarding_considerations}</p>
                                            </div>
                                          )}
                                          {analysisData.strategic_recommendations.retention_strategy && (
                                            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                              <h5 className="font-semibold text-orange-900 mb-2">Retention Strategy</h5>
                                              <p className="text-orange-800 text-sm leading-relaxed">{analysisData.strategic_recommendations.retention_strategy}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Hiring Insights */}
                                  {(analysisData.interview_probability || analysisData.hiring_probability || analysisData.cultural_fit || analysisData.hiring_insights) && (
                                    <div className="space-y-6">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-slate-100">
                                          <div className="w-6 h-6 rounded-full bg-slate-600"></div>
                                        </div>
                                        <div>
                                          <h3 className="text-xl font-bold text-gray-900">Hiring Insights</h3>
                                          <p className="text-sm text-gray-600">Data-driven hiring predictions and factors</p>
                                        </div>
                                      </div>
                                      
                                      {/* Hiring Prediction Analytics */}
                                      <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-2 mb-6">
                                          <Target className="h-5 w-5 text-slate-600" />
                                          <h4 className="font-semibold text-gray-900">Hiring Prediction Analytics</h4>
                                        </div>

                                        {/* Prediction Metrics Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                          {analysisData.interview_probability && (
                                            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                                              <div className="text-3xl font-bold text-blue-700">
                                                {analysisData.interview_probability}%
                                              </div>
                                              <div className="text-sm text-blue-600">Interview Likelihood</div>
                                            </div>
                                          )}
                                          
                                          {analysisData.hiring_probability && (
                                            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                                              <div className="text-3xl font-bold text-green-700">
                                                {analysisData.hiring_probability}%
                                              </div>
                                              <div className="text-sm text-green-600">Hiring Probability</div>
                                            </div>
                                          )}
                                          
                                          {analysisData.cultural_fit && analysisData.cultural_fit.company_values_alignment && (
                                            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                                              <div className="text-3xl font-bold text-purple-700">
                                                {analysisData.cultural_fit.company_values_alignment}%
                                              </div>
                                              <div className="text-sm text-purple-600">Cultural Fit</div>
                                            </div>
                                          )}

                                          {analysisData.cultural_fit && analysisData.cultural_fit.work_style_match && (
                                            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                                              <div className="text-3xl font-bold text-amber-700">
                                                {analysisData.cultural_fit.work_style_match}%
                                              </div>
                                              <div className="text-sm text-amber-600">Work Style Match</div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Prediction Success Funnel */}
                                        <div className="space-y-4">
                                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-slate-600" />
                                            Hiring Success Funnel
                                          </h5>
                                          
                                          <div className="space-y-3">
                                            {analysisData.interview_probability && (
                                              <div className="relative">
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className="text-sm font-medium text-gray-700">Interview Stage</span>
                                                  <span className="text-sm text-blue-600">{analysisData.interview_probability}% likely</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4">
                                                  <div 
                                                    className="h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700"
                                                    style={{ width: `${analysisData.interview_probability}%` }}
                                                  ></div>
                                                </div>
                                              </div>
                                            )}

                                            {analysisData.hiring_probability && (
                                              <div className="relative">
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className="text-sm font-medium text-gray-700">Final Hiring</span>
                                                  <span className="text-sm text-green-600">{analysisData.hiring_probability}% likely</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4">
                                                  <div 
                                                    className="h-4 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700"
                                                    style={{ width: `${analysisData.hiring_probability}%` }}
                                                  ></div>
                                                </div>
                                              </div>
                                            )}

                                            {/* Success Indicators */}
                                            <div className="mt-4 p-4 rounded-lg bg-gray-50">
                                              <div className="text-sm font-medium text-gray-700 mb-2">Success Indicators:</div>
                                              <div className="flex flex-wrap gap-2">
                                                {analysisData.interview_probability >= 80 && (
                                                  <Badge className="bg-blue-100 text-blue-800">High Interview Potential</Badge>
                                                )}
                                                {analysisData.hiring_probability >= 75 && (
                                                  <Badge className="bg-green-100 text-green-800">Strong Hiring Candidate</Badge>
                                                )}
                                                {analysisData.cultural_fit?.company_values_alignment >= 80 && (
                                                  <Badge className="bg-purple-100 text-purple-800">Cultural Match</Badge>
                                                )}
                                                {analysisData.overall_match_score >= 85 && (
                                                  <Badge className="bg-yellow-100 text-yellow-800">Top Candidate</Badge>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {analysisData.cultural_fit && analysisData.cultural_fit.team_fit_indicators && (
                                        <div className="space-y-2">
                                          <h5 className="font-medium text-indigo-700">Team Fit Indicators</h5>
                                          <div className="flex flex-wrap gap-2">
                                            {analysisData.cultural_fit.team_fit_indicators.map((indicator: string, index: number) => (
                                              <Badge key={index} variant="secondary" className="bg-indigo-100 text-indigo-800">
                                                {indicator}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        } catch (error: any) {
                          console.error('Error parsing AI analysis details:', error);
                          console.error('Raw data that failed to parse:', referral.ai_analysis_details);
                          
                          // Check if this is a template detection error by parsing the raw data
                          let errorData = null;
                          try {
                            if (referral.ai_analysis_details) {
                              if (typeof referral.ai_analysis_details === 'string') {
                                errorData = JSON.parse(referral.ai_analysis_details);
                              } else {
                                errorData = referral.ai_analysis_details;
                              }
                            }
                          } catch (parseError) {
                            // Continue with regular error handling
                          }

                          if (errorData?.template_detected || errorData?.error) {
                            return (
                              <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-red-100">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                  </div>
                                  <div>
                                    <h2 className="text-xl font-bold text-red-900">Invalid Resume Detected</h2>
                                    <p className="text-sm text-red-600">Resume appears to be a template or contains placeholder content</p>
                                  </div>
                                </div>
                                
                                <div className="p-6 rounded-xl bg-red-50 border border-red-200">
                                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                    Validation Issues
                                  </h3>
                                  <p className="text-red-800 mb-4">{errorData?.error || "Resume content validation failed"}</p>
                                  
                                  {errorData?.validation_issues && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-red-900">Detected Issues:</h4>
                                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                                        {errorData.validation_issues.map((issue: string, index: number) => (
                                          <li key={index}>{issue}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  <div className="mt-4 p-3 rounded bg-yellow-100 border border-yellow-300">
                                    <h4 className="font-medium text-yellow-900">What to do:</h4>
                                    <p className="text-sm text-yellow-800">
                                      Ask the candidate to submit a completed resume with their actual information, experience, and skills instead of a template.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">AI Analysis Summary</h3>
                          {referral.ai_analysis_score && (
                            <Badge variant="outline" className="ml-auto">
                                    {Math.round(referral.ai_analysis_score * 100)}% match
                            </Badge>
                          )}
                        </div>
                              
                              {referral.ai_analysis_score && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Match Score</span>
                                    <span className="font-medium">{Math.round(referral.ai_analysis_score * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                      className={`h-3 rounded-full transition-all duration-300 ${
                                        referral.ai_analysis_score >= 0.8 ? 'bg-green-500' : 
                                        referral.ai_analysis_score >= 0.6 ? 'bg-yellow-500' : 
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${referral.ai_analysis_score * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{referral.ai_analysis_summary}</p>
                        </div>
                              
                              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                  <span className="text-sm font-medium text-yellow-800">Detailed Analysis Unavailable</span>
                      </div>
                                <p className="text-sm text-yellow-700">
                                  The detailed AI analysis data could not be loaded. The basic match score and summary are shown above.
                                </p>
                                {process.env.NODE_ENV === 'development' && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-yellow-600 cursor-pointer">Debug Info (Dev Mode)</summary>
                                    <pre className="text-xs text-yellow-600 mt-1 overflow-auto max-h-32">
                                      {JSON.stringify({
                                        error: error.message,
                                        dataType: typeof referral.ai_analysis_details,
                                        dataPreview: String(referral.ai_analysis_details).substring(0, 200) + '...'
                                      }, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                      </div>
                          );
                        }
                      })()}
                    </TabsContent>
                  )}
                </CardContent>
              </Card>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Candidate</CardTitle>
                <CardDescription>Candidate requesting a referral</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 text-center">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={referral.candidate?.avatar_url || "/placeholder.svg"} alt={candidateName} />
                    <AvatarFallback>{candidateInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{candidateName}</h3>
                    <p className="text-sm text-muted-foreground">{referral.candidate?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

                        {referral.status !== "pending" && referral.status !== "reviewing" && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Decision</CardTitle>
                  <CardDescription>
                    You have {referral.status === 'interview_scheduled' ? 'accepted' : referral.status.replace('_', ' ')} this referral request
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(referral.status)}
                    </div>
                    {referral.feedback_comments && referral.feedback_comments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Your Feedback:</h4>
                        {referral.feedback_comments.map((comment, index) => (
                          <p key={index} className="text-sm p-3 bg-muted rounded">{comment}</p>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Updated: {new Date(referral.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
