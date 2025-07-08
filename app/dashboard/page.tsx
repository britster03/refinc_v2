"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // In a real app, you would get the user role from authentication context
    // For now, we'll default to candidate
    const userRole = "candidate" // This would come from your auth system

    if (userRole === "candidate") {
      router.replace("/dashboard/candidate")
    } else if (userRole === "employee") {
      router.replace("/dashboard/employee")
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold">Redirecting to your dashboard...</h2>
        <p className="text-muted-foreground">Please wait while we load your personalized experience.</p>
      </div>
    </div>
  )
}

function CandidateDashboard() {
  // Mock data - in a real app, this would come from a database
  const recentReferrals = [
    {
      id: 1,
      company: "Tech Solutions Inc.",
      position: "Senior Frontend Developer",
      employee: "Sarah Johnson",
      status: "pending",
      date: "2025-04-15",
    },
    {
      id: 2,
      company: "Global Innovations",
      position: "Product Manager",
      employee: "Michael Chen",
      status: "accepted",
      date: "2025-04-10",
    },
    {
      id: 3,
      company: "Digital Creations",
      position: "UX Designer",
      employee: "Emily Rodriguez",
      status: "rejected",
      date: "2025-04-05",
    },
  ]

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's an overview of your referral activities.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted Referrals</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">58% acceptance rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Referrals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent" className="w-full">
          <TabsList>
            <TabsTrigger value="recent">Recent Referrals</TabsTrigger>
            <TabsTrigger value="recommended">Recommended Employees</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="space-y-4">
            <div className="rounded-md border">
              <div className="p-4">
                <h2 className="text-xl font-semibold">Recent Referral Requests</h2>
                <p className="text-sm text-muted-foreground">Track the status of your recent referral requests</p>
              </div>
              <div className="divide-y">
                {recentReferrals.map((referral) => (
                  <div key={referral.id} className="flex items-center justify-between p-4">
                    <div className="grid gap-1">
                      <div className="font-medium">{referral.position}</div>
                      <div className="text-sm text-muted-foreground">
                        {referral.company} • {referral.employee}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          referral.status === "pending"
                            ? "outline"
                            : referral.status === "accepted"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {referral.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {referral.status === "accepted" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {referral.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                      </Badge>
                      <Link href={`/referrals/${referral.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end p-4">
                <Link href="/referrals">
                  <Button variant="outline">View all referrals</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="recommended" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recommended Employees</CardTitle>
                <CardDescription>Employees who might be a good fit for your next referral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Employee" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">John Doe</h3>
                      <p className="text-sm text-muted-foreground">Senior Developer at Tech Solutions Inc.</p>
                    </div>
                    <div className="ml-auto">
                      <Link href="/employees/1">
                        <Button size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Employee" />
                      <AvatarFallback>AS</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">Alice Smith</h3>
                      <p className="text-sm text-muted-foreground">Product Manager at Global Innovations</p>
                    </div>
                    <div className="ml-auto">
                      <Link href="/employees/2">
                        <Button size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Employee" />
                      <AvatarFallback>RJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">Robert Johnson</h3>
                      <p className="text-sm text-muted-foreground">Engineering Manager at Digital Creations</p>
                    </div>
                    <div className="ml-auto">
                      <Link href="/employees/3">
                        <Button size="sm">View Profile</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
