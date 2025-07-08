"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Clock, DollarSign, MessageSquare, Calendar, Star, Video, Settings, 
  TrendingUp, Users, CheckCircle2, XCircle, AlertCircle, Plus, Trash2,
  BarChart3, Timer, Award
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth"

interface EmployeeSettings {
  is_available: boolean
  hourly_rate: number
  expertise: string[]
  bio: string
  availability: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    timezone: string
  }>
  auto_accept_requests: boolean
  max_daily_sessions: number
  response_time_hours: number
  position?: string
  company?: string
  department?: string
  experience_years?: number
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
  rating: number | null
  feedback: string | null
  candidate?: {
    id: number
    name: string
    email: string
    avatar_url: string | null
  }
}

interface Analytics {
  total_earnings: number
  total_sessions: number
  average_rating: number
  pending_requests: number
  monthly_earnings: Array<{
    month: string
    earnings: number
    sessions: number
  }>
  rating_distribution: Record<string, number>
  popular_topics: Array<{
  topic: string
    count: number
  }>
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function EmployeePremiumConversationsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [settings, setSettings] = useState<EmployeeSettings>({
    is_available: true,
    hourly_rate: 50,
    expertise: [],
    bio: "",
    availability: [],
    auto_accept_requests: false,
    max_daily_sessions: 8,
    response_time_hours: 24
  })
  const [analytics, setAnalytics] = useState<Analytics>({
    total_earnings: 0,
    total_sessions: 0,
    average_rating: 0,
    pending_requests: 0,
    monthly_earnings: [],
    rating_distribution: {},
    popular_topics: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [employeeResponse, setEmployeeResponse] = useState("")
  const [newExpertise, setNewExpertise] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  // Check user role and redirect candidates
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
          
          if (userData.role === 'candidate') {
            router.push('/premium-conversations')
            return
          }
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        toast.error('Failed to verify user authentication')
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [router])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data)
        }
      } catch (error) {
        console.error('Error fetching conversations:', error)
      }
    }

    if (userRole === 'employee') {
      fetchConversations()
    }
  }, [userRole])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/employee/settings`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    if (userRole === 'employee') {
      fetchSettings()
    }
  }, [userRole])

  // Fetch analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/employee/analytics`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
    }

    if (userRole === 'employee') {
      fetchAnalytics()
    }
  }, [userRole])

  const handleConversationResponse = async (conversationId: number, status: string, response?: string) => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) return

      const updateData: any = { status }
      if (response) {
        updateData.employee_response = response
      }

      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      if (apiResponse.ok) {
        const updatedConversation = await apiResponse.json()
        setConversations(prev => prev.map(c => c.id === conversationId ? updatedConversation : c))
        setShowResponseDialog(false)
        setEmployeeResponse("")
        setSelectedConversation(null)
        toast.success(`Request ${status === 'accepted' ? 'accepted' : 'declined'} successfully`)
      } else {
        toast.error('Failed to update conversation')
      }
    } catch (error) {
      console.error('Error updating conversation:', error)
      toast.error('Failed to update conversation')
    }
  }

  const handleSaveSettings = async () => {
    setIsSavingSettings(true)
    try {
      const session = authClient.getSession()
      if (!session?.access_token) return

      // Update employee settings
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/employee/settings`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        toast.success('Expert profile saved successfully! Your profile is now visible to candidates.')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const addAvailabilitySlot = () => {
    setSettings(prev => ({
      ...prev,
      availability: [...prev.availability, {
        day_of_week: 1,
        start_time: "09:00",
        end_time: "17:00",
        timezone: "UTC"
      }]
    }))
  }

  const removeAvailabilitySlot = (index: number) => {
    setSettings(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }))
  }

  const addExpertise = () => {
    if (newExpertise.trim() && !settings.expertise.includes(newExpertise.trim())) {
      setSettings(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }))
      setNewExpertise("")
    }
  }

  const removeExpertise = (expertise: string) => {
    setSettings(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDateTime = (dateString: string) => {
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

  // Show loading while checking role
  if (isLoading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate stats
  const pendingRequests = conversations.filter(c => c.status === 'pending')
  const upcomingSessions = conversations.filter(c => 
    ['accepted', 'in_progress'].includes(c.status)
  )
  const completedSessions = conversations.filter(c => c.status === 'completed')

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Premium Conversations</h1>
          <p className="text-muted-foreground">
            Manage your premium conversation sessions and help candidates advance their careers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.total_earnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {analytics.total_sessions} completed sessions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your response
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.average_rating > 0 ? analytics.average_rating.toFixed(1) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                From {analytics.total_sessions} sessions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.monthly_earnings[analytics.monthly_earnings.length - 1]?.sessions || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests" className="relative">
              Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center">
                    No pending conversation requests at the moment
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((conversation) => (
                  <Card key={conversation.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                    <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{conversation.topic}</h3>
                              <Badge className={getStatusColor(conversation.status)}>
                                {conversation.status}
                              </Badge>
                        </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                                <span>{formatDateTime(conversation.scheduled_time)}</span>
                      </div>
                              <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                                <span>{conversation.duration_minutes} minutes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>${conversation.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                            {conversation.candidate && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={conversation.candidate.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {conversation.candidate.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{conversation.candidate.name}</span>
                                <span className="text-xs text-muted-foreground">• {conversation.candidate.email}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleConversationResponse(conversation.id, 'declined')}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedConversation(conversation)
                                setShowResponseDialog(true)
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Accept & Respond
                            </Button>
                          </div>
                        </div>
                        {conversation.candidate_message && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium mb-2">Message from candidate:</h4>
                            <p className="text-sm text-muted-foreground">{conversation.candidate_message}</p>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            {upcomingSessions.length === 0 ? (
                <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                  <p className="text-muted-foreground text-center">
                    Your accepted sessions will appear here
                    </p>
                  </CardContent>
                </Card>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((conversation) => (
                <Card key={conversation.id}>
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{conversation.topic}</h3>
                            <Badge className={getStatusColor(conversation.status)}>
                              {conversation.status.replace('_', ' ')}
                            </Badge>
                        </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                              <span>{formatDateTime(conversation.scheduled_time)}</span>
                      </div>
                            <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                              <span>{conversation.duration_minutes} minutes</span>
                      </div>
                            <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4" />
                              <span>${conversation.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                          {conversation.candidate && (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={conversation.candidate.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {conversation.candidate.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{conversation.candidate.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {conversation.status === 'accepted' && (
                            <Button 
                              size="sm"
                              onClick={() => router.push(`/premium-conversations/${conversation.id}?role=employee`)}
                            >
                          <Video className="h-4 w-4 mr-2" />
                          Start Session
                        </Button>
                          )}
                          {conversation.status === 'in_progress' && (
                            <Button 
                              size="sm"
                              onClick={() => router.push(`/premium-conversations/${conversation.id}?role=employee`)}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Resume Session
                      </Button>
                          )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Monthly Earnings Chart */}
            <Card>
                  <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
                <CardDescription>Your earnings over the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.monthly_earnings.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.monthly_earnings.slice(-6).map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <div className="text-sm font-medium">{data.month}</div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-muted-foreground">{data.sessions} sessions</div>
                          <div className="text-sm font-medium">${data.earnings.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                        </div>
                ) : (
                  <p className="text-muted-foreground">No earnings data available yet</p>
                )}
              </CardContent>
            </Card>

            {/* Popular Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
                <CardDescription>Most requested conversation topics</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.popular_topics.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.popular_topics.slice(0, 5).map((topic, index) => (
                      <div key={topic.topic} className="flex items-center justify-between">
                        <div className="text-sm">{topic.topic}</div>
                        <Badge variant="secondary">{topic.count} sessions</Badge>
                      </div>
                    ))}
                    </div>
                ) : (
                  <p className="text-muted-foreground">No topic data available yet</p>
                )}
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of ratings received</CardDescription>
                  </CardHeader>
              <CardContent>
                {Object.keys(analytics.rating_distribution).length > 0 ? (
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{rating}</span>
                    </div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(analytics.rating_distribution[rating.toString()] || 0) / Math.max(...Object.values(analytics.rating_distribution)) * 100}%`
                            }}
                          />
                      </div>
                        <span className="text-sm text-muted-foreground">
                          {analytics.rating_distribution[rating.toString()] || 0}
                        </span>
                      </div>
                    ))}
                    </div>
                ) : (
                  <p className="text-muted-foreground">No rating data available yet</p>
                )}
                  </CardContent>
                </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Availability Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>Manage when you're available for premium conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Available for conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle your availability for new conversation requests
                    </p>
                  </div>
                  <Switch
                    checked={settings.is_available}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, is_available: checked }))}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={settings.hourly_rate}
                      onChange={(e) => setSettings(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) || 0 }))}
                      min="10"
                      max="500"
                    />
                  </div>
                <div className="space-y-2">
                    <Label htmlFor="max_daily_sessions">Max Daily Sessions</Label>
                  <Input
                      id="max_daily_sessions"
                    type="number"
                      value={settings.max_daily_sessions}
                      onChange={(e) => setSettings(prev => ({ ...prev, max_daily_sessions: parseInt(e.target.value) || 1 }))}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.bio}
                    onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell candidates about your experience and what you can help them with..."
                    rows={4}
                  />
                </div>

                {/* Expertise */}
                <div className="space-y-4">
                  <Label>Expertise Areas</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings.expertise.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          onClick={() => removeExpertise(skill)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newExpertise}
                      onChange={(e) => setNewExpertise(e.target.value)}
                      placeholder="Add expertise area..."
                      onKeyPress={(e) => e.key === 'Enter' && addExpertise()}
                    />
                    <Button onClick={addExpertise} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Availability Schedule */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Availability Schedule</Label>
                    <Button onClick={addAvailabilitySlot} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Time Slot
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {settings.availability.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Select
                          value={slot.day_of_week.toString()}
                          onValueChange={(value) => {
                            const newAvailability = [...settings.availability]
                            newAvailability[index].day_of_week = parseInt(value)
                            setSettings(prev => ({ ...prev, availability: newAvailability }))
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day, dayIndex) => (
                              <SelectItem key={dayIndex} value={dayIndex.toString()}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => {
                            const newAvailability = [...settings.availability]
                            newAvailability[index].start_time = e.target.value
                            setSettings(prev => ({ ...prev, availability: newAvailability }))
                          }}
                          className="w-[120px]"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => {
                            const newAvailability = [...settings.availability]
                            newAvailability[index].end_time = e.target.value
                            setSettings(prev => ({ ...prev, availability: newAvailability }))
                          }}
                          className="w-[120px]"
                        />
                        <Button
                          onClick={() => removeAvailabilitySlot(index)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full">
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Response Dialog */}
        <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Accept & Respond to Request</DialogTitle>
              <DialogDescription>
                Send a message to the candidate along with accepting their request
              </DialogDescription>
            </DialogHeader>
            
            {selectedConversation && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Session Details:</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Topic:</strong> {selectedConversation.topic}</p>
                    <p><strong>Duration:</strong> {selectedConversation.duration_minutes} minutes</p>
                    <p><strong>Amount:</strong> ${selectedConversation.total_amount.toFixed(2)}</p>
                    <p><strong>Scheduled:</strong> {formatDateTime(selectedConversation.scheduled_time)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="response">Your response (optional)</Label>
                  <Textarea
                    id="response"
                    value={employeeResponse}
                    onChange={(e) => setEmployeeResponse(e.target.value)}
                    placeholder="Let the candidate know what to expect and how to prepare for the session..."
                    rows={4}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowResponseDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleConversationResponse(selectedConversation.id, 'accepted', employeeResponse)}
                  >
                    Accept Request
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
} 