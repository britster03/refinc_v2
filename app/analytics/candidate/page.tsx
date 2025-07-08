"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CandidateEvaluationChart } from "@/components/ui/candidate-evaluation-chart"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Users,
  CheckCircle,
  Target,
  Zap,
  Brain,
  Award,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export default function CandidateAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState("overview")

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => setIsLoading(false), 1500)
  }, [])

  // Enhanced mock data with more comprehensive analytics
  const referralStatusData = [
    { name: "Hired", value: 8, color: "#22c55e", percentage: 27 },
    { name: "Interview", value: 6, color: "#3b82f6", percentage: 20 },
    { name: "Accepted", value: 10, color: "#8b5cf6", percentage: 33 },
    { name: "Pending", value: 4, color: "#f59e0b", percentage: 13 },
    { name: "Rejected", value: 2, color: "#ef4444", percentage: 7 },
  ]

  const monthlyTrendsData = [
    { month: "Jan", referrals: 4, interviews: 2, hires: 1, applications: 12 },
    { month: "Feb", referrals: 6, interviews: 4, hires: 2, applications: 18 },
    { month: "Mar", referrals: 8, interviews: 5, hires: 3, applications: 22 },
    { month: "Apr", referrals: 12, interviews: 8, hires: 4, applications: 28 },
    { month: "May", referrals: 9, interviews: 6, hires: 2, applications: 25 },
    { month: "Jun", referrals: 15, interviews: 10, hires: 6, applications: 35 },
  ]

  const skillAnalysisData = [
    { skill: "Technical", score: 85, market: 92, growth: 15 },
    { skill: "Communication", score: 78, market: 85, growth: 8 },
    { skill: "Leadership", score: 72, market: 88, growth: 12 },
    { skill: "Problem Solving", score: 88, market: 90, growth: 10 },
    { skill: "Teamwork", score: 82, market: 87, growth: 6 },
    { skill: "Adaptability", score: 79, market: 89, growth: 18 },
  ]

  const companyInsightsData = [
    { name: "Tech Solutions Inc.", referrals: 12, success: 8, rate: 67, trend: "up" },
    { name: "Global Innovations", referrals: 8, success: 6, rate: 75, trend: "up" },
    { name: "Digital Creations", referrals: 6, success: 3, rate: 50, trend: "down" },
    { name: "Future Systems", referrals: 4, success: 3, rate: 75, trend: "stable" },
  ]

  const performanceMetrics = {
    totalReferrals: 30,
    acceptanceRate: 73,
    interviewRate: 47,
    hireRate: 27,
    averageResponseTime: "1.8 days",
    activeReferrals: 7,
    profileViews: 156,
    networkGrowth: 23,
  }

  const trends = {
    totalReferrals: { value: 8, percentage: 36, trend: "up" },
    acceptanceRate: { value: 5, percentage: 12, trend: "up" },
    averageResponseTime: { value: 0.3, percentage: 18, trend: "down" },
    activeReferrals: { value: 2, percentage: 40, trend: "up" },
  }

  const aiInsights = [
    {
      type: "opportunity",
      title: "High-Demand Skills Gap",
      description: "Your AWS skills are in high demand. Consider highlighting cloud experience more prominently.",
      action: "Update Profile",
      priority: "high",
    },
    {
      type: "trend",
      title: "Market Trend Alert",
      description: "TypeScript demand increased 25% this month. Your expertise positions you well.",
      action: "View Opportunities",
      priority: "medium",
    },
    {
      type: "performance",
      title: "Response Rate Optimization",
      description: "Referrals sent on Tuesday-Thursday have 40% higher acceptance rates.",
      action: "Schedule Better",
      priority: "low",
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-muted-foreground">Analyzing your data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="candidate">
      <motion.div className="flex flex-col gap-8" variants={staggerContainer} initial="initial" animate="animate">
        {/* Header */}
        <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" variants={fadeInUp}>
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your referral performance and discover insights to accelerate your career
            </p>
          </div>

          <div className="flex items-center gap-3">
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

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" variants={staggerContainer}>
          {[
            {
              title: "Total Referrals",
              value: performanceMetrics.totalReferrals,
              change: trends.totalReferrals,
              icon: Users,
              color: "from-blue-500 to-cyan-500",
            },
            {
              title: "Acceptance Rate",
              value: `${performanceMetrics.acceptanceRate}%`,
              change: trends.acceptanceRate,
              icon: CheckCircle,
              color: "from-green-500 to-emerald-500",
            },
            {
              title: "Interview Rate",
              value: `${performanceMetrics.interviewRate}%`,
              change: { value: 3, percentage: 8, trend: "up" },
              icon: Target,
              color: "from-purple-500 to-pink-500",
            },
            {
              title: "Hire Rate",
              value: `${performanceMetrics.hireRate}%`,
              change: { value: 2, percentage: 15, trend: "up" },
              icon: Award,
              color: "from-orange-500 to-red-500",
            },
          ].map((metric, index) => (
            <motion.div key={metric.title} variants={fadeInUp}>
              <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                <div
                  className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${metric.color} opacity-10 rounded-bl-full`}
                />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${metric.color}`}>
                    <metric.icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{metric.value}</div>
                  <div className="flex items-center text-sm">
                    {metric.change.trend === "up" ? (
                      <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={`font-medium ${metric.change.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                      {metric.change.percentage}%
                    </span>
                    <span className="text-muted-foreground ml-1">from last period</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Insights Banner */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Brain className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">AI-Powered Insights</h3>
                  <p className="text-white/90">
                    Your profile optimization score increased by 15% this week.
                    <Button variant="link" className="text-white underline p-0 ml-1 h-auto">
                      View recommendations →
                    </Button>
                  </p>
                </div>
                <Badge className="bg-white/20 text-white border-white/30">
                  <Zap className="w-3 h-3 mr-1" />
                  New
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Analytics Tabs */}
        <motion.div variants={fadeInUp}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-purple-50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="companies">Companies</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Referral Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Referral Status Distribution</CardTitle>
                    <CardDescription>Current status of all your referrals</CardDescription>
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
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                          >
                            {referralStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trends</CardTitle>
                    <CardDescription>Your referral activity over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrendsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="referrals"
                            stackId="1"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="interviews"
                            stackId="1"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="hires"
                            stackId="1"
                            stroke="#22c55e"
                            fill="#22c55e"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: "Profile Views", value: performanceMetrics.profileViews, icon: "👁️" },
                  { label: "Network Growth", value: `+${performanceMetrics.networkGrowth}`, icon: "🌐" },
                  { label: "Avg Response Time", value: performanceMetrics.averageResponseTime, icon: "⚡" },
                  { label: "Active Referrals", value: performanceMetrics.activeReferrals, icon: "🎯" },
                ].map((stat, index) => (
                  <Card key={stat.label} className="text-center">
                    <CardContent className="p-4">
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <CandidateEvaluationChart />
            </TabsContent>

            <TabsContent value="skills" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Skill Analysis Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Analysis</CardTitle>
                    <CardDescription>Your skills vs market demand</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={skillAnalysisData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="skill" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Your Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                          <Radar
                            name="Market Demand"
                            dataKey="market"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.1}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Skill Growth Opportunities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Opportunities</CardTitle>
                    <CardDescription>Skills with highest growth potential</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skillAnalysisData
                      .sort((a, b) => b.growth - a.growth)
                      .slice(0, 4)
                      .map((skill, index) => (
                        <div key={skill.skill} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                +{skill.growth}% growth
                              </Badge>
                              <span className="text-sm font-medium">{skill.score}/100</span>
                            </div>
                          </div>
                          <Progress value={skill.score} className="h-2" />
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Company Performance</CardTitle>
                  <CardDescription>Your referral success rate by company</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {companyInsightsData.map((company, index) => (
                    <div key={company.name} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{company.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {company.success} successful out of {company.referrals} referrals
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={
                              company.trend === "up"
                                ? "text-green-600 border-green-200"
                                : company.trend === "down"
                                  ? "text-red-600 border-red-200"
                                  : "text-gray-600 border-gray-200"
                            }
                          >
                            {company.rate}% success rate
                          </Badge>
                          <div className="text-sm">
                            {company.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                            {company.trend === "down" && <ArrowDown className="h-4 w-4 text-red-500" />}
                          </div>
                        </div>
                      </div>
                      <Progress value={company.rate} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      className={`border-l-4 ${
                        insight.priority === "high"
                          ? "border-l-red-500"
                          : insight.priority === "medium"
                            ? "border-l-yellow-500"
                            : "border-l-blue-500"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{insight.title}</h3>
                              <Badge
                                variant="outline"
                                className={
                                  insight.priority === "high"
                                    ? "text-red-600 border-red-200"
                                    : insight.priority === "medium"
                                      ? "text-yellow-600 border-yellow-200"
                                      : "text-blue-600 border-blue-200"
                                }
                              >
                                {insight.priority} priority
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">{insight.description}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            {insight.action}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
