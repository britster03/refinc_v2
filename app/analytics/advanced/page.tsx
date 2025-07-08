"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Calendar, Download, Filter, RefreshCw, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { EmployeeProfileCard } from "@/components/ui/employee-profile-card"
import { SentimentAnalysisChart } from "@/components/ui/sentiment-analysis-chart"
import { CandidateEvaluationChart } from "@/components/ui/candidate-evaluation-chart"
import { EmployeeEngagementDashboard } from "@/components/ui/employee-engagement-dashboard"
import { CustomReportGenerator } from "@/components/ui/custom-report-generator"
import { RealTimeNotificationSystem } from "@/components/ui/real-time-notification-system"

// Mock data
const referralsByStatus = [
  { name: "Pending", value: 12 },
  { name: "Reviewing", value: 19 },
  { name: "Interview", value: 15 },
  { name: "Offer", value: 8 },
  { name: "Hired", value: 11 },
  { name: "Rejected", value: 7 },
]

const referralTrends = [
  { month: "Jan", referrals: 10, hires: 2 },
  { month: "Feb", referrals: 15, hires: 3 },
  { month: "Mar", referrals: 12, hires: 4 },
  { month: "Apr", referrals: 18, hires: 6 },
  { month: "May", referrals: 22, hires: 8 },
  { month: "Jun", referrals: 25, hires: 10 },
]

const departmentPerformance = [
  { department: "Engineering", referrals: 35, hires: 12, conversionRate: 34 },
  { department: "Marketing", referrals: 22, hires: 8, conversionRate: 36 },
  { department: "Sales", referrals: 28, hires: 9, conversionRate: 32 },
  { department: "Product", referrals: 18, hires: 7, conversionRate: 39 },
  { department: "Design", referrals: 15, hires: 5, conversionRate: 33 },
]

const candidateSkillsData = [
  { skill: "Technical", score: 80 },
  { skill: "Communication", score: 65 },
  { skill: "Leadership", score: 70 },
  { skill: "Problem Solving", score: 85 },
  { skill: "Teamwork", score: 75 },
]

const predictiveMetrics = {
  hiringProbability: 78,
  fitScore: 82,
  retentionProbability: 75,
  performancePrediction: 80,
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#FF6B6B"]

export default function AdvancedAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
        <p className="text-muted-foreground">Comprehensive analytics with ML-powered insights and predictive metrics</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-auto" />

        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="design">Design</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          <TabsTrigger value="candidates">Candidate Insights</TabsTrigger>
          <TabsTrigger value="employees">Employee Profiles</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
          <TabsTrigger value="evaluation">Candidate Evaluation</TabsTrigger>
          <TabsTrigger value="engagement">Employee Engagement</TabsTrigger>
          <TabsTrigger value="reports">Custom Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72</div>
                <p className="text-xs text-muted-foreground">+18% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34.8%</div>
                <p className="text-xs text-muted-foreground">+2.3% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time to Hire</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18 days</div>
                <p className="text-xs text-muted-foreground">-3 days from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2/5</div>
                <p className="text-xs text-muted-foreground">+0.3 from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Referral Status Distribution</CardTitle>
                <CardDescription>Current distribution of referrals by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    status: {
                      label: "Status",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="aspect-square"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={referralsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {referralsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Trends</CardTitle>
                <CardDescription>Monthly referrals and successful hires</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    referrals: {
                      label: "Referrals",
                      color: "hsl(var(--chart-1))",
                    },
                    hires: {
                      label: "Hires",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="aspect-[4/3]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={referralTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="referrals" stroke="var(--color-referrals)" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="hires" stroke="var(--color-hires)" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Referrals, hires, and conversion rates by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  referrals: {
                    label: "Referrals",
                    color: "hsl(var(--chart-1))",
                  },
                  hires: {
                    label: "Hires",
                    color: "hsl(var(--chart-2))",
                  },
                  conversionRate: {
                    label: "Conversion Rate (%)",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="referrals" fill="var(--color-referrals)" />
                    <Bar yAxisId="left" dataKey="hires" fill="var(--color-hires)" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversionRate"
                      stroke="var(--color-conversionRate)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Probability</CardTitle>
                <CardDescription>ML-powered prediction of hiring success</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Probability</span>
                    <span className="text-sm font-medium">{predictiveMetrics.hiringProbability}%</span>
                  </div>
                  <Progress value={predictiveMetrics.hiringProbability} className="h-2" />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Key Factors</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Skill Match</span>
                      <Badge variant="outline">High Impact</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Interview Performance</span>
                      <Badge variant="outline">Medium Impact</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cultural Fit</span>
                      <Badge variant="outline">High Impact</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Candidate Fit Score</CardTitle>
                <CardDescription>Multi-dimensional analysis of candidate fit</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={candidateSkillsData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Candidate" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Retention & Performance Predictions</CardTitle>
              <CardDescription>Long-term success metrics based on historical data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Retention Probability</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">1-year retention</span>
                    <span className="text-sm font-medium">{predictiveMetrics.retentionProbability}%</span>
                  </div>
                  <Progress value={predictiveMetrics.retentionProbability} className="h-2" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Performance Prediction</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected performance</span>
                    <span className="text-sm font-medium">{predictiveMetrics.performancePrediction}%</span>
                  </div>
                  <Progress value={predictiveMetrics.performancePrediction} className="h-2" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">AI Recommendations</h4>
                <div className="space-y-2">
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm">
                      Based on the candidate's profile and interview performance, we recommend proceeding with an offer.
                      The candidate shows strong potential for growth and alignment with company values.
                    </p>
                  </div>
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm">
                      Consider pairing with a senior mentor in the Engineering department to maximize retention
                      probability and accelerate onboarding.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          {/* Department-specific analytics content */}
          <Card>
            <CardHeader>
              <CardTitle>Department Comparison</CardTitle>
              <CardDescription>Comparative analysis across departments</CardDescription>
            </CardHeader>
            <CardContent>{/* Department comparison charts and tables */}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="candidates" className="space-y-6">
          {/* Candidate-specific analytics content */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Insights</CardTitle>
              <CardDescription>Detailed analysis of candidate performance</CardDescription>
            </CardHeader>
            <CardContent>{/* Candidate insights charts and tables */}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {/* Enhanced Employee Profiles */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EmployeeProfileCard />
            <EmployeeProfileCard />
            <EmployeeProfileCard />
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          {/* Employee Feedback Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Analysis</CardTitle>
              <CardDescription>AI-powered sentiment analysis of rejection feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <SentimentAnalysisChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6">
          {/* Advanced Candidate Evaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Evaluation</CardTitle>
              <CardDescription>Detailed resume analysis with skill highlighting</CardDescription>
            </CardHeader>
            <CardContent>
              <CandidateEvaluationChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Employee Engagement Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Engagement</CardTitle>
              <CardDescription>Participation tracking and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeEngagementDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Custom Reports System */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Reports</CardTitle>
              <CardDescription>Comprehensive reporting on all metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomReportGenerator />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          {/* Real-Time Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Live notification system for status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <RealTimeNotificationSystem />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
