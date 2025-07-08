"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const sentimentData = [
  { name: "Positive", value: 65, color: "#22c55e" },
  { name: "Neutral", value: 25, color: "#6b7280" },
  { name: "Negative", value: 10, color: "#ef4444" },
]

const feedbackTrends = [
  { month: "Jan", positive: 60, neutral: 30, negative: 10 },
  { month: "Feb", positive: 65, neutral: 25, negative: 10 },
  { month: "Mar", positive: 70, neutral: 20, negative: 10 },
  { month: "Apr", positive: 68, neutral: 22, negative: 10 },
  { month: "May", positive: 72, neutral: 18, negative: 10 },
  { month: "Jun", positive: 75, neutral: 15, negative: 10 },
]

const keyThemes = [
  { theme: "Technical Skills", sentiment: "positive", mentions: 45, trend: "up" },
  { theme: "Communication", sentiment: "positive", mentions: 38, trend: "up" },
  { theme: "Experience Level", sentiment: "neutral", mentions: 22, trend: "stable" },
  { theme: "Cultural Fit", sentiment: "positive", mentions: 31, trend: "up" },
  { theme: "Availability", sentiment: "negative", mentions: 12, trend: "down" },
]

export function SentimentAnalysisChart() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Feedback Sentiment Distribution</CardTitle>
            <CardDescription>Overall sentiment analysis of rejection feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {sentimentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Trends</CardTitle>
            <CardDescription>Monthly sentiment analysis trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feedbackTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="positive" stackId="a" fill="#22c55e" />
                  <Bar dataKey="neutral" stackId="a" fill="#6b7280" />
                  <Bar dataKey="negative" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Themes Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Key Themes in Feedback</CardTitle>
          <CardDescription>Most mentioned topics and their sentiment analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keyThemes.map((theme, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{theme.theme}</h4>
                    <Badge
                      variant={
                        theme.sentiment === "positive"
                          ? "default"
                          : theme.sentiment === "negative"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {theme.sentiment}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{theme.mentions} mentions</span>
                </div>
                <div className="flex items-center space-x-2">
                  {theme.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {theme.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                  {theme.trend === "stable" && <Minus className="h-4 w-4 text-gray-600" />}
                  <span className="text-sm font-medium capitalize">{theme.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Key takeaways from feedback analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Positive Trends</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Technical skills feedback has improved by 15% this quarter</li>
                <li>• Communication skills are consistently praised across referrals</li>
                <li>• Cultural fit scores are trending upward</li>
              </ul>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Areas for Improvement</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Availability concerns mentioned in 12% of rejections</li>
                <li>• Consider highlighting flexible work arrangements</li>
                <li>• Experience level expectations may need clarification</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Focus on technical skill development programs</li>
                <li>• Improve job description clarity around experience requirements</li>
                <li>• Leverage strong communication skills in candidate profiles</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
