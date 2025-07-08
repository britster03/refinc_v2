"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { ArrowUp, ArrowDown, TrendingUp, Users, CheckCircle, Star, DollarSign } from "lucide-react"

export default function EmployeeAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days")

  // Mock data for charts
  const referralTrendsData = [
    { name: "Jan", accepted: 4, rejected: 2 },
    { name: "Feb", accepted: 6, rejected: 1 },
    { name: "Mar", accepted: 8, rejected: 3 },
    { name: "Apr", accepted: 5, rejected: 2 },
    { name: "May", accepted: 9, rejected: 1 },
    { name: "Jun", accepted: 7, rejected: 2 },
  ]

  const positionBreakdownData = [
    { name: "Frontend Developer", referrals: 10 },
    { name: "Backend Developer", referrals: 7 },
    { name: "Full Stack Developer", referrals: 5 },
    { name: "DevOps Engineer", referrals: 2 },
  ]

  // Mock metrics
  const metrics = {
    totalReferrals: 24,
    acceptanceRate: 75,
    averageRating: 4.8,
    premiumEarnings: 1250,
  }

  // Mock trends
  const trends = {
    totalReferrals: { value: 5, percentage: 26, trend: "up" },
    acceptanceRate: { value: 8, percentage: 12, trend: "up" },
    averageRating: { value: 0.2, percentage: 4, trend: "up" },
    premiumEarnings: { value: 350, percentage: 39, trend: "up" },
  }

  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Employee Analytics</h1>
            <p className="text-muted-foreground">Track your referral performance and earnings</p>
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
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageRating}</div>
              <div className="flex items-center pt-1">
                {trends.averageRating.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs ${trends.averageRating.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {trends.averageRating.percentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.premiumEarnings}</div>
              <div className="flex items-center pt-1">
                {trends.premiumEarnings.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-xs ${trends.premiumEarnings.trend === "up" ? "text-green-500" : "text-red-500"}`}
                >
                  {trends.premiumEarnings.percentage}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Referral Trends</CardTitle>
              <CardDescription>Accepted vs rejected referrals over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={referralTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="accepted" stroke="#22c55e" name="Accepted" />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="Rejected" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Position Breakdown</CardTitle>
              <CardDescription>Referrals by position type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={positionBreakdownData}>
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

        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Key insights about your referral performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-medium">Response Time</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average response time</span>
                  <span className="font-medium">1.2 days</span>
                </div>
                <Progress value={85} />
                <p className="text-xs text-muted-foreground">85% faster than average</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Quality Score</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Candidate satisfaction</span>
                  <span className="font-medium">4.8/5.0</span>
                </div>
                <Progress value={96} />
                <p className="text-xs text-muted-foreground">Top 5% of employees</p>
              </div>
            </div>

            <div className="rounded-md border p-4">
              <h3 className="font-medium mb-2">Recent Achievements</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Top Performer
                  </Badge>
                  <span className="text-sm text-muted-foreground">Achieved 90%+ acceptance rate this month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Fast Responder
                  </Badge>
                  <span className="text-sm text-muted-foreground">Average response time under 24 hours</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
