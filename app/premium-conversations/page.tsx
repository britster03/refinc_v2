"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CalendarIcon, Clock, DollarSign, MessageSquare, Star, Video, Search, Filter, CheckCircle2, AlertCircle, Calendar, CreditCard, Crown } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth"
import { StripePayment } from "@/components/payments/stripe-integration"

interface Employee {
  id: number
  name: string
  position: string
  company: string
  department: string
  avatar_url: string | null
  rating: number
  total_sessions: number
  response_time: string
  hourly_rate: number
  expertise: string[]
  availability: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    timezone: string
  }>
  is_available: boolean
  bio: string | null
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
}

interface BookingFormData {
  employee_id: number
  topic: string
  candidate_message: string
  duration_minutes: number
  scheduled_time: string
  coupon_code?: string
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function PremiumConversationsPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterExpertise, setFilterExpertise] = useState("all")
  const [filterMinRating, setFilterMinRating] = useState<number | null>(null)
  const [filterMaxRate, setFilterMaxRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [freeConversations, setFreeConversations] = useState<any[]>([])
  const [isFromFreeConversation, setIsFromFreeConversation] = useState(false)
  
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    employee_id: 0,
    topic: "",
    candidate_message: "",
    duration_minutes: 30,
    scheduled_time: "",
    coupon_code: ""
  })

  // Check user role and redirect employees
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
          
          if (userData.role === 'employee') {
            router.push('/premium-conversations/employee')
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

  // Handle pre-selection from free conversation upgrade
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const employeeId = urlParams.get('employee_id')
    const fromFreeConversation = urlParams.get('from') === 'free_conversation'
    const conversationId = urlParams.get('conversation_id')
    
    if (fromFreeConversation && employeeId && userRole === 'candidate') {
      // Pre-fill topic for continuing from free conversation
      setBookingForm(prev => ({
        ...prev,
        employee_id: parseInt(employeeId),
        topic: "Continue Discussion from Free Conversation",
        candidate_message: `I'd like to continue our discussion from the free conversation (ID: ${conversationId}). Could we pick up where we left off?`
      }))
      
      // Show upgrade success message
      toast.success("Ready to Upgrade!", {
        description: "Continue your conversation with premium benefits. Book a session with the same employee."
      })
    }
  }, [userRole])

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) return

        const params = new URLSearchParams()
        if (searchTerm) params.append('search', searchTerm)
        if (filterExpertise !== 'all') params.append('expertise', filterExpertise)
        if (filterMinRating) params.append('min_rating', filterMinRating.toString())
        if (filterMaxRate) params.append('max_rate', filterMaxRate.toString())
        params.append('available_only', 'true')

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/employees?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setEmployees(data)
          
          // Auto-select employee if coming from free conversation
          const urlParams = new URLSearchParams(window.location.search)
          const employeeId = urlParams.get('employee_id')
          const fromFreeConversation = urlParams.get('from') === 'free_conversation'
          
          if (fromFreeConversation && employeeId) {
            const targetEmployee = data.find((emp: Employee) => emp.id === parseInt(employeeId))
            if (targetEmployee) {
              setSelectedEmployee(targetEmployee)
              setIsFromFreeConversation(true)
              // Update the booking form with the employee ID
              setBookingForm(prev => ({
                ...prev,
                employee_id: targetEmployee.id
              }))
              setShowBookingDialog(true)
            }
          }
        } else {
          console.error('Failed to fetch employees')
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
      }
    }

    if (userRole === 'candidate') {
      fetchEmployees()
    }
  }, [searchTerm, filterExpertise, filterMinRating, filterMaxRate, userRole])

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

    if (userRole === 'candidate') {
      fetchConversations()
    }
  }, [userRole])

  // Fetch free conversations for upgrade suggestions
  useEffect(() => {
    const fetchFreeConversations = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) return

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/free-conversations/`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setFreeConversations(data)
        }
      } catch (error) {
        console.error('Error fetching free conversations:', error)
      }
    }

    if (userRole === 'candidate') {
      fetchFreeConversations()
    }
  }, [userRole])

  const handleBookSession = (employee: Employee) => {
    setSelectedEmployee(employee)
    
    // Check if coming from free conversation to preserve pre-filled data
    const urlParams = new URLSearchParams(window.location.search)
    const fromFreeConversation = urlParams.get('from') === 'free_conversation'
    
    if (!fromFreeConversation) {
      // Only reset form if not coming from free conversation
      setIsFromFreeConversation(false)
      setBookingForm({
        employee_id: employee.id,
        topic: "",
        candidate_message: "",
        duration_minutes: 30,
        scheduled_time: "",
        coupon_code: ""
      })
    } else {
      // Just update employee ID but keep pre-filled data
      setIsFromFreeConversation(true)
      setBookingForm(prev => ({
        ...prev,
        employee_id: employee.id
      }))
    }
    setShowBookingDialog(true)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsBooking(true)

    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        toast.error('Please log in to book a session')
        return
      }

      // Calculate total amount
      const hourlyRate = selectedEmployee?.hourly_rate || 50
      const totalAmount = (hourlyRate * bookingForm.duration_minutes) / 60

      // Check if coupon provides full discount
      let needsPayment = true
      if (bookingForm.coupon_code) {
        try {
          const couponResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/validate-coupon`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: bookingForm.coupon_code,
              original_amount: totalAmount
            })
          })
          
          if (couponResponse.ok) {
            const couponResult = await couponResponse.json()
            if (couponResult.valid && couponResult.final_amount === 0) {
              needsPayment = false
            }
          }
        } catch (error) {
          console.error('Error validating coupon:', error)
        }
      }

      if (needsPayment) {
        // Show payment modal instead of directly booking
        setPaymentAmount(totalAmount)
        setShowBookingDialog(false)
        setShowPaymentDialog(true)
      } else {
        // Convert scheduled time to ISO format
        const scheduledDateTime = new Date(bookingForm.scheduled_time).toISOString()

        const bookingData = {
          ...bookingForm,
          scheduled_time: scheduledDateTime
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData)
        })

        if (response.ok) {
          const newConversation = await response.json()
          setConversations(prev => [newConversation, ...prev])
          setShowBookingDialog(false)
          toast.success('Session booked successfully! The employee will review your request.')
          
          // Reset form
          setBookingForm({
            employee_id: 0,
            topic: "",
            candidate_message: "",
            duration_minutes: 30,
            scheduled_time: "",
            coupon_code: ""
          })
        } else {
          const error = await response.json()
          toast.error(error.detail || 'Failed to book session')
        }
      }
    } catch (error) {
      console.error('Error booking session:', error)
      toast.error('Failed to book session')
    } finally {
      setIsBooking(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      const session = authClient.getSession()
      if (!session?.access_token) {
        toast.error('Authentication required')
        return
      }

      // First create the conversation
      const scheduledDateTime = new Date(bookingForm.scheduled_time).toISOString()
      const bookingData = {
        ...bookingForm,
        scheduled_time: scheduledDateTime
      }

      const conversationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      })

      if (!conversationResponse.ok) {
        const error = await conversationResponse.json()
        toast.error(error.detail || 'Failed to create session')
        return
      }

      const conversation = await conversationResponse.json()

      // Confirm payment with backend
      const confirmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/conversations/${conversation.id}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntent.id
        })
      })

      if (confirmResponse.ok) {
        toast.success('Payment confirmed! Session booked successfully.')
        setConversations(prev => [conversation, ...prev])
        setShowPaymentDialog(false)
        setShowBookingDialog(false)
        resetForm()
      } else {
        const error = await confirmResponse.json()
        toast.error(error.detail || 'Payment confirmation failed')
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Payment confirmation failed')
    }
  }

  const handlePaymentError = (error: string) => {
    toast.error(`Payment failed: ${error}`)
  }

  const resetForm = () => {
    setBookingForm({
      employee_id: 0,
      topic: "",
      candidate_message: "",
      duration_minutes: 30,
      scheduled_time: "",
      coupon_code: ""
    })
    setPaymentAmount(0)
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

  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 60) // Minimum 1 hour from now
    return now.toISOString().slice(0, 16)
  }

  // Show loading while checking role
  if (isLoading) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate stats for dashboard
  const upcomingConversations = conversations.filter(c => 
    ['pending', 'accepted', 'in_progress'].includes(c.status)
  )
  const completedConversations = conversations.filter(c => c.status === 'completed')
  const totalSpent = completedConversations.reduce((sum, c) => sum + c.total_amount, 0)
  const averageRating = completedConversations.length > 0 
    ? completedConversations.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / completedConversations.filter(c => c.rating).length
    : 0

  return (
    <DashboardLayout role="candidate">
      <div className="space-y-8">
        {/* Upgrade Banner */}
        {(() => {
          const urlParams = new URLSearchParams(window.location.search)
          const fromFreeConversation = urlParams.get('from') === 'free_conversation'
          const conversationId = urlParams.get('conversation_id')
          
          if (fromFreeConversation) {
            return (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900">
                      Ready to Upgrade Your Conversation!
                    </h3>
                    <p className="text-blue-700 mt-1">
                      Continue your discussion from Free Conversation #{conversationId} with premium benefits:
                    </p>
                    <ul className="text-sm text-blue-600 mt-2 space-y-1">
                      <li>• Unlimited messages during your session</li>
                      <li>• Scheduled 1-on-1 video calls</li>
                      <li>• Priority support and faster responses</li>
                      <li>• Session recordings and notes</li>
                    </ul>
                    <p className="text-sm text-blue-600 mt-3 font-medium">
                      Your previous employee has been pre-selected below. Simply book a session to continue!
                    </p>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Premium Conversations</h1>
          <p className="text-muted-foreground">
            Get personalized career advice from industry experts through one-on-one video sessions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {completedConversations.length} completed sessions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Next session in {upcomingConversations.length > 0 ? '2 hours' : 'none scheduled'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating Given</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Based on {completedConversations.filter(c => c.rating).length} reviews
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Experts</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready to help with your career
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Free Conversations Upgrade Section */}
        {(() => {
          const urlParams = new URLSearchParams(window.location.search)
          const fromFreeConversation = urlParams.get('from') === 'free_conversation'
          const upgradeRequiredConversations = freeConversations.filter(conv => conv.status === 'upgrade_required')
          
          // Only show if not coming from upgrade flow and has conversations that need upgrade
          if (!fromFreeConversation && upgradeRequiredConversations.length > 0) {
            return (
              <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                <CardHeader>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-yellow-900">
                        🚀 Ready to Upgrade Your Conversations?
                      </CardTitle>
                      <CardDescription className="text-yellow-700">
                        You have {upgradeRequiredConversations.length} free conversation{upgradeRequiredConversations.length !== 1 ? 's' : ''} that reached the message limit. Upgrade to premium to continue with unlimited messaging!
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upgradeRequiredConversations.slice(0, 3).map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={conv.employee?.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {conv.employee?.name?.split(' ').map((n: string) => n[0]).join('') || 'E'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{conv.employee?.name || 'Employee'}</p>
                          <p className="text-xs text-muted-foreground">
                            {conv.employee?.position || 'Position'} • Last active {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                                             <Button 
                         size="sm" 
                         variant="outline" 
                         className="border-yellow-300 hover:bg-yellow-100"
                         onClick={() => {
                           // Find the employee and trigger booking dialog
                           const targetEmployee = employees.find(emp => emp.id === conv.employee_id)
                           if (targetEmployee) {
                             setSelectedEmployee(targetEmployee)
                             setIsFromFreeConversation(true)
                             setBookingForm({
                               employee_id: targetEmployee.id,
                               topic: "Continue Discussion from Free Conversation",
                               candidate_message: `I'd like to continue our discussion from the free conversation (ID: ${conv.id}). Could we pick up where we left off?`,
                               duration_minutes: 30,
                               scheduled_time: "",
                               coupon_code: ""
                             })
                             setShowBookingDialog(true)
                             
                             // Scroll to top for better UX
                             window.scrollTo({ top: 0, behavior: 'smooth' })
                             
                             toast.success("Ready to Continue!", {
                               description: "Form pre-filled with your conversation details. Book your session below!"
                             })
                           } else {
                             toast.error("Employee not found", {
                               description: "The employee may not be available right now."
                             })
                           }
                         }}
                       >
                         <Crown className="mr-2 h-3 w-3" />
                         Continue
                       </Button>
                    </div>
                  ))}
                  {upgradeRequiredConversations.length > 3 && (
                    <p className="text-xs text-yellow-600 text-center">
                      And {upgradeRequiredConversations.length - 3} more conversation{upgradeRequiredConversations.length - 3 !== 1 ? 's' : ''} ready for upgrade
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          }
          return null
        })()}

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Experts</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="history">Session History</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterExpertise} onValueChange={setFilterExpertise}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Expertise</SelectItem>
                  <SelectItem value="React">React</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Product">Product Strategy</SelectItem>
                  <SelectItem value="Backend">Backend</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employees Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {employees.map((employee) => {
                const urlParams = new URLSearchParams(window.location.search)
                const preSelectedEmployeeId = urlParams.get('employee_id')
                const isPreSelected = preSelectedEmployeeId && employee.id === parseInt(preSelectedEmployeeId)
                
                return (
                <Card key={employee.id} className={`h-full ${isPreSelected ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
                  <CardHeader>
                    {isPreSelected && (
                      <div className="mb-3">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Your Free Conversation Partner
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.avatar_url || undefined} />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg leading-none mb-1">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">{employee.position}</p>
                        <p className="text-xs text-muted-foreground">{employee.company}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{employee.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({employee.total_sessions} sessions)</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${employee.hourly_rate}/hour</div>
                        <div className="text-xs text-muted-foreground">{employee.response_time}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {employee.expertise.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {employee.expertise.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{employee.expertise.length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      {employee.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {employee.bio}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Available Times:</div>
                      <div className="flex flex-wrap gap-1">
                        {employee.availability.slice(0, 3).map((slot, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {daysOfWeek[slot.day_of_week].slice(0, 3)} {slot.start_time}-{slot.end_time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleBookSession(employee)}
                      className={`w-full ${isPreSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      disabled={!employee.is_available}
                    >
                      {isPreSelected && employee.is_available
                        ? '🚀 Continue Conversation'
                        : employee.is_available 
                        ? 'Book Session' 
                        : 'Unavailable'}
                    </Button>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingConversations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Book a session with an expert to get started
                  </p>
                                     <Button onClick={() => {
                     const browseTab = document.querySelector('[value="browse"]') as HTMLElement
                     browseTab?.click()
                   }}>
                     Browse Experts
                   </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingConversations.map((conversation) => (
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
                              <span>${conversation.total_amount}</span>
                            </div>
                          </div>
                          {conversation.employee && (
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={conversation.employee.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {conversation.employee.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{conversation.employee.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          {conversation.status === 'accepted' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/premium-conversations/${conversation.id}?role=candidate`)}
                            >
                              <Video className="h-4 w-4 mr-2" />
                              Join Session
                            </Button>
                          )}
                          {conversation.status === 'in_progress' && (
                            <Button 
                              size="sm"
                              onClick={() => router.push(`/premium-conversations/${conversation.id}?role=candidate`)}
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

          <TabsContent value="history" className="space-y-4">
            {completedConversations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No session history</h3>
                  <p className="text-muted-foreground text-center">
                    Your completed sessions will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedConversations.map((conversation) => (
                  <Card key={conversation.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{conversation.topic}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{formatDateTime(conversation.scheduled_time)}</span>
                              <span>{conversation.duration_minutes} minutes</span>
                              <span>${conversation.total_amount}</span>
                            </div>
                            {conversation.employee && (
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={conversation.employee.avatar_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {conversation.employee.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{conversation.employee.name}</span>
                              </div>
                            )}
                          </div>
                          {conversation.rating && (
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= conversation.rating!
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {conversation.feedback && (
                          <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground">{conversation.feedback}</p>
                          </div>
                        )}
                        <div className="flex justify-end pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/premium-conversations/history/${conversation.id}`)}
                          >
                            View Conversation
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Booking Dialog */}
        <Dialog 
          open={showBookingDialog} 
          onOpenChange={(open) => {
            setShowBookingDialog(open)
            if (!open) {
              setIsFromFreeConversation(false)
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Book Session with {selectedEmployee?.name}</DialogTitle>
              <DialogDescription>
                ${selectedEmployee?.hourly_rate}/hour • Response time: {selectedEmployee?.response_time}
                {(() => {
                  const urlParams = new URLSearchParams(window.location.search)
                  const fromUrlConversation = urlParams.get('from') === 'free_conversation'
                  
                  if (fromUrlConversation || isFromFreeConversation) {
                    return (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                        ✨ <strong>Continuing from your free conversation</strong> - Form pre-filled for easy booking!
                      </div>
                    )
                  }
                  return null
                })()}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBookingSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="topic">Session Topic *</Label>
                  <Input
                    id="topic"
                    value={bookingForm.topic}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Frontend Career Guidance"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Select 
                    value={bookingForm.duration_minutes.toString()} 
                    onValueChange={(value) => setBookingForm(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes (${selectedEmployee ? (selectedEmployee.hourly_rate * 0.5).toFixed(2) : '0'})</SelectItem>
                      <SelectItem value="45">45 minutes (${selectedEmployee ? (selectedEmployee.hourly_rate * 0.75).toFixed(2) : '0'})</SelectItem>
                      <SelectItem value="60">60 minutes (${selectedEmployee ? selectedEmployee.hourly_rate.toFixed(2) : '0'})</SelectItem>
                      <SelectItem value="90">90 minutes (${selectedEmployee ? (selectedEmployee.hourly_rate * 1.5).toFixed(2) : '0'})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="scheduled_time">Preferred Date & Time *</Label>
                  <Input
                    id="scheduled_time"
                    type="datetime-local"
                    value={bookingForm.scheduled_time}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    min={getMinDateTime()}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message to {selectedEmployee?.name}</Label>
                  <Textarea
                    id="message"
                    value={bookingForm.candidate_message}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, candidate_message: e.target.value }))}
                    placeholder="Tell them what you'd like to discuss and any specific questions you have..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="coupon_code">Coupon Code (Optional)</Label>
                  <Input
                    id="coupon_code"
                    value={bookingForm.coupon_code || ''}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, coupon_code: e.target.value }))}
                    placeholder="Enter coupon code (e.g., DEV100, FREE)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Development codes: DEV100 (100% off), DEV50 (50% off), FREE (100% off)
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-lg">
                    ${selectedEmployee ? ((selectedEmployee.hourly_rate * bookingForm.duration_minutes) / 60).toFixed(2) : '0'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowBookingDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isBooking}>
                    {isBooking ? 'Booking...' : 'Send Request'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription>
                Secure payment processing for your premium conversation session
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {paymentAmount > 0 ? (
                <StripePayment
                  amount={paymentAmount}
                  description={`Premium conversation with ${selectedEmployee?.name}`}
                  itemDetails={{
                    title: `Session with ${selectedEmployee?.name}`,
                    duration: `${bookingForm.duration_minutes} minutes`,
                    features: [
                      "One-on-one video conversation",
                      "Personalized career guidance",
                      "Resume and application review",
                      "Session recording for reference"
                    ]
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-lg font-medium">Processing your free session...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
