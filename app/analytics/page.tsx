"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ArrowUp, ArrowDown, TrendingUp, Users, CheckCircle, XCircle, Clock, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days")

  // Mock data for charts
  const referralStatusData = [
    { name: "Accepted", value: 18, color: "#22c55e" },
    { name: "Pending", value: 7, color: "#f59e0b" },
    { name: "Rejected", value: 5, color: "#ef4444" },
  ]

  const monthlyReferralsData = [
    { name: "Jan", referrals: 4 },
    { name: "Feb", referrals: 6 },
    { name: "Mar", referrals: 8 },
    { name: "Apr", referrals: 12 },
    { name: "May", referrals: 9 },
    { name: "Jun", referrals: 15 },
  ]

  const companyReferralsData = [
    { name: "Tech Solutions Inc.", referrals: 12 },
    { name: "Global Innovations", referrals: 8 },
    { name: "Digital Creations", referrals: 6 },
    { name: "Future Systems", referrals: 4 },
  ]

  const positionReferralsData = [
    { name: "Frontend Developer", referrals: 10 },
    { name: "Backend Developer", referrals: 7 },
    { name: "Product Manager", referrals: 5 },
    { name: "UX Designer", referrals: 4 },
    { name: "Data Scientist", referrals: 4 },
  ]

  // Mock metrics
  const metrics = {
    totalReferrals: 30,
    acceptanceRate: 60,
    averageResponseTime: "2.3 days",
    activeReferrals: 7,
  }

  // Mock trends
  const trends = {
    totalReferrals: { value: 8, percentage: 20, trend: "up" },
    acceptanceRate: { value: 5, percentage: 10, trend: "up" },
    averageResponseTime: { value: 0.5, percentage: 15, trend: "down" },
    activeReferrals: { value: 2, percentage: 40, trend: "up" },
  }

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Track your referral performance and insights</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalReferrals}</div>
              <div className="flex items-center pt-1">
                {trends.totalReferrals.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${trends.totalReferrals.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {trends.totalReferrals.percentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.acceptanceRate}%</div>
              <div className="flex items-center pt-1">
                {trends.acceptanceRate.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${trends.acceptanceRate.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {trends.acceptanceRate.percentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageResponseTime}</div>
              <div className="flex items-center pt-1">
                {trends.averageResponseTime.trend === "down" ? (
                  <ArrowDown className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-xs ${trends.averageResponseTime.trend === "down" ? "text-green-500" : "text-red-500"}`}
                >
                  {trends.averageResponseTime.percentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeReferrals}</div>
              <div className="flex items-center pt-1">
                {trends.activeReferrals.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-xs ${trends.activeReferrals.trend === "up" ? "text-green-500" : "text-red-500"}`}
                >
                  {trends.activeReferrals.percentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Referral Status</CardTitle>
              <CardDescription>Distribution of your referral statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referralStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {referralStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#22c55e]" />
                  <span className="text-sm">Accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ef4444]" />
                  <span className="text-sm">Rejected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Referrals</CardTitle>
              <CardDescription>Number of referrals per month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReferralsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="referrals" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="companies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Referral Breakdown</CardTitle>
                <TabsList>
                  <TabsTrigger value="companies">Companies</TabsTrigger>
                  <TabsTrigger value="positions">Positions</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="companies" className="space-y-4">
                {companyReferralsData.map((company, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{company.name}</span>
                      <span className="text-sm">{company.referrals} referrals</span>
                    </div>
                    <Progress
                      value={(company.referrals / Math.max(...companyReferralsData.map((c) => c.referrals))) * 100}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="positions" className="space-y-4">
                {positionReferralsData.map((position, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{position.name}</span>
                      <span className="text-sm">{position.referrals} referrals</span>
                    </div>
                    <Progress
                      value={(position.referrals / Math.max(...positionReferralsData.map((p) => p.referrals))) * 100}
                    />
                  </div>
                ))}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent referral activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="absolute top-8 bottom-0 left-1/2 -translate-x-1/2 w-px bg-muted" />
                </div>
                <div className="space-y-1 pb-8">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Referral Accepted</h4>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />2 days ago
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your referral for Senior Frontend Developer at Tech Solutions Inc. was accepted by John Doe.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="absolute top-8 bottom-0 left-1/2 -translate-x-1/2 w-px bg-muted" />
                </div>
                <div className="space-y-1 pb-8">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">New Referral Request</h4>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />5 days ago
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You submitted a referral request for Product Manager at Global Innovations to Alice Smith.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                    <XCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Referral Rejected</h4>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="mr-1 h-3 w-3" />1 week ago
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your referral for UX Designer at Digital Creations was rejected by Emily Rodriguez.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
