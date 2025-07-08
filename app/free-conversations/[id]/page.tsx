"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Send, MessageSquare, Crown, Loader2, AlertCircle } from "lucide-react"
import { freeConversationsAPI, FreeConversation, FreeConversationMessage } from "@/lib/api/free-conversations"
import { authClient } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"
import { use } from "react"

interface FreeConversationPageProps {
  params: Promise<{ id: string }>
}

export default function FreeConversationPage({ params }: FreeConversationPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [conversation, setConversation] = useState<FreeConversation | null>(null)
  const [messages, setMessages] = useState<FreeConversationMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
    initializePage()
  }, [resolvedParams.id])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversation || conversation.status !== 'active') return

    const interval = setInterval(() => {
      fetchMessages()
    }, 3000)

    return () => clearInterval(interval)
  }, [conversation])

  const initializePage = async () => {
    try {
      setLoading(true)
      
      // Check authentication
      const user = await authClient.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setCurrentUserId(user.id)
      setCurrentUserRole(user.role)

      // Fetch conversation details
      await fetchConversation()
      await fetchMessages()

    } catch (error: any) {
      console.error("Failed to initialize page:", error)
      toast.error("Error", {
        description: "Failed to load conversation."
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchConversation = async () => {
    try {
      const conversationData = await freeConversationsAPI.getFreeConversation(parseInt(resolvedParams.id))
      setConversation(conversationData)
    } catch (error: any) {
      console.error("Failed to fetch conversation:", error)
      throw error
    }
  }

  const fetchMessages = async () => {
    try {
      const messagesData = await freeConversationsAPI.getMessages(parseInt(resolvedParams.id))
      setMessages(messagesData)
    } catch (error: any) {
      console.error("Failed to fetch messages:", error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return

    try {
      setSending(true)
      
              await freeConversationsAPI.sendMessage(parseInt(resolvedParams.id), {
        content: message.trim(),
        message_type: 'text'
      })

      setMessage("")
      
      // Refresh conversation and messages
      await fetchConversation()
      await fetchMessages()

    } catch (error: any) {
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        toast.error("Message Limit Reached", {
          description: "You've reached your message limit. Upgrade to premium to continue."
        })
        
        // Refresh conversation to update status
        await fetchConversation()
      } else {
        toast.error("Error", {
          description: "Failed to send message. Please try again."
        })
      }
    } finally {
      setSending(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'upgrade_required':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'upgrade_required':
        return 'Upgrade Required'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  const isCurrentUser = (senderId: number) => {
    return senderId === currentUserId
  }

  const getOtherParty = () => {
    if (!conversation || !currentUserId) return null
    
    if (currentUserRole === 'candidate') {
      return conversation.employee
    } else {
      return conversation.candidate
    }
  }

  if (loading) {
    return (
      <DashboardLayout role={currentUserRole as any || "candidate"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!conversation) {
    return (
      <DashboardLayout role={currentUserRole as any || "candidate"}>
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
                <h3 className="text-lg font-semibold">Conversation Not Found</h3>
                <p className="text-muted-foreground">
                  The conversation you're looking for doesn't exist or you don't have access to it.
                </p>
                <Link href="/referrals">
                  <Button>Return to Referrals</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  const otherParty = getOtherParty()
  const userMessageCount = currentUserRole === 'candidate' ? conversation.candidate_message_count : conversation.employee_message_count
  const userMessagesLeft = conversation.max_messages_per_user - userMessageCount
  const otherUserMessageCount = currentUserRole === 'candidate' ? conversation.employee_message_count : conversation.candidate_message_count

  return (
    <DashboardLayout role={currentUserRole as any}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <Link href="/referrals">
            <Button variant="ghost" size="sm" className="w-fit">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Referrals
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Free Conversation</h1>
              <p className="text-muted-foreground">
                Discussion about rejected referral
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(conversation.status)}>
                {conversation.status === 'upgrade_required' && currentUserRole === 'employee' 
                  ? 'Waiting for Upgrade' 
                  : getStatusLabel(conversation.status)
                }
              </Badge>
              {conversation.status === 'active' && (
                <Badge variant="outline">
                  {userMessagesLeft} messages left
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Info */}
        {otherParty && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={otherParty.avatar_url || "/placeholder.svg"} alt={otherParty.name || "User"} />
                  <AvatarFallback>
                    {otherParty.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{otherParty.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentUserRole === 'candidate' ? 'Employee' : 'Candidate'}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Message Limit Warning - CANDIDATE ONLY */}
        {currentUserRole === 'candidate' && conversation.status === 'active' && userMessagesLeft <= 3 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> You have {userMessagesLeft} message{userMessagesLeft !== 1 ? 's' : ''} remaining. 
              Consider upgrading to premium for unlimited messaging.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade Required - CANDIDATE ONLY */}
        {currentUserRole === 'candidate' && conversation.status === 'upgrade_required' && (
          <Alert>
            <Crown className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Message limit reached.</strong> Upgrade to premium to continue this conversation.
              </span>
              <Link href={`/premium-conversations?employee_id=${conversation.employee_id}&from=free_conversation&conversation_id=${conversation.id}`}>
                <Button size="sm" className="ml-3">
                  <Crown className="mr-2 h-3 w-3" />
                  Upgrade Now
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Employee Info - EMPLOYEE ONLY */}
        {currentUserRole === 'employee' && conversation.status === 'upgrade_required' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Conversation paused.</strong> The candidate has reached their free message limit. 
              They need to upgrade to premium to continue this conversation.
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg">Messages</CardTitle>
            <CardDescription>
              Free conversation: {conversation.max_messages_per_user} messages per person
              • You: {userMessageCount}/{conversation.max_messages_per_user}
              • {currentUserRole === 'candidate' ? 'Employee' : 'Candidate'}: {otherUserMessageCount}/{conversation.max_messages_per_user}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 min-h-[400px] max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${isCurrentUser(msg.sender_id) ? 'justify-end' : ''}`}>
                  {!isCurrentUser(msg.sender_id) && otherParty && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={otherParty.avatar_url || "/placeholder.svg"} alt={otherParty.name || "User"} />
                      <AvatarFallback>
                        {otherParty.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`rounded-lg p-3 max-w-[70%] ${
                    isCurrentUser(msg.sender_id)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      isCurrentUser(msg.sender_id)
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>

                  {isCurrentUser(msg.sender_id) && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>You</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          
          {conversation.status === 'active' && (
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sending}
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>
                  {userMessagesLeft} message{userMessagesLeft !== 1 ? 's' : ''} remaining
                </span>
                {currentUserRole === 'candidate' && (
                  <Link href={`/premium-conversations?employee_id=${conversation.employee_id}&from=free_conversation&conversation_id=${conversation.id}`} className="text-primary hover:underline">
                    Upgrade to premium
                  </Link>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
} 