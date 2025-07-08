"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Mail,
  Calendar,
  Building,
  Crown,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AuthClient } from "@/lib/auth"

interface DashboardStats {
  users: {
    by_role: {
      [key: string]: {
        total: number
        approved: number
        verified: number
      }
    }
  }
  waitlist: {
    by_status: {
      [key: string]: number
    }
  }
  recent_activity: {
    new_registrations_7d: number
    new_waitlist_7d: number
  }
}

interface User {
  id: number
  email: string
  name: string
  role: string
  company?: string
  position?: string
  department?: string
  is_verified: boolean
  beta_approved: boolean
  is_active: boolean
  created_at: string
  approval_date?: string
  admin_notes?: string
  total_referrals: number
  successful_referrals: number
}

interface WaitlistEntry {
  id: number
  email: string
  name: string
  role: string
  company?: string
  position: string
  invited: boolean
  status: string
  created_at: string
  reviewed_at?: string
  reviewer_name?: string
  admin_notes?: string
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const authClient = new AuthClient()
  
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Filtering and search
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [userStatusFilter, setUserStatusFilter] = useState("all")
  const [waitlistSearch, setWaitlistSearch] = useState("")
  const [waitlistStatusFilter, setWaitlistStatusFilter] = useState("all")
  
  // Pagination
  const [userPage, setUserPage] = useState(1)
  const [waitlistPage, setWaitlistPage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [waitlistTotal, setWaitlistTotal] = useState(0)
  const limit = 25

  // Action modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState<WaitlistEntry | null>(null)
  const [actionType, setActionType] = useState<"approve" | "decline" | "view" | null>(null)
  const [actionNotes, setActionNotes] = useState("")
  const [actionRole, setActionRole] = useState("candidate")

  // Check admin access
  useEffect(() => {
    if (user && user.role !== "admin") {
      toast.error("Admin access required")
      router.push("/dashboard")
      return
    }
  }, [user, router])

  // Fetch dashboard data
  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/dashboard-stats", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch stats")
      
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Failed to load dashboard statistics")
    }
  }

  const fetchUsers = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(userRoleFilter !== "all" && { role: userRoleFilter }),
        ...(userStatusFilter !== "all" && { status: userStatusFilter }),
        ...(userSearch && { search: userSearch })
      })

      const response = await fetch(`http://localhost:8000/admin/users?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch users")
      
      const data = await response.json()
      setUsers(data.data.users)
      setUserTotal(data.data.pagination.total)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    }
  }

  const fetchWaitlist = async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(waitlistStatusFilter !== "all" && { status: waitlistStatusFilter }),
        ...(waitlistSearch && { search: waitlistSearch })
      })

      const response = await fetch(`http://localhost:8000/admin/waitlist?${params}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        }
      })
      
      if (!response.ok) throw new Error("Failed to fetch waitlist")
      
      const data = await response.json()
      setWaitlist(data.data.waitlist)
      setWaitlistTotal(data.data.pagination.total)
    } catch (error) {
      console.error("Error fetching waitlist:", error)
      toast.error("Failed to load waitlist")
    }
  }

  // Load data on component mount and filter changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchUsers(userPage), fetchWaitlist(waitlistPage)])
      setLoading(false)
    }
    
    if (user?.role === "admin") {
      loadData()
    }
  }, [user, userPage, waitlistPage, userRoleFilter, userStatusFilter, userSearch, waitlistStatusFilter, waitlistSearch])

  // Handle user actions
  const handleUserAction = async (action: "approve" | "decline") => {
    if (!selectedUser) return

    try {
      const endpoint = action === "approve" ? "approve-beta" : "decline-beta"
      const response = await fetch(`http://localhost:8000/admin/users/${selectedUser.id}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          role: actionRole,
          notes: actionNotes
        })
      })

      if (!response.ok) throw new Error(`Failed to ${action} user`)

      toast.success(`User ${action === "approve" ? "approved" : "declined"} successfully`)
      
      // Refresh data
      fetchUsers(userPage)
      fetchStats()
      
      // Close modal
      setSelectedUser(null)
      setActionType(null)
      setActionNotes("")
      setActionRole("candidate")
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      toast.error(`Failed to ${action} user`)
    }
  }

  // Handle waitlist actions
  const handleWaitlistAction = async (action: "approve" | "decline") => {
    if (!selectedWaitlistEntry) return

    try {
      const response = await fetch(`http://localhost:8000/admin/waitlist/${selectedWaitlistEntry.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        body: JSON.stringify({
          role: actionRole,
          notes: actionNotes
        })
      })

      if (!response.ok) throw new Error(`Failed to ${action} waitlist entry`)

      toast.success(`Waitlist entry ${action === "approve" ? "approved" : "declined"} successfully`)
      
      // Refresh data
      fetchWaitlist(waitlistPage)
      fetchStats()
      
      // Close modal
      setSelectedWaitlistEntry(null)
      setActionType(null)
      setActionNotes("")
      setActionRole("candidate")
    } catch (error) {
      console.error(`Error ${action}ing waitlist entry:`, error)
      toast.error(`Failed to ${action} waitlist entry`)
    }
  }

  const getStatusBadge = (user: User) => {
    if (user.beta_approved) {
      return <Badge variant="default" className="bg-green-100 text-green-800">✅ Approved</Badge>
    } else if (user.is_verified) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🕐 Verified</Badge>
    } else {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">⏳ Pending</Badge>
    }
  }

  const getWaitlistStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ Approved</Badge>
      case "declined":
        return <Badge variant="destructive" className="bg-red-100 text-red-800">❌ Declined</Badge>
      case "pending":
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">⏳ Pending</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleLogout = async () => {
    try {
      await authClient.signOut()
      router.push("/auth/login")
    } catch (err) {
      console.error("Logout failed", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Crown className="h-8 w-8 text-yellow-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage users and beta access for ReferralInc</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 px-3 py-1">
              <Shield className="h-4 w-4 mr-1" />
              Admin Access
            </Badge>
            <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Users</p>
                    <p className="text-3xl font-bold">
                      {Object.values(stats.users.by_role).reduce((sum, role) => sum + role.total, 0)}
                    </p>
                  </div>
                  <Users className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100">Beta Approved</p>
                    <p className="text-3xl font-bold">
                      {Object.values(stats.users.by_role).reduce((sum, role) => sum + role.approved, 0)}
                    </p>
                  </div>
                  <UserCheck className="h-12 w-12 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100">Waitlist</p>
                    <p className="text-3xl font-bold">
                      {Object.values(stats.waitlist.by_status).reduce((sum, count) => sum + count, 0)}
                    </p>
                  </div>
                  <Clock className="h-12 w-12 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">New This Week</p>
                    <p className="text-3xl font-bold">
                      {stats.recent_activity.new_registrations_7d + stats.recent_activity.new_waitlist_7d}
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users Management</TabsTrigger>
            <TabsTrigger value="waitlist">Waitlist Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users by Role */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users by Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats && Object.entries(stats.users.by_role).map(([role, data]) => (
                      <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            role === "candidate" ? "bg-blue-500" : 
                            role === "employee" ? "bg-green-500" : "bg-purple-500"
                          }`} />
                          <span className="font-medium capitalize">{role}s</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">Total: {data.total}</span>
                          <span className="text-green-600">Approved: {data.approved}</span>
                          <span className="text-blue-600">Verified: {data.verified}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Waitlist Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Waitlist Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats && Object.entries(stats.waitlist.by_status).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === "approved" ? "bg-green-500" : 
                            status === "declined" ? "bg-red-500" : "bg-gray-500"
                          }`} />
                          <span className="font-medium capitalize">{status}</span>
                        </div>
                        <span className="text-lg font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Users Management
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="candidate">Candidate</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="beta_approved">Beta Approved</SelectItem>
                        <SelectItem value="beta_pending">Beta Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Joined</TableHead>
                        <TableHead className="font-semibold">Referrals</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.company || "N/A"}</p>
                              <p className="text-sm text-gray-500">{user.position || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{user.total_referrals} total</p>
                              <p className="text-gray-500">{user.successful_referrals} successful</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setActionType("view")
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!user.beta_approved && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setActionType("approve")
                                    setActionRole(user.role)
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setActionType("decline")
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {(userPage - 1) * limit + 1} to {Math.min(userPage * limit, userTotal)} of {userTotal} users
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage(Math.max(1, userPage - 1))}
                        disabled={userPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 py-1 text-sm">{userPage}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserPage(userPage + 1)}
                        disabled={userPage * limit >= userTotal}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Waitlist Management Tab */}
          <TabsContent value="waitlist" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Waitlist Management
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search waitlist..."
                        value={waitlistSearch}
                        onChange={(e) => setWaitlistSearch(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={waitlistStatusFilter} onValueChange={setWaitlistStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">User</TableHead>
                        <TableHead className="font-semibold">Desired Role</TableHead>
                        <TableHead className="font-semibold">Company</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Submitted</TableHead>
                        <TableHead className="font-semibold">Reviewed By</TableHead>
                        <TableHead className="font-semibold text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlist.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.name}</p>
                              <p className="text-sm text-gray-500">{entry.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {entry.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.company || "N/A"}</p>
                              <p className="text-sm text-gray-500">{entry.position || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getWaitlistStatusBadge(entry.status)}</TableCell>
                          <TableCell className="text-sm">
                            {formatDate(entry.created_at)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {entry.reviewer_name || "—"}
                            {entry.reviewed_at && (
                              <p className="text-gray-500">{formatDate(entry.reviewed_at)}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedWaitlistEntry(entry)
                                  setActionType("view")
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {entry.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setSelectedWaitlistEntry(entry)
                                      setActionType("approve")
                                      setActionRole(entry.role)
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedWaitlistEntry(entry)
                                      setActionType("decline")
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {(waitlistPage - 1) * limit + 1} to {Math.min(waitlistPage * limit, waitlistTotal)} of {waitlistTotal} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWaitlistPage(Math.max(1, waitlistPage - 1))}
                        disabled={waitlistPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3 py-1 text-sm">{waitlistPage}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setWaitlistPage(waitlistPage + 1)}
                        disabled={waitlistPage * limit >= waitlistTotal}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Modals */}
        <Dialog open={actionType !== null} onOpenChange={() => setActionType(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionType === "view" ? "User Details" :
                 actionType === "approve" ? "Approve Access" :
                 actionType === "decline" ? "Decline Access" : ""}
              </DialogTitle>
            </DialogHeader>
            
            {actionType === "view" && (selectedUser || selectedWaitlistEntry) && (
              <div className="space-y-4">
                {selectedUser && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-600">{selectedUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Role</Label>
                      <p className="text-sm text-gray-600 capitalize">{selectedUser.role}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-gray-600">{selectedUser.company || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedUser)}</div>
                    </div>
                    {selectedUser.admin_notes && (
                      <div>
                        <Label className="text-sm font-medium">Admin Notes</Label>
                        <p className="text-sm text-gray-600">{selectedUser.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedWaitlistEntry && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-gray-600">{selectedWaitlistEntry.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{selectedWaitlistEntry.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Desired Role</Label>
                      <p className="text-sm text-gray-600 capitalize">{selectedWaitlistEntry.role}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-gray-600">{selectedWaitlistEntry.company || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">{getWaitlistStatusBadge(selectedWaitlistEntry.status)}</div>
                    </div>
                    {selectedWaitlistEntry.admin_notes && (
                      <div>
                        <Label className="text-sm font-medium">Admin Notes</Label>
                        <p className="text-sm text-gray-600">{selectedWaitlistEntry.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(actionType === "approve" || actionType === "decline") && (
              <div className="space-y-4">
                {actionType === "approve" && (
                  <div>
                    <Label htmlFor="role">Assign Role</Label>
                    <Select value={actionRole} onValueChange={setActionRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="candidate">Candidate</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="notes">Admin Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder={`Add notes for this ${actionType}...`}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActionType(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant={actionType === "approve" ? "default" : "destructive"}
                    onClick={() => {
                      if (selectedUser) {
                        handleUserAction(actionType as "approve" | "decline")
                      } else if (selectedWaitlistEntry) {
                        handleWaitlistAction(actionType as "approve" | "decline")
                      }
                    }}
                    className="flex-1"
                  >
                    {actionType === "approve" ? "Approve" : "Decline"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 