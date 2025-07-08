"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, MessageSquare, Star, Search, Filter } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Employee {
  id: number
  name?: string
  first_name: string
  last_name: string
  email: string
  rating: number
  expertise: string[]
  bio: string
  avatar_url?: string
  position?: string
  company?: string
}

interface Conversation {
  id: number
  candidate_id: number
  employee_id: number
  status: string
  scheduled_time: string
  duration_minutes: number
  hourly_rate: number
  total_amount: number
  topic: string
  candidate_message: string | null
  employee_response: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  ended_at: string | null
  payment_status: string
  payment_intent_id: string | null
  rating: number | null
  feedback: string | null
  employee?: Employee
  messages?: Array<{
    id: number
    sender_id: number
    sender_role: string
    content: string
    timestamp: string
  }>
}

export default function ConversationHistoryPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true)
        const session = authClient.getSession()
        if (!session?.access_token) {
          router.push('/auth/login')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          // Filter only completed conversations
          const completedConversations = data.filter((conv: Conversation) => conv.status === 'completed')
          setConversations(completedConversations)
        } else {
          toast.error('Failed to fetch conversations')
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
        toast.error('Failed to load conversation history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchConversations()
  }, [router])

  const filteredConversations = conversations.filter((conv) => {
    const employeeName = conv.employee ? `${conv.employee.first_name} ${conv.employee.last_name}` : ''
    const employeePosition = conv.employee?.position || ''
    const employeeCompany = conv.employee?.company || ''
    
    const matchesSearch =
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeePosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employeeCompany.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "completed" && conv.status === "completed") ||
      (filterStatus === "extended" && conv.duration_minutes > 30) ||
      (filterStatus === "ended_early" && conv.started_at && conv.ended_at && 
        (new Date(conv.ended_at).getTime() - new Date(conv.started_at).getTime()) / 60000 < conv.duration_minutes)

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "extended":
        return "secondary"
      case "ended_early":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusText = (conversation: Conversation) => {
    if (conversation.status === "completed") {
      if (conversation.started_at && conversation.ended_at) {
        const actualDuration = (new Date(conversation.ended_at).getTime() - new Date(conversation.started_at).getTime()) / 60000
        if (actualDuration > conversation.duration_minutes * 1.1) {
          return "Extended"
        } else if (actualDuration < conversation.duration_minutes * 0.9) {
          return "Ended Early"
        }
      }
      return "Completed"
    }
    return conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1).replace('_', ' ')
  }

  const getConversationStatus = (conversation: Conversation) => {
    if (conversation.status === "completed") {
      if (conversation.started_at && conversation.ended_at) {
        const actualDuration = (new Date(conversation.ended_at).getTime() - new Date(conversation.started_at).getTime()) / 60000
        if (actualDuration > conversation.duration_minutes * 1.1) {
          return "extended"
        } else if (actualDuration < conversation.duration_minutes * 0.9) {
          return "ended_early"
        }
      }
      return "completed"
    }
    return conversation.status
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get the last message from the conversation
  const getLastMessage = (conversation: Conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return "No messages in this conversation."
    }
    
    // Sort messages by timestamp and get the last one
    const sortedMessages = [...conversation.messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    return sortedMessages[sortedMessages.length - 1].content
  }

  // Calculate actual duration if the session has started and ended
  const getActualDuration = (conversation: Conversation) => {
    if (conversation.started_at && conversation.ended_at) {
      const start = new Date(conversation.started_at).getTime()
      const end = new Date(conversation.ended_at).getTime()
      return Math.round((end - start) / (1000 * 60)) // Duration in minutes
    }
    return conversation.duration_minutes
  }

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Conversation History</h1>
          <p className="text-muted-foreground">Review your past premium conversations with employees</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee, position, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conversations</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="extended">Extended</SelectItem>
                  <SelectItem value="ended_early">Ended Early</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conversation List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading conversations...</p>
              </CardContent>
            </Card>
          ) : filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 font-medium">No conversations found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't had any completed premium conversations yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => {
              // Handle employee name correctly based on available fields
              let employeeName = 'Unknown Employee';
              if (conversation.employee) {
                if (conversation.employee.name) {
                  // If name field exists, use it
                  employeeName = conversation.employee.name;
                } else if (conversation.employee.first_name || conversation.employee.last_name) {
                  // Otherwise try to construct from first_name and last_name
                  employeeName = `${conversation.employee.first_name || ''} ${conversation.employee.last_name || ''}`.trim();
                }
              }
              
              // Safely handle employee initials
              let employeeInitials = 'UE';
              if (conversation.employee) {
                if (conversation.employee.name && conversation.employee.name.includes(' ')) {
                  // Get initials from name field if it has a space
                  const nameParts = conversation.employee.name.split(' ');
                  employeeInitials = `${nameParts[0][0] || ''}${nameParts[1][0] || ''}`.toUpperCase();
                } else if (conversation.employee.first_name && conversation.employee.last_name) {
                  // Otherwise try to construct from first_name and last_name
                  employeeInitials = `${conversation.employee.first_name[0] || ''}${conversation.employee.last_name[0] || ''}`.toUpperCase();
                } else if (conversation.employee.name) {
                  // If only name exists and no space, use first two letters
                  employeeInitials = conversation.employee.name.substring(0, 2).toUpperCase();
                }
                
                if (!employeeInitials) employeeInitials = 'UE';
              }
              
              const conversationStatus = getConversationStatus(conversation)
              
              return (
                <Card key={conversation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={conversation.employee?.avatar_url || "/placeholder.svg"}
                            alt={employeeName}
                          />
                          <AvatarFallback>{employeeInitials}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{employeeName}</h3>
                            {conversation.employee?.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-primary text-primary" />
                                <span className="text-sm font-medium">{conversation.employee.rating}</span>
                              </div>
                            )}
                          </div>

                          {(conversation.employee?.position || conversation.employee?.company) && (
                            <div className="text-sm text-muted-foreground">
                              {conversation.employee?.position || ''} 
                              {conversation.employee?.position && conversation.employee?.company && ' at '} 
                              {conversation.employee?.company || ''}
                            </div>
                          )}

                          <div className="text-sm">
                            <span className="font-medium">Topic:</span> {conversation.topic}
                          </div>

                          {conversation.messages && conversation.messages.length > 0 && (
                            <div className="text-sm text-muted-foreground italic line-clamp-2">
                              "{getLastMessage(conversation)}"
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {getActualDuration(conversation)} minutes
                            </div>
                            <span>{formatDateTime(conversation.started_at || conversation.scheduled_time)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusColor(conversationStatus)}>
                          {getStatusText(conversation)}
                        </Badge>

                        {conversation.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">Your rating:</span>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= conversation.rating! ? "fill-primary text-primary" : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        <Link href={`/premium-conversations/history/${conversation.id}`}>
                          <Button variant="outline" size="sm">
                            View Conversation
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Summary Stats */}
        {!isLoading && conversations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Conversation Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{conversations.length}</div>
                  <div className="text-sm text-muted-foreground">Total Conversations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.round(conversations.reduce((sum, conv) => sum + getActualDuration(conv), 0) / conversations.length)}m
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {conversations.filter((conv) => conv.rating).length > 0
                      ? (
                          conversations.filter((conv) => conv.rating).reduce((sum, conv) => sum + (conv.rating || 0), 0) /
                          conversations.filter((conv) => conv.rating).length
                        ).toFixed(1)
                      : "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Rating Given</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${conversations.reduce((sum, conv) => sum + conv.total_amount, 0).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
