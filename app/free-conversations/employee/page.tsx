"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MessageSquare, Clock, Filter, Search, Loader2 } from "lucide-react"
import Link from "next/link"
import { authClient } from "@/lib/auth"
import { toast } from "sonner"

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
  candidate?: {
    id: number
    name: string
    email: string
    avatar_url?: string
  }
  referral?: {
    position: string
    company: string
  }
}

export default function EmployeeFreeConversationsPage() {
  const [conversations, setConversations] = useState<FreeConversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<FreeConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        
        const session = authClient.getSession()
        if (!session?.access_token) {
          toast.error("Please log in to view conversations")
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/free-conversations/`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const allConversations = await response.json()
          // Filter to show only conversations where current user is the employee
          const user = await authClient.getUser()
          const employeeConversations = allConversations.filter((conv: FreeConversation) => 
            conv.employee_id === user?.id
          )
          setConversations(employeeConversations)
          setFilteredConversations(employeeConversations)
        } else {
          toast.error("Failed to load conversations")
        }
      } catch (error) {
        console.error('Error loading conversations:', error)
        toast.error("Failed to load conversations")
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // Filter conversations based on search and status
  useEffect(() => {
    let filtered = conversations

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.referral?.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.referral?.company?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(conv => conv.status === statusFilter)
    }

    setFilteredConversations(filtered)
  }, [conversations, searchQuery, statusFilter])

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
        return 'Limit Reached'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="employee">
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
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Free Conversations</h1>
          <p className="text-muted-foreground">
            Manage conversations with candidates about rejection feedback
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
              <CardTitle className="text-sm font-medium">Limit Reached</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upgradeRequiredConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Need premium upgrade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedConversations.length}</div>
              <p className="text-xs text-muted-foreground">
                Finished conversations
              </p>
            </CardContent>
          </Card>
        </div>

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
                    placeholder="Search by candidate name, position, or company..."
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
                <option value="upgrade_required">Limit Reached</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations ({filteredConversations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConversations.length > 0 ? (
              <div className="divide-y">
                {filteredConversations.map((conversation) => {
                  const candidateName = conversation.candidate?.name || 'Unknown Candidate'
                  const candidateInitials = candidateName.split(' ').map(n => n[0]).join('')
                  const position = conversation.referral?.position || 'Unknown Position'
                  const company = conversation.referral?.company || 'Unknown Company'
                  
                  return (
                    <div key={conversation.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={conversation.candidate?.avatar_url || "/placeholder.svg"}
                            alt={candidateName}
                          />
                          <AvatarFallback>{candidateInitials}</AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                          <div className="font-medium">{candidateName}</div>
                          <div className="text-sm text-muted-foreground">
                            {position} at {company}
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
                             Candidate: {conversation.candidate_message_count}/{conversation.max_messages_per_user} | You: {conversation.employee_message_count}/{conversation.max_messages_per_user}
                           </Badge>
                          <div>
                            <Badge className={`text-xs ${getStatusColor(conversation.status)}`}>
                              {getStatusLabel(conversation.status)}
                            </Badge>
                          </div>
                        </div>
                        <Link href={`/free-conversations/${conversation.id}`}>
                          <Button size="sm">
                            {conversation.status === 'active' ? 'Continue' : 'View'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">No conversations found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your filters"
                    : "No candidates have started conversations with you yet"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 