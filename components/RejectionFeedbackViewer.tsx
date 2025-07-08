"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MessageSquare, TrendingUp, AlertCircle, CheckCircle2, MessageCircleIcon, Lightbulb, HelpCircle, Target } from "lucide-react"
import { freeConversationsAPI, CreateFreeConversationData } from "@/lib/api/free-conversations"
import { toast } from "sonner"
import Link from "next/link"

interface RejectionFeedbackViewerProps {
  rejectionFeedback: string
  rejectionFeedbackAnalysis?: {
    primary_reasons: string[]
    sentiment: string
    tone: string
    constructiveness_score: number
    improvement_suggestions: string[]
    potential_additional_reasons: string[]
    follow_up_questions: string[]
    overall_analysis: string
    candidate_action_items: string[]
  }
  referralId: number
  employeeName: string
  position: string
  company: string
}

export function RejectionFeedbackViewer({
  rejectionFeedback,
  rejectionFeedbackAnalysis,
  referralId,
  employeeName,
  position,
  company
}: RejectionFeedbackViewerProps) {
  const [startingConversation, setStartingConversation] = useState(false)
  const [conversationStarted, setConversationStarted] = useState(false)

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
      case 'constructive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'neutral':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getConstructivenessLevel = (score: number) => {
    if (score >= 0.8) return { label: 'Very Constructive', color: 'text-green-600' }
    if (score >= 0.6) return { label: 'Constructive', color: 'text-blue-600' }
    if (score >= 0.4) return { label: 'Somewhat Constructive', color: 'text-yellow-600' }
    return { label: 'Needs Improvement', color: 'text-red-600' }
  }

  const handleStartConversation = async () => {
    try {
      setStartingConversation(true)
      
      // First, check if a conversation already exists for this referral
      try {
        const conversations = await freeConversationsAPI.getFreeConversations()
        const existingConversation = conversations.find(
          (conv: any) => conv.referral_id === referralId
        )
        
        if (existingConversation) {
          toast.success("Redirecting to Existing Conversation", {
            description: "Found your existing conversation for this referral."
          })
          window.location.href = `/free-conversations/${existingConversation.id}`
          return
        }
      } catch (checkError) {
        console.log("Could not check for existing conversations, proceeding to create new one")
      }
      
      const conversationData: CreateFreeConversationData = {
        referral_id: referralId
      }

      const conversation = await freeConversationsAPI.createFreeConversation(conversationData)
      
      toast.success("Conversation Started", {
        description: "You can now discuss the feedback with the employee (10 messages limit)."
      })
      
      setConversationStarted(true)
      
      // Redirect to the conversation page
      window.location.href = `/free-conversations/${conversation.id}`
      
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        // If conversation already exists, try to find and redirect to it
        try {
          const conversations = await freeConversationsAPI.getFreeConversations()
          const existingConversation = conversations.find(
            (conv: any) => conv.referral_id === referralId
          )
          
          if (existingConversation) {
            toast.success("Redirecting to Existing Conversation", {
              description: "Found your existing conversation for this referral."
            })
            window.location.href = `/free-conversations/${existingConversation.id}`
            return
          }
        } catch (fetchError) {
          console.error("Failed to fetch existing conversations:", fetchError)
        }
        
        toast.error("Conversation Already Exists", {
          description: "A conversation for this referral already exists, but we couldn't locate it."
        })
      } else {
        toast.error("Error", {
          description: "Failed to start conversation. Please try again."
        })
      }
    } finally {
      setStartingConversation(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Original Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Employee Feedback
          </CardTitle>
          <CardDescription>
            Feedback from {employeeName} regarding your referral for {position} at {company}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 whitespace-pre-wrap">{rejectionFeedback}</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis */}
      {rejectionFeedbackAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI Analysis & Insights
            </CardTitle>
            <CardDescription>
              Our AI has analyzed the feedback to provide additional insights and suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sentiment & Tone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Sentiment</h4>
                <Badge className={getSentimentColor(rejectionFeedbackAnalysis.sentiment)}>
                  {rejectionFeedbackAnalysis.sentiment}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Tone</h4>
                <Badge variant="outline">
                  {rejectionFeedbackAnalysis.tone}
                </Badge>
              </div>
            </div>

            {/* Constructiveness Score */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Constructiveness Level</h4>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${rejectionFeedbackAnalysis.constructiveness_score * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${getConstructivenessLevel(rejectionFeedbackAnalysis.constructiveness_score).color}`}>
                  {getConstructivenessLevel(rejectionFeedbackAnalysis.constructiveness_score).label}
                </span>
              </div>
            </div>

            <Separator />

            {/* Primary Reasons */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Key Reasons for Rejection
              </h4>
              <ul className="space-y-2">
                {rejectionFeedbackAnalysis.primary_reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvement Suggestions */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Improvement Suggestions
              </h4>
              <ul className="space-y-2">
                {rejectionFeedbackAnalysis.improvement_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recommended Next Steps
              </h4>
              <ul className="space-y-2">
                {rejectionFeedbackAnalysis.candidate_action_items.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Overall Analysis */}
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>Overall Assessment:</strong> {rejectionFeedbackAnalysis.overall_analysis}
              </AlertDescription>
            </Alert>

            {/* Potential Additional Reasons */}
            <details className="border rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-600 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Potential Additional Factors (Click to expand)
              </summary>
              <div className="mt-3 space-y-2">
                {rejectionFeedbackAnalysis.potential_additional_reasons.map((reason, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    • {reason}
                  </p>
                ))}
              </div>
            </details>

            {/* Follow-up Questions */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                <MessageCircleIcon className="h-4 w-4" />
                Questions You Could Ask
              </h4>
              <ul className="space-y-2">
                {rejectionFeedbackAnalysis.follow_up_questions.map((question, index) => (
                  <li key={index} className="text-sm text-gray-700 p-2 bg-blue-50 rounded">
                    "{question}"
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            You can discuss this feedback directly with the employee through a free conversation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              Free conversations are limited to 10 messages. After that, you can upgrade to premium for unlimited messaging.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleStartConversation}
              disabled={startingConversation || conversationStarted}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {startingConversation ? "Starting..." : "Start Free Conversation"}
            </Button>
            
            <Link href="/premium-conversations">
              <Button variant="outline" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 