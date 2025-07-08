"use client"

import { useState, useEffect, useRef, use } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Clock, Send, Paperclip, Video, Phone, FileText, Star, Upload, Download, AlertCircle, CheckCircle, XCircle, MessageCircle, Users, CalendarClock, DollarSign } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import VideoCallInterface from "@/components/video-call-interface"
import VideoCallRoom from "@/components/video-call-room"
import { authClient } from "@/lib/auth"

interface Message {
  id: number
  sender_id: number
  sender_role: "employee" | "candidate"
  content: string
  timestamp: string
  attachments?: string[]
}

interface ConversationDetails {
  id: number
  topic: string
  status: "pending" | "accepted" | "in_progress" | "completed" | "cancelled"
  duration_minutes: number
  hourly_rate: number
  total_cost: number
  scheduled_datetime: string
  started_at?: string
  ended_at?: string
  employee: {
    id: number
    first_name: string
    last_name: string
    email: string
    rating: number
    expertise: string[]
    bio: string
    avatar_url?: string
  }
  candidate: {
    id: number
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
  messages: Message[]
}

export default function PremiumConversationSession({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const roleParam = searchParams.get("role")
  const role: "candidate" | "employee" = (roleParam === "employee" ? "employee" : "candidate")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousMessageCount = useRef(0)
  
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingComment, setRatingComment] = useState("")
  const [sessionExtended, setSessionExtended] = useState(false)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [showVideoCallRoom, setShowVideoCallRoom] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const session = authClient.getSession()
    if (session?.user) {
      setCurrentUser(session.user)
    }
    fetchConversationDetails()
  }, [resolvedParams.sessionId])

  useEffect(() => {
    // Only scroll if new messages were actually added (not just during initial load)
    if (messages.length > previousMessageCount.current && previousMessageCount.current > 0) {
      const timer = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
      previousMessageCount.current = messages.length
      return () => clearTimeout(timer)
    } else {
      // Update the count without scrolling during initial load
      previousMessageCount.current = messages.length
    }
  }, [messages.length])

  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (isActive && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
          setIsActive(false)
            setSessionStarted(false)
            toast({
              title: "Session Ended",
              description: "Your session time has expired.",
              variant: "destructive",
            })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isActive, timeRemaining])

  useEffect(() => {
    if (!sessionStarted) return

    const pollInterval = setInterval(async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) return
        
        // Fetch full conversation details instead of just messages to ensure UI consistency
        const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          const newMessages = data.messages || []
          
          // Only update if the message count has changed
          setMessages(prevMessages => {
            if (prevMessages.length !== newMessages.length) {
              return newMessages
            }
            return prevMessages
          })
          
          // Also update conversation state if needed (but don't trigger loading state)
          setConversation(prevConversation => {
            if (!prevConversation || prevConversation.status !== data.status) {
              return data
            }
            return prevConversation
          })
          
          // Update time remaining for active sessions without triggering loading
          if (data.status === "in_progress" && data.started_at) {
            const startTime = new Date(data.started_at).getTime()
            const now = Date.now()
            const sessionDuration = data.duration_minutes * 60
            const timeElapsed = Math.floor((now - startTime) / 1000)
            const remaining = Math.max(0, sessionDuration - timeElapsed)
            setTimeRemaining(remaining)
            setIsActive(remaining > 0)
          }
        }
      } catch (error) {
        console.error("Error polling conversation:", error)
      }
    }, 5000) // Increased to 5 seconds to reduce server load

    return () => clearInterval(pollInterval)
  }, [sessionStarted, resolvedParams.sessionId])

  // Helper function to refresh messages
  const refreshMessages = async () => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) return
      
      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error("Error refreshing messages:", error)
    }
  }

  const fetchConversationDetails = async () => {
    try {
      setLoading(true)
      const session = authClient.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }

      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch conversation details")
      }

      const data = await response.json()
      setConversation(data)
      setMessages(data.messages || [])
      
      if (data.status === "in_progress" && data.started_at) {
        const startTime = new Date(data.started_at).getTime()
        const now = Date.now()
        const sessionDuration = data.duration_minutes * 60
        const timeElapsed = Math.floor((now - startTime) / 1000)
        const remaining = Math.max(0, sessionDuration - timeElapsed)
        
        setTimeRemaining(remaining)
        setIsActive(remaining > 0)
        setSessionStarted(true)
      } else if (data.status === "in_progress") {
        setTimeRemaining(data.duration_minutes * 60)
        setIsActive(true)
        setSessionStarted(true)
      } else {
        setTimeRemaining(data.duration_minutes * 60)
        setIsActive(false)
        setSessionStarted(data.status === "in_progress")
      }
      
      const userRole = session.user.role
      if (userRole !== role) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this conversation.",
          variant: "destructive",
        })
        router.push("/premium-conversations")
        return
      }

    } catch (error) {
      console.error("Error fetching conversation:", error)
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive",
      })
      router.push("/premium-conversations")
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }
      
      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        setSessionStarted(true)
        setIsActive(true)
        toast({
          title: "Session Started",
          description: "Your premium conversation has begun!",
        })
        // Don't immediately fetch conversation details to avoid restart loop
        // The polling will pick up the status change
      }
    } catch (error) {
      console.error("Error starting session:", error)
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      })
    }
  }

  const handleSessionEnd = async () => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }
      
      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        setIsActive(false)
        setSessionStarted(false)
        if (role === "candidate") {
          setShowRating(true)
        }
        toast({
          title: "Session Ended",
          description: "Your premium conversation has ended.",
        })
      }
    } catch (error) {
      console.error("Error ending session:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !isActive) return

    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }
      
      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: message,
          attachments: uploadedFile ? [uploadedFile.name] : [],
        }),
      })

      if (response.ok) {
        setMessage("")
        setUploadedFile(null)
        toast({
          title: "Message sent",
          description: "Your message has been delivered.",
        })
        // Small delay to ensure backend has processed the message
        setTimeout(async () => {
          await refreshMessages()
        }, 500)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }
      setUploadedFile(file)
    }
  }

  const extendSession = async () => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }
      
      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}/extend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",  
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          additional_minutes: 15,
        }),
      })

      if (response.ok) {
        setTimeRemaining(prev => prev + 15 * 60)
        setSessionExtended(true)
        toast({
          title: "Session Extended",
          description: "Added 15 minutes to your session.",
        })
      }
    } catch (error) {
      console.error("Error extending session:", error)
      toast({
        title: "Error",
        description: "Failed to extend session",
        variant: "destructive",
      })
    }
  }

  const submitRating = async () => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        router.push("/auth/login")
        return
      }
      
      const response = await fetch(`http://localhost:8000/conversations/${resolvedParams.sessionId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          rating,
          comment: ratingComment,
        }),
      })

      if (response.ok) {
        setShowRating(false)
        toast({
          title: "Thank you!",
          description: "Your rating has been submitted.",
        })
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      toast({
        title: "Error",
        description: "Failed to submit rating",
        variant: "destructive",
      })
    }
  }

  const startVideoCall = () => {
    setShowVideoCallRoom(true)
    toast({
      title: "Preparing Video Call",
      description: "Setting up your camera and microphone...",
    })
  }

  const joinVideoCall = () => {
    setShowVideoCallRoom(false)
    setIsVideoCallActive(true)
    toast({
      title: "Joining Video Call",
      description: "Connecting to the video conversation...",
    })
  }

  const leaveVideoCallRoom = () => {
    setShowVideoCallRoom(false)
    toast({
      title: "Cancelled",
      description: "Video call setup cancelled",
    })
  }

  const endVideoCall = () => {
    setIsVideoCallActive(false)
    toast({
      title: "Video Call Ended",
      description: "You have left the video call",
    })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "in_progress":
        return <MessageCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "accepted":
        return "bg-blue-500"
      case "in_progress":
        return "bg-green-500"
      case "completed":
        return "bg-gray-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCurrentUserAvatar = () => {
    if (role === "candidate") {
      return conversation?.candidate?.avatar_url || "/placeholder.svg"
    } else {
      return conversation?.employee?.avatar_url || "/placeholder.svg"
    }
  }

  const getCurrentUserInitials = () => {
    if (role === "candidate" && conversation?.candidate) {
      return `${conversation.candidate.first_name[0]}${conversation.candidate.last_name[0]}`
    } else if (role === "employee" && conversation?.employee) {
      return `${conversation.employee.first_name[0]}${conversation.employee.last_name[0]}`
    }
    return "U"
  }

  if (loading) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading conversation...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!conversation) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Conversation Not Found</h2>
            <p className="text-muted-foreground">The requested conversation could not be found.</p>
            <Button className="mt-4" onClick={() => router.push("/premium-conversations")}>
              Back to Conversations
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Safeguard to ensure conversation data is properly structured
  if (!conversation.employee || !conversation.candidate) {
    return (
      <DashboardLayout role={role}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Loading Conversation...</h2>
            <p className="text-muted-foreground">Please wait while we load the conversation details.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const otherParty = role === "candidate" ? conversation.employee : conversation.candidate
  const otherPartyName = `${otherParty.first_name} ${otherParty.last_name}`
  const otherPartyInitials = `${otherParty.first_name[0]}${otherParty.last_name[0]}`

  return (
    <DashboardLayout role={role}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Premium Conversation</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              {getStatusIcon(conversation.status)}
              {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1).replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Session #{resolvedParams.sessionId} • {conversation.topic}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherParty.avatar_url || "/placeholder.svg"} alt={otherPartyName} />
                    <AvatarFallback>{otherPartyInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{otherPartyName}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      {role === "candidate" ? (
                        <>
                          {conversation.employee.expertise.slice(0, 2).join(", ")}
                      <Star className="h-3 w-3 fill-primary text-primary" />
                          <span>{conversation.employee.rating}</span>
                        </>
                      ) : (
                        <span>Candidate</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {sessionStarted && (
                  <Badge
                    variant={timeRemaining > 300 ? "outline" : timeRemaining > 0 ? "destructive" : "secondary"}
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(timeRemaining)}
                  </Badge>
                  )}
                  <Button variant="ghost" size="icon" disabled={!isActive}>
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={!isActive}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-y-auto p-4">
                {!sessionStarted && conversation.status === "accepted" && role === "employee" && (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Start</h3>
                    <p className="text-muted-foreground mb-4">
                      Click the button below to begin your premium conversation with {conversation.candidate.first_name}.
                    </p>
                    <Button onClick={handleStartSession}>
                      Start Session
                    </Button>
                  </div>
                )}
                
                {!sessionStarted && conversation.status === "accepted" && role === "candidate" && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Waiting for Employee</h3>
                    <p className="text-muted-foreground">
                      {otherPartyName} will start the session shortly. You'll be notified when it begins.
                    </p>
                  </div>
                )}

                {(sessionStarted || messages.length > 0) && conversation && (
                <div className="space-y-4">
                    {messages.map((msg) => {
                      // Debug logging
                      console.log("Rendering message:", {
                        id: msg.id,
                        sender_role: msg.sender_role,
                        current_role: role,
                        content: msg.content,
                        timestamp: msg.timestamp
                      })
                      
                      const isCurrentUser = (role === "candidate" && msg.sender_role === "candidate") || 
                                          (role === "employee" && msg.sender_role === "employee")
                      
                      let senderAvatar = "/placeholder.svg"
                      let senderInitials = "U"
                      
                      if (isCurrentUser) {
                        senderAvatar = getCurrentUserAvatar()
                        senderInitials = getCurrentUserInitials()
                      } else {
                        senderAvatar = otherParty.avatar_url || "/placeholder.svg"
                        senderInitials = otherPartyInitials
                      }
                      
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isCurrentUser ? "justify-end" : ""}`}>
                          {!isCurrentUser && (
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={senderAvatar} alt={isCurrentUser ? "You" : otherPartyName} />
                              <AvatarFallback>{senderInitials}</AvatarFallback>
                          </Avatar>
                          )}
                          <div className={`rounded-md px-4 py-2 text-sm max-w-[80%] ${
                            isCurrentUser 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            {msg.content}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.attachments.map((attachment, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-background/20 rounded">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-xs">{attachment}</span>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-3 w-3" />
                                    </Button>
                            </div>
                                ))}
                          </div>
                            )}
                            <div className={`mt-1 text-xs ${
                              isCurrentUser 
                                ? "text-primary-foreground/80" 
                                : "text-muted-foreground"
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          {isCurrentUser && (
                          <Avatar className="h-8 w-8">
                              <AvatarImage src={senderAvatar} alt="You" />
                              <AvatarFallback>{senderInitials}</AvatarFallback>
                          </Avatar>
                      )}
                    </div>
                      )
                    })}
                  <div ref={messagesEndRef} />
                </div>
                )}
              </CardContent>
              <Separator />
              <CardFooter className="p-3">
                <div className="flex w-full items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!isActive}
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 space-y-2">
                    {uploadedFile && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                        <FileText className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedFile(null)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  <Input
                      placeholder={isActive ? "Type your message..." : "Session not active"}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    disabled={!isActive}
                  />
                  </div>
                  <Button onClick={handleSendMessage} disabled={!message.trim() || !isActive}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Duration</p>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-muted-foreground" />
                    <span>{conversation.duration_minutes} minutes</span>
                  </div>
                </div>
                {sessionStarted && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Time Remaining</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={`font-mono ${timeRemaining <= 300 ? "text-red-500" : ""}`}>
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cost</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${conversation.total_cost}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Scheduled</p>
                  <span className="text-sm">
                    {conversation.scheduled_datetime ? 
                      new Date(conversation.scheduled_datetime).toLocaleString() : 
                      "Not scheduled"
                    }
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant={conversation.status === "in_progress" ? "default" : "secondary"}>
                    {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={!isActive}
                  onClick={startVideoCall}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Start Video Call
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={extendSession}
                  disabled={!isActive || sessionExtended}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {sessionExtended ? "Extended (+15 min)" : "Extend Session (+15 min)"}
                </Button>

                {role === "employee" && isActive && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleSessionEnd}
                  >
                    End Session
                  </Button>
                )}
              </CardContent>
            </Card>

            {role === "candidate" && conversation.employee && (
              <Card>
                <CardHeader>
                  <CardTitle>Employee Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.employee.avatar_url || "/placeholder.svg"} alt={otherPartyName} />
                      <AvatarFallback>{otherPartyInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{otherPartyName}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-sm">{conversation.employee.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {conversation.employee.expertise.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {conversation.employee.bio && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Bio</p>
                      <p className="text-sm text-muted-foreground">{conversation.employee.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Session</DialogTitle>
            <DialogDescription>
              How was your premium conversation with {otherPartyName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comment (Optional)</label>
              <Textarea
                placeholder="Share your feedback..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRating(false)}>
              Skip
            </Button>
            <Button onClick={submitRating} disabled={rating === 0}>
              Submit Rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showVideoCallRoom && (
        <VideoCallRoom
          conversationId={resolvedParams.sessionId}
          participantName={otherPartyName}
          participantAvatar={otherParty.avatar_url}
          userRole={role}
          onJoinCall={joinVideoCall}
          onLeaveRoom={leaveVideoCallRoom}
          sessionTimeRemaining={timeRemaining}
        />
      )}

      <VideoCallInterface
        conversationId={resolvedParams.sessionId}
        participantName={otherPartyName}
        userRole={role}
        onEndCall={endVideoCall}
        onStartCall={() => setIsVideoCallActive(true)}
        isCallActive={isVideoCallActive}
        currentUserName={role === "candidate" ? 
          `${conversation.candidate.first_name} ${conversation.candidate.last_name}` :
          `${conversation.employee.first_name} ${conversation.employee.last_name}`
        }
      />
    </DashboardLayout>
  )
}
