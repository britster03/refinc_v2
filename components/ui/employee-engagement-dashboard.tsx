"use client"

import {
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, MessageSquare, Star, Award } from "lucide-react"

const engagementTrends = [
  { month: "Jan", participation: 65, satisfaction: 4.2, responseTime: 3.2 },
  { month: "Feb", participation: 70, satisfaction: 4.3, responseTime: 2.8 },
  { month: "Mar", participation: 68, satisfaction: 4.1, responseTime: 3.1 },
  { month: "Apr", participation: 75, satisfaction: 4.4, responseTime: 2.5 },
  { month: "May", participation: 78, satisfaction: 4.5, responseTime: 2.2 },
  { month: "Jun", participation: 82, satisfaction: 4.6, responseTime: 2.0 },
]

const departmentEngagement = [
  { department: "Engineering", employees: 45, active: 38, rate: 84 },
  { department: "Product", employees: 22, active: 19, rate: 86 },
  { department: "Design", employees: 15, active: 12, rate: 80 },
  { department: "Marketing", employees: 28, active: 22, rate: 79 },
  { department: "Sales", employees: 35, active: 25, rate: 71 },
]

const topPerformers = [
  {
    id: 1,
    name: "Sarah Johnson",
    department: "Engineering",
    avatar: "/placeholder.svg?height=40&width=40",
    referrals: 23,
    successRate: 87,
    rating: 4.9,
    trend: "up",
  },
  {
    id: 2,
    name: "Michael Chen",
    department: "Product",
    avatar: "/placeholder.svg?height=40&width=40",
    referrals: 19,
    successRate: 84,
    rating: 4.8,
    trend: "up",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    department: "Design",
    avatar: "/placeholder.svg?height=40&width=40",
    referrals: 16,
    successRate: 81,
    rating: 4.7,
    trend: "stable",
  },
]

const activityTypes = [
  { name: "Referrals Submitted", value: 45, color: "#3b82f6" },
  { name: "Feedback Provided", value: 32, color: "#10b981" },
  { name: "Conversations", value: 18, color: "#f59e0b" },
  { name: "Profile Updates", value: 5, color: "#8b5cf6" },
]

export function EmployeeEngagementDashboard() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">116</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +8% from last month
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Participation Rate</p>
                <p className="text-2xl font-bold">82%</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +5% from last month
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">2.0h</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingDown className="mr-1 h-3 w-3" />
                  -0.2h from last month
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Satisfaction Score</p>
                <p className="text-2xl font-bold">4.6</p>
                <p className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +0.1 from last month
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>Monthly participation and satisfaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="participation"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Participation %"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Satisfaction (1-5)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Distribution</CardTitle>
            <CardDescription>Types of employee activities this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {activityTypes.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Engagement</CardTitle>
          <CardDescription>Participation rates by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentEngagement.map((dept, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{dept.department}</h4>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      {dept.active}/{dept.employees} active
                    </span>
                    <Badge variant={dept.rate >= 80 ? "default" : "secondary"}>{dept.rate}%</Badge>
                  </div>
                </div>
                <Progress value={dept.rate} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Employees with highest engagement and success rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <Avatar>
                      <AvatarImage src={performer.avatar || "/placeholder.svg"} alt={performer.name} />
                      <AvatarFallback>
                        {performer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h4 className="font-medium">{performer.name}</h4>
                    <p className="text-sm text-muted-foreground">{performer.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">{performer.referrals}</div>
                    <div className="text-xs text-muted-foreground">Referrals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{performer.successRate}%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-lg font-bold">{performer.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                  <div className="flex items-center">
                    {performer.trend === "up" && <TrendingUp className="h-5 w-5 text-green-600" />}
                    {performer.trend === "down" && <TrendingDown className="h-5 w-5 text-red-600" />}
                    {performer.trend === "stable" && <div className="h-5 w-5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline">View All Performers</Button>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Insights</CardTitle>
          <CardDescription>AI-powered recommendations to improve participation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Success Factors</h4>
              </div>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Regular recognition programs boost participation by 15%</li>
                <li>• Quick response times correlate with higher satisfaction</li>
                <li>• Cross-department collaboration increases engagement</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Growth Opportunities</h4>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Sales department has potential for 20% improvement</li>
                <li>• Implement gamification for increased participation</li>
                <li>• Peer mentoring programs show promising results</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Action Items</h4>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Launch monthly recognition program</li>
                <li>• Create engagement leaderboards</li>
                <li>• Implement automated feedback collection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
