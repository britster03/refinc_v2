"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  Target,
  Brain,
  Zap,
  Calendar,
  DollarSign,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Sparkles,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

// Mock data for predictions
const successPredictionData = [
  { month: "Jan", predicted: 15, actual: 12 },
  { month: "Feb", predicted: 18, actual: 16 },
  { month: "Mar", predicted: 22, actual: 25 },
  { month: "Apr", predicted: 28, actual: 24 },
  { month: "May", predicted: 25, actual: 28 },
  { month: "Jun", predicted: 30, actual: null },
  { month: "Jul", predicted: 35, actual: null },
]

const skillDemandData = [
  { skill: "React", demand: 95, growth: 12 },
  { skill: "TypeScript", demand: 88, growth: 25 },
  { skill: "Node.js", demand: 82, growth: 8 },
  { skill: "Python", demand: 78, growth: 15 },
  { skill: "AWS", demand: 75, growth: 22 },
  { skill: "Docker", demand: 68, growth: 18 },
]

const salaryPredictionData = [
  { experience: "0-2 years", current: 85000, predicted: 92000, market: 88000 },
  { experience: "2-5 years", current: 110000, predicted: 125000, market: 118000 },
  { experience: "5-8 years", current: 140000, predicted: 165000, market: 155000 },
  { experience: "8+ years", current: 180000, predicted: 210000, market: 195000 },
]

const jobMarketTrends = [
  { category: "Remote Work", percentage: 78, trend: "up" },
  { category: "AI/ML Roles", percentage: 45, trend: "up" },
  { category: "Startup Jobs", percentage: 32, trend: "down" },
  { category: "Enterprise", percentage: 68, trend: "stable" },
]

const personalizedInsights = [
  {
    type: "opportunity",
    title: "High-Probability Match Detected",
    description:
      "Based on your profile, you have an 87% success probability with Senior Frontend roles at mid-size companies",
    impact: "high",
    action: "Focus applications on companies with 100-500 employees",
  },
  {
    type: "skill",
    title: "Skill Gap Analysis",
    description: "Adding TypeScript to your skillset could increase your match rate by 23%",
    impact: "medium",
    action: "Complete TypeScript certification within 2 weeks",
  },
  {
    type: "timing",
    title: "Optimal Application Timing",
    description: "Tuesday applications show 31% higher response rates in your target companies",
    impact: "low",
    action: "Schedule applications for Tuesday mornings",
  },
  {
    type: "salary",
    title: "Salary Negotiation Opportunity",
    description: "Your target salary is 15% below market rate for your experience level",
    impact: "high",
    action: "Increase salary expectations to $135k-$155k range",
  },
]

const competitorAnalysis = [
  { metric: "Applications/Week", you: 8, average: 12, top10: 18 },
  { metric: "Response Rate", you: 23, average: 18, top10: 35 },
  { metric: "Interview Rate", you: 17, average: 15, top10: 28 },
  { metric: "Offer Rate", you: 6, average: 8, top10: 15 },
]

const profileStrengthData = [
  { category: "Technical Skills", score: 85 },
  { category: "Experience Match", score: 78 },
  { category: "Education", score: 92 },
  { category: "Portfolio", score: 68 },
  { category: "Certifications", score: 45 },
  { category: "Network", score: 72 },
]

export function PredictiveAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("3months")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Predictive Analytics</h2>
            <p className="text-muted-foreground">AI-powered insights to optimize your job search success</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Refresh Predictions
          </Button>
        </div>
      </div>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Probability</p>
                <p className="text-2xl font-bold text-green-600">78%</p>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expected Interviews</p>
                <p className="text-2xl font-bold text-blue-600">5-7</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Salary Potential</p>
                <p className="text-2xl font-bold text-purple-600">$145k</p>
                <p className="text-xs text-muted-foreground">Predicted offer</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time to Offer</p>
                <p className="text-2xl font-bold text-orange-600">6-8</p>
                <p className="text-xs text-muted-foreground">Weeks</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="market">Market Trends</TabsTrigger>
          <TabsTrigger value="profile">Profile Analysis</TabsTrigger>
          <TabsTrigger value="competitor">Benchmarking</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Success Rate Prediction
                </CardTitle>
                <CardDescription>Predicted vs actual interview success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={successPredictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Predicted"
                      strokeDasharray="5 5"
                    />
                    <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Salary Predictions
                </CardTitle>
                <CardDescription>Expected salary ranges by experience level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salaryPredictionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="experience" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="current" fill="#94a3b8" name="Current" />
                    <Bar dataKey="predicted" fill="#3b82f6" name="Predicted" />
                    <Bar dataKey="market" fill="#10b981" name="Market" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Skill Demand Forecast
              </CardTitle>
              <CardDescription>Trending skills and their projected demand growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillDemandData.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{skill.skill}</span>
                        <Badge variant={skill.growth > 15 ? "default" : "secondary"}>+{skill.growth}% growth</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{skill.demand}% demand</span>
                    </div>
                    <Progress value={skill.demand} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              These insights are generated using machine learning models trained on 100,000+ job applications and market
              data.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {personalizedInsights.map((insight, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge
                          variant={
                            insight.impact === "high"
                              ? "destructive"
                              : insight.impact === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Recommended Action:</span>
                        <span className="text-sm">{insight.action}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>Personalized strategies to improve your success rate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Optimize Application Timing</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Apply on Tuesdays between 10-11 AM for 31% higher response rates
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Focus on Mid-Size Companies</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Companies with 100-500 employees show 45% higher success rates for your profile
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Skill Enhancement</span>
                  </div>
                  <p className="text-sm text-purple-700">
                    Adding AWS certification could increase your salary potential by $15k
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">Application Volume</span>
                  </div>
                  <p className="text-sm text-orange-700">Increase weekly applications to 12-15 for optimal results</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Job Market Trends
                </CardTitle>
                <CardDescription>Current trends in your target market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobMarketTrends.map((trend) => (
                  <div key={trend.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trend.category}</span>
                      <Badge
                        variant={
                          trend.trend === "up" ? "default" : trend.trend === "down" ? "destructive" : "secondary"
                        }
                      >
                        {trend.trend === "up" ? "↗" : trend.trend === "down" ? "↘" : "→"} {trend.trend}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={trend.percentage} className="w-20 h-2" />
                      <span className="text-sm font-medium">{trend.percentage}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Industry Distribution
                </CardTitle>
                <CardDescription>Job opportunities by industry sector</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: "Tech", value: 35, color: "#3b82f6" },
                        { name: "Finance", value: 25, color: "#10b981" },
                        { name: "Healthcare", value: 20, color: "#f59e0b" },
                        { name: "E-commerce", value: 12, color: "#ef4444" },
                        { name: "Other", value: 8, color: "#8b5cf6" },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: "Tech", value: 35, color: "#3b82f6" },
                        { name: "Finance", value: 25, color: "#10b981" },
                        { name: "Healthcare", value: 20, color: "#f59e0b" },
                        { name: "E-commerce", value: 12, color: "#ef4444" },
                        { name: "Other", value: 8, color: "#8b5cf6" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Market Intelligence</CardTitle>
              <CardDescription>Key insights about the current job market</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">23%</div>
                  <p className="text-sm text-muted-foreground">Increase in remote positions</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">$125k</div>
                  <p className="text-sm text-muted-foreground">Average salary in your field</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">18 days</div>
                  <p className="text-sm text-muted-foreground">Average hiring timeline</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Profile Strength Analysis
              </CardTitle>
              <CardDescription>How your profile compares across key dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={profileStrengthData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Your Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
                <CardDescription>Your competitive advantages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Strong educational background (92/100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Excellent technical skills (85/100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Good experience match (78/100)</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
                <CardDescription>Focus areas for better results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Portfolio needs enhancement (68/100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Limited certifications (45/100)</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Professional network could be stronger (72/100)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Performance Benchmarking
              </CardTitle>
              <CardDescription>How you compare to other job seekers in your field</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {competitorAnalysis.map((metric) => (
                  <div key={metric.metric} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric.metric}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-600 font-medium">You: {metric.you}%</span>
                        <span className="text-gray-600">Avg: {metric.average}%</span>
                        <span className="text-green-600">Top 10%: {metric.top10}%</span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={100} className="h-3 bg-gray-200" />
                      <div
                        className="absolute top-0 h-3 bg-blue-500 rounded-full"
                        style={{ width: `${(metric.you / metric.top10) * 100}%` }}
                      />
                      <div
                        className="absolute top-0 w-1 h-3 bg-gray-600"
                        style={{ left: `${(metric.average / metric.top10) * 100}%` }}
                      />
                      <div className="absolute top-0 right-0 w-1 h-3 bg-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">67th</div>
                  <p className="text-sm text-muted-foreground">Percentile Ranking</p>
                  <p className="text-xs text-muted-foreground mt-1">Above average performance</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+15%</div>
                  <p className="text-sm text-muted-foreground">Above Market Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">Response rate improvement</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">3.2x</div>
                  <p className="text-sm text-muted-foreground">Success Multiplier</p>
                  <p className="text-xs text-muted-foreground mt-1">Vs. bottom quartile</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommendation:</strong> Focus on improving your application volume and portfolio quality to reach
              top 10% performance. Consider increasing weekly applications to 15+ and adding 2-3 portfolio projects.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}
