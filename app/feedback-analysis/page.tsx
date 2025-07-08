"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

// Mock data
const sentimentTrends = [
  { month: "Jan", positive: 65, negative: 15, neutral: 20 },
  { month: "Feb", positive: 68, negative: 12, neutral: 20 },
  { month: "Mar", positive: 75, negative: 10, neutral: 15 },
  { month: "Apr", positive: 72, negative: 18, neutral: 10 },
  { month: "May", positive: 78, negative: 12, neutral: 10 },
  { month: "Jun", positive: 82, negative: 8, neutral: 10 },
]

const feedbackCategories = [
  { name: "Technical Skills", value: 35 },
  { name: "Communication", value: 25 },
  { name: "Cultural Fit", value: 20 },
  { name: "Problem Solving", value: 15 },
  { name: "Leadership", value: 5 },
]

const keywordData = [
  { keyword: "Experienced", count: 42, sentiment: "positive" },
  { keyword: "Knowledgeable", count: 38, sentiment: "positive" },
  { keyword: "Professional", count: 35, sentiment: "positive" },
  { keyword: "Collaborative", count: 30, sentiment: "positive" },
  { keyword: "Unprepared", count: 12, sentiment: "negative" },
  { keyword: "Confused", count: 10, sentiment: "negative" },
  { keyword: "Nervous", count: 8, sentiment: "negative" },
  { keyword: "Late", count: 5, sentiment: "negative" },
]

const recentFeedback = [
  {
    id: "1",
    candidateName: "John Smith",
    position: "Senior Developer",
    date: "2023-06-15",
    sentiment: "positive",
    score: 4.8,
    comment:
      "Excellent technical skills and great cultural fit. Demonstrated strong problem-solving abilities during the interview.",
  },
  {
    id: "2",
    candidateName: "Sarah Johnson",
    position: "Product Manager",
    date: "2023-06-12",
    sentiment: "positive",
    score: 4.5,
    comment: "Strong communication skills and product knowledge. Would be a great addition to the team.",
  },
  {
    id: "3",
    candidateName: "Michael Brown",
    position: "UX Designer",
    date: "2023-06-10",
    sentiment: "neutral",
    score: 3.5,
    comment: "Good design skills but limited experience with our specific tools. May need additional training.",
  },
  {
    id: "4",
    candidateName: "Emily Davis",
    position: "Marketing Specialist",
    date: "2023-06-08",
    sentiment: "negative",
    score: 2.2,
    comment: "Seemed unprepared for the interview and couldn't answer basic marketing questions.",
  },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function FeedbackAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredFeedback = recentFeedback.filter(feedback => 
    feedback.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feedback.comment.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "negative":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Feedback Analysis</h1>
        <p className="text-muted-foreground">
          AI-powered sentiment analysis and insights from candidate feedback
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78% Positive</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2/5</div>
            <p className="text-xs text-muted-foreground">
              +0.3 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              +24 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              +3% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="keywords">Keyword Analysis</TabsTrigger>
          <TabsTrigger value="feedback">Recent Feedback</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Trends</CardTitle>
                <CardDescription>
                  Monthly sentiment analysis trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    positive: {
                      label: "Positive",
                      color: "hsl(var(--success))",
                    },
                    negative: {
                      label: "Negative",
                      color: "hsl(var(--destructive))",
                    },
                    neutral: {
                      label: "Neutral",
                      color: "hsl(var(--muted))",
                    },
                  }}
                  className="aspect-[4/3]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentTrends} stackOffset="expand">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="positive" stackId="a" fill="var(--color-positive)" />
                      <Bar dataKey="negative" stackId="a" fill="var(--color-negative)" />
                      <Bar dataKey="neutral" stackId="a" fill="var(--color-neutral)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Feedback Categories</CardTitle>
                <CardDescription>
                  Distribution of feedback by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="aspect-square">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feedbackCategories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {feedbackCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
              <CardDescription>
                Overall sentiment distribution across all feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span className="text-sm font-medium">Positive</span>
                  </span>
                  <span className="text-sm font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2 bg-muted" indicatorClassName="bg-green-500" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                    <span className="text-sm font-medium">Neutral</span>
                  </span>
                  <span className="text-sm font-medium">12%</span>
                </div>
                <Progress value={12} className="h-2 bg-muted" indicatorClassName="bg-gray-400" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="text-sm font-medium">Negative</span>
                  </span>
                  <span className="text-sm font-medium">10%</span>
                </div>
                <Progress value={10} className="h-2 bg-muted" indicatorClassName="bg-red-500" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sentiment" className="space-y-6">
          {/* Sentiment analysis content */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Sentiment Analysis</CardTitle>
              <CardDescription>
                AI-powered sentiment analysis of feedback comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Sentiment analysis charts and tables */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Analysis</CardTitle>
              <CardDescription>
                Most common keywords extracted from feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {keywordData.map((keyword) => (
                    <Badge 
                      key={keyword.keyword}
                      variant="outline"
                      className={`text-sm py-1 px-3 ${
                        keyword.sentiment === 'positive' 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {keyword.keyword} ({keyword.count})
                    </Badge>
                  ))}
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-4 text-sm font-medium">Positive Keywords</h4>
                    <div className="space-y-2">
                      {keywordData
                        .filter(k => k.sentiment === 'positive')
                        .map((keyword) => (
                          <div key={keyword.keyword} className="flex items-center justify-between">
                            <span className="text-sm">{keyword.keyword}</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={keyword.count} 
                                max={50} 
                                className="h-2 w-24 bg-muted" 
                                indicatorClassName="bg-green-500" 
                              />
                              <span className="text-xs">{keyword.count}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="mb-4 text-sm font-medium">Negative Keywords</h4>
                    <div className="space-y-2">
                      {keywordData
                        .filter(k => k.sentiment === 'negative')
                        .map((keyword) => (
                          <div key={keyword.keyword} className="flex items-center justify-between">
                            <span className="text-sm">{keyword.keyword}</span>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={keyword.count} 
                                max={50} 
                                className="h-2 w-24 bg-muted" 
                                indicatorClassName="bg-red-500" 
                              />
                              <span className="text-xs">{keyword.count}</span>
                            </div>
                          </div>
                        ))
                      }
                    </div\
