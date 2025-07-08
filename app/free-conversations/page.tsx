"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, Clock, Filter, Search, Crown, AlertCircle, 
  CheckCircle2, XCircle, Loader2, ArrowRight 
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth"

interface FreeConversation {
  id: number
  referral_id: number
  candidate_id: number
  employee_id: number
  status: 'active' | 'completed' | 'upgrade_required' | 'cancelled'
  message_count: number
  max_messages: number
  candidate_message_count: number
  employee_message_count: number
  max_messages_per_user: number
  created_at: string
  updated_at: string
  completed_at?: string
  employee?: {
    id: number
    name: string
    email: string
    avatar_url?: string
    position?: string
    company?: string
  }
  referral?: {
    position: string
    company: string
  }
}

export default function CandidateFreeConversationsPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<FreeConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const session = authClient.getSession()
        if (!session?.access_token) {
          router.push('/auth/login')
          return
        }

        // Check user role
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (userResponse.ok) {
          const userData = await userResponse.json()
          if (userData.role === 'employee') {
            router.push('/free-conversations/employee')
            return
          }
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/free-conversations/`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data)
        } else {
          console.error('Failed to load conversations')
          toast.error('Failed to load conversations')
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
        toast.error('Error loading conversations')
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [router])

  // Filter conversations based on search and status
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = searchQuery === "" || 
      conversation.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.employee?.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.employee?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.referral?.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conversation.referral?.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || conversation.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'upgrade_required':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4" />
      case 'upgrade_required':
        return <Crown className="h-4 w-4" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const activeConversations = conversations.filter(c => c.status === 'active')
  const upgradeRequiredConversations = conversations.filter(c => c.status === 'upgrade_required')
  const completedConversations = conversations.filter(c => c.status === 'completed')

  return (
    <DashboardLayout role="candidate">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Free Conversations</h1>
          <p className="text-muted-foreground">
            Continue discussions about rejection feedback with employees
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversations.length}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Ongoing conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Upgrade</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upgradeRequiredConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Ready for premium
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Finished conversations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Required Section */}
        {upgradeRequiredConversations.length > 0 && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Crown className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-yellow-900">
                    🚀 Ready to Upgrade?
                  </CardTitle>
                  <CardDescription className="text-yellow-700">
                    You have {upgradeRequiredConversations.length} conversation{upgradeRequiredConversations.length !== 1 ? 's' : ''} that reached the message limit. Upgrade to premium to continue!
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Link href="/premium-conversations">
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee, position, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="upgrade_required">Need Upgrade</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Conversations ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConversations.length > 0 ? (
              <div className="divide-y">
                {filteredConversations.map((conversation) => {
                  const employeeName = conversation.employee?.name || 'Unknown Employee'
                  const employeeInitials = employeeName.split(' ').map(n => n[0]).join('')
                  
                  // Get position and company info from the referral context (this conversation is about a specific referral)
                  let workInfo = 'Employee'
                  
                  if (conversation.referral?.position && conversation.referral?.company) {
                    // We have referral context - this is the position/company the conversation is about
                    workInfo = `${conversation.referral.position} at ${conversation.referral.company}`
                  } else if (conversation.employee?.position && conversation.employee?.company) {
                    // Fall back to employee's general info
                    workInfo = `${conversation.employee.position} at ${conversation.employee.company}`
                  } else if (conversation.referral?.position) {
                    // Just position from referral
                    workInfo = `${conversation.referral.position} position`
                  } else if (conversation.referral?.company) {
                    // Just company from referral
                    workInfo = `Employee at ${conversation.referral.company}`
                  } else {
                    // Default case
                    workInfo = 'Employee'
                  }
                  
                  return (
                    <div key={conversation.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={conversation.employee?.avatar_url || "/placeholder.svg"}
                            alt={employeeName}
                          />
                          <AvatarFallback>{employeeInitials}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <div className="font-medium">{employeeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {workInfo}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Started {new Date(conversation.created_at).toLocaleDateString()}</span>
                            {conversation.updated_at !== conversation.created_at && (
                              <span>• Updated {new Date(conversation.updated_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs mb-1">
                            You: {conversation.candidate_message_count}/{conversation.max_messages_per_user} | Employee: {conversation.employee_message_count}/{conversation.max_messages_per_user}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(conversation.status)}
                            <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                              {getStatusLabel(conversation.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {conversation.status === 'upgrade_required' && (
                            <Link href={`/premium-conversations?employee_id=${conversation.employee_id}&from=free_conversation&conversation_id=${conversation.id}`}>
                              <Button size="sm" variant="outline" className="border-yellow-300 hover:bg-yellow-100">
                                <Crown className="mr-2 h-3 w-3" />
                                Upgrade
                              </Button>
                            </Link>
                          )}
                          <Link href={`/free-conversations/${conversation.id}`}>
                            <Button size="sm">
                              {conversation.status === 'active' ? 'Continue' : 'View'}
                              <ArrowRight className="ml-2 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">No conversations found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your filters"
                    : "You haven't started any free conversations yet"
                  }
                </p>
                {(!searchQuery && statusFilter === "all") && (
                  <Link href="/referrals">
                    <Button>
                      View Your Referrals
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 