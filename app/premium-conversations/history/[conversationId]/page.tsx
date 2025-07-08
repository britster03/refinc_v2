"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CalendarClock, Clock, DollarSign, Download, FileText, MessageCircle, Star } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth"
import { use } from "react"
import Link from "next/link"

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
    name?: string
  }
  candidate: {
    id: number
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
    name?: string
  }
  messages: Message[]
}

export default function ConversationHistoryDetail({ params }: { params: Promise<{ conversationId: string }> }) {
  // Unwrap the params Promise
  const resolvedParams = use(params)
  const conversationId = resolvedParams.conversationId
  
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversation, setConversation] = useState<ConversationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<"candidate" | "employee" | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) {
          router.push('/auth/login')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUserRole(userData.role)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        toast.error('Failed to verify user authentication')
      }
    }

    checkUserRole()
  }, [router])

  useEffect(() => {
    const fetchConversationDetails = async () => {
      if (!userRole) return

      try {
        setIsLoading(true)
        const session = authClient.getSession()
        if (!session?.access_token) {
          router.push("/auth/login")
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/${conversationId}`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          toast.error("Failed to load conversation details")
          return
        }

        const data = await response.json()
        setConversation(data)
        setMessages(data.messages || [])
      } catch (error) {
        console.error("Error fetching conversation details:", error)
        toast.error("Failed to load conversation details")
      } finally {
        setIsLoading(false)
      }
    }

    if (userRole) {
      fetchConversationDetails()
    }
  }, [conversationId, router, userRole])

  useEffect(() => {
    // Scroll to bottom of messages when they change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (isLoading) {
    return (
      <DashboardLayout role={userRole || "candidate"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading conversation history...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!conversation) {
    return (
      <DashboardLayout role={userRole || "candidate"}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Conversation Not Found</h2>
          <p className="text-muted-foreground mb-4">This conversation may have been deleted or you don't have access to it.</p>
          <Link href="/premium-conversations/history">
            <Button>
              Back to History
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return `${conversation.duration_minutes} minutes (scheduled)`
    
    const start = new Date(startTime).getTime()
    const end = new Date(endTime).getTime()
    const durationMs = end - start
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    
    return `${durationMinutes} minutes (actual)`
  }

  // Safely handle party information
  const otherParty = userRole === "candidate" ? conversation.employee : conversation.candidate
  
  // Safely handle party names
  let otherPartyName = "Unknown";
  if (userRole === "candidate" && conversation.employee) {
    if (conversation.employee.name) {
      // If name field exists, use it
      otherPartyName = conversation.employee.name;
    } else if (conversation.employee.first_name || conversation.employee.last_name) {
      // Otherwise try to construct from first_name and last_name
      const firstName = conversation.employee.first_name || '';
      const lastName = conversation.employee.last_name || '';
      otherPartyName = `${firstName} ${lastName}`.trim() || "Unknown Employee";
    } else {
      otherPartyName = "Unknown Employee";
    }
  } else if (userRole === "employee" && conversation.candidate) {
    if (conversation.candidate.name) {
      // If name field exists, use it
      otherPartyName = conversation.candidate.name;
    } else if (conversation.candidate.first_name || conversation.candidate.last_name) {
      // Otherwise try to construct from first_name and last_name
      const firstName = conversation.candidate.first_name || '';
      const lastName = conversation.candidate.last_name || '';
      otherPartyName = `${firstName} ${lastName}`.trim() || "Unknown Candidate";
    } else {
      otherPartyName = "Unknown Candidate";
    }
  }
  
  // Safely handle initials
  let otherPartyInitials = "??";
  if (userRole === "candidate" && conversation.employee) {
    if (conversation.employee.name && conversation.employee.name.includes(' ')) {
      // Get initials from name field if it has a space
      const nameParts = conversation.employee.name.split(' ');
      otherPartyInitials = `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase();
    } else if (conversation.employee.first_name && conversation.employee.last_name) {
      // Otherwise try to construct from first_name and last_name
      const firstInitial = conversation.employee.first_name ? conversation.employee.first_name[0] : '';
      const lastInitial = conversation.employee.last_name ? conversation.employee.last_name[0] : '';
      otherPartyInitials = `${firstInitial}${lastInitial}`.trim() || "??";
    } else if (conversation.employee.name) {
      // If only name exists and no space, use first two letters
      otherPartyInitials = conversation.employee.name.substring(0, 2).toUpperCase();
    }
  } else if (userRole === "employee" && conversation.candidate) {
    if (conversation.candidate.name && conversation.candidate.name.includes(' ')) {
      // Get initials from name field if it has a space
      const nameParts = conversation.candidate.name.split(' ');
      otherPartyInitials = `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase();
    } else if (conversation.candidate.first_name && conversation.candidate.last_name) {
      // Otherwise try to construct from first_name and last_name
      const firstInitial = conversation.candidate.first_name ? conversation.candidate.first_name[0] : '';
      const lastInitial = conversation.candidate.last_name ? conversation.candidate.last_name[0] : '';
      otherPartyInitials = `${firstInitial}${lastInitial}`.trim() || "??";
    } else if (conversation.candidate.name) {
      // If only name exists and no space, use first two letters
      otherPartyInitials = conversation.candidate.name.substring(0, 2).toUpperCase();
    }
  }

  const getCurrentUserAvatar = () => {
    if (userRole === "candidate") {
      return conversation.candidate && conversation.candidate.avatar_url ? conversation.candidate.avatar_url : "/placeholder.svg";
    } else {
      return conversation.employee && conversation.employee.avatar_url ? conversation.employee.avatar_url : "/placeholder.svg";
    }
  }

  const getCurrentUserInitials = () => {
    if (userRole === "candidate" && conversation.candidate) {
      if (conversation.candidate.name && conversation.candidate.name.includes(' ')) {
        // Get initials from name field if it has a space
        const nameParts = conversation.candidate.name.split(' ');
        return `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase();
      } else if (conversation.candidate.first_name && conversation.candidate.last_name) {
        // Otherwise try to construct from first_name and last_name
        const firstInitial = conversation.candidate.first_name ? conversation.candidate.first_name[0] : '';
        const lastInitial = conversation.candidate.last_name ? conversation.candidate.last_name[0] : '';
        return `${firstInitial}${lastInitial}`.trim() || "??";
      } else if (conversation.candidate.name) {
        // If only name exists and no space, use first two letters
        return conversation.candidate.name.substring(0, 2).toUpperCase();
      }
    } else if (userRole === "employee" && conversation.employee) {
      if (conversation.employee.name && conversation.employee.name.includes(' ')) {
        // Get initials from name field if it has a space
        const nameParts = conversation.employee.name.split(' ');
        return `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase();
      } else if (conversation.employee.first_name && conversation.employee.last_name) {
        // Otherwise try to construct from first_name and last_name
        const firstInitial = conversation.employee.first_name ? conversation.employee.first_name[0] : '';
        const lastInitial = conversation.employee.last_name ? conversation.employee.last_name[0] : '';
        return `${firstInitial}${lastInitial}`.trim() || "??";
      } else if (conversation.employee.name) {
        // If only name exists and no space, use first two letters
        return conversation.employee.name.substring(0, 2).toUpperCase();
      }
    }
    return "??";
  }

  return (
    <DashboardLayout role={userRole || "candidate"}>
      <div className="space-y-6">
        <div>
          <Link href="/premium-conversations/history">
            <Button
              variant="outline"
              className="mb-4"
            >
              Back to History
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{conversation.topic}</h1>
          <p className="text-muted-foreground">
            Conversation with {otherPartyName} • {formatDateTime(conversation.scheduled_datetime)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={otherParty.avatar_url || "/placeholder.svg"} alt={otherPartyName} />
                    <AvatarFallback>{otherPartyInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{otherPartyName}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      {userRole === "candidate" && (
                        <>
                          {conversation.employee.expertise.slice(0, 2).join(", ")}
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span>{conversation.employee.rating}</span>
                        </>
                      )}
                      {userRole === "employee" && (
                        <span>Candidate</span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline">
                  Completed
                </Badge>
              </CardHeader>
              <Separator />
              <CardContent className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No messages</h3>
                    <p className="text-muted-foreground">
                      This conversation doesn't have any messages.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isCurrentUser = (userRole === "candidate" && msg.sender_role === "candidate") || 
                                          (userRole === "employee" && msg.sender_role === "employee")
                      
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
                    <span>{formatDuration(conversation.started_at, conversation.ended_at)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Session Date</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDateTime(conversation.started_at || conversation.scheduled_datetime)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cost</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>${conversation.total_cost}</span>
                  </div>
                </div>
                {userRole === "candidate" && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Employee Expertise</p>
                    <div className="flex flex-wrap gap-1">
                      {conversation.employee.expertise.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
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