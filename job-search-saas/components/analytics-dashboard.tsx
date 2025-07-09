"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Clock, Award } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const applicationData = [
  { month: "Jan", applications: 12, interviews: 2, offers: 0 },
  { month: "Feb", applications: 18, interviews: 3, offers: 1 },
  { month: "Mar", applications: 25, interviews: 4, offers: 1 },
  { month: "Apr", applications: 32, interviews: 6, offers: 2 },
  { month: "May", applications: 28, interviews: 5, offers: 1 },
  { month: "Jun", applications: 22, interviews: 3, offers: 0 },
]

const responseTimeData = [
  { week: "Week 1", avgDays: 7 },
  { week: "Week 2", avgDays: 5 },
  { week: "Week 3", avgDays: 4 },
  { week: "Week 4", avgDays: 6 },
  { week: "Week 5", avgDays: 3 },
  { week: "Week 6", avgDays: 4 },
]

const companyData = [
  { name: "Tech Startups", value: 35, color: "#8884d8" },
  { name: "Enterprise", value: 25, color: "#82ca9d" },
  { name: "Mid-size", value: 20, color: "#ffc658" },
  { name: "Consulting", value: 12, color: "#ff7300" },
  { name: "Other", value: 8, color: "#00ff88" },
]

const salaryData = [
  { range: "$80k-$100k", count: 15 },
  { range: "$100k-$120k", count: 32 },
  { range: "$120k-$140k", count: 28 },
  { range: "$140k-$160k", count: 18 },
  { range: "$160k+", count: 12 },
]

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">137</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> improvement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 days</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-1.3 days</span> faster
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">17%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3%</span> this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="salary">Salary Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Trends</CardTitle>
                <CardDescription>Monthly application activity and outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={applicationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                    <Bar dataKey="interviews" fill="#82ca9d" name="Interviews" />
                    <Bar dataKey="offers" fill="#ffc658" name="Offers" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>Average days to receive responses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgDays" stroke="#8884d8" strokeWidth={2} name="Avg Days" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Application to Interview</span>
                    <span>17%</span>
                  </div>
                  <Progress value={17} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Interview to Offer</span>
                    <span>35%</span>
                  </div>
                  <Progress value={35} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Success Rate</span>
                    <span>6%</span>
                  </div>
                  <Progress value={6} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { skill: "React", interviews: 8, color: "bg-blue-500" },
                  { skill: "TypeScript", interviews: 6, color: "bg-green-500" },
                  { skill: "Node.js", interviews: 5, color: "bg-yellow-500" },
                  { skill: "AWS", interviews: 4, color: "bg-purple-500" },
                ].map((item) => (
                  <div key={item.skill} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm">{item.skill}</span>
                    </div>
                    <Badge variant="secondary">{item.interviews} interviews</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { status: "Pending", count: 45, color: "bg-yellow-500" },
                  { status: "Interview", count: 23, color: "bg-green-500" },
                  { status: "Rejected", count: 52, color: "bg-red-500" },
                  { status: "Offer", count: 5, color: "bg-blue-500" },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm">{item.status}</span>
                    </div>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Volume by Day</CardTitle>
                <CardDescription>Best days to submit applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { day: "Monday", count: 28, rate: "25%" },
                    { day: "Tuesday", count: 35, rate: "31%" },
                    { day: "Wednesday", count: 22, rate: "18%" },
                    { day: "Thursday", count: 18, rate: "15%" },
                    { day: "Friday", count: 12, rate: "8%" },
                    { day: "Weekend", count: 8, rate: "5%" },
                  ].map((item) => (
                    <div key={item.day} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: item.rate }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Rate by Platform</CardTitle>
                <CardDescription>Where you get the best responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { platform: "LinkedIn", rate: 28, applications: 45 },
                    { platform: "Company Website", rate: 35, applications: 32 },
                    { platform: "Indeed", rate: 15, applications: 28 },
                    { platform: "AngelList", rate: 22, applications: 18 },
                    { platform: "Glassdoor", rate: 12, applications: 14 },
                  ].map((item) => (
                    <div key={item.platform} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.platform}</span>
                        <span>
                          {item.rate}% ({item.applications} apps)
                        </span>
                      </div>
                      <Progress value={item.rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Applications by Company Type</CardTitle>
                <CardDescription>Distribution of your applications</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={companyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {companyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Companies Applied</CardTitle>
                <CardDescription>Companies with most applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { company: "Google", applications: 8, interviews: 2, logo: "G" },
                    { company: "Microsoft", applications: 6, interviews: 1, logo: "M" },
                    { company: "Amazon", applications: 5, interviews: 1, logo: "A" },
                    { company: "Meta", applications: 4, interviews: 0, logo: "F" },
                    { company: "Apple", applications: 3, interviews: 1, logo: "A" },
                  ].map((item) => (
                    <div key={item.company} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold">{item.logo}</span>
                        </div>
                        <span className="font-medium">{item.company}</span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{item.applications} apps</span>
                        <span>{item.interviews} interviews</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Salary Range Distribution</CardTitle>
                <CardDescription>Applications by salary range</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Salary Insights</CardTitle>
                <CardDescription>Key salary statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">$125k</div>
                    <p className="text-xs text-muted-foreground">Average Target</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">$140k</div>
                    <p className="text-xs text-muted-foreground">Highest Applied</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Below Market Rate</span>
                      <span>15%</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Market Rate</span>
                      <span>65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Above Market Rate</span>
                      <span>20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
