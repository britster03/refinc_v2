"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Star, TrendingUp, Download, Eye } from "lucide-react"

const skillsData = [
  { skill: "Technical Skills", candidate: 85, requirement: 80, market: 75 },
  { skill: "Communication", candidate: 90, requirement: 85, market: 70 },
  { skill: "Problem Solving", candidate: 88, requirement: 85, market: 78 },
  { skill: "Leadership", candidate: 75, requirement: 70, market: 65 },
  { skill: "Adaptability", candidate: 92, requirement: 80, market: 72 },
  { skill: "Domain Knowledge", candidate: 82, requirement: 85, market: 80 },
]

const experienceBreakdown = [
  { category: "Frontend Development", years: 4, proficiency: 90 },
  { category: "Backend Development", years: 2, proficiency: 70 },
  { category: "Cloud Technologies", years: 1, proficiency: 60 },
  { category: "Team Leadership", years: 1.5, proficiency: 75 },
  { category: "Project Management", years: 2, proficiency: 80 },
]

const candidateProfile = {
  name: "Alex Thompson",
  avatar: "/placeholder.svg?height=64&width=64",
  position: "Senior Full Stack Developer",
  overallScore: 87,
  matchPercentage: 92,
  salaryExpectation: "$140,000",
  availability: "2 weeks notice",
  location: "San Francisco, CA",
}

export function CandidateEvaluationChart() {
  return (
    <div className="space-y-6">
      {/* Candidate Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={candidateProfile.avatar || "/placeholder.svg"} alt={candidateProfile.name} />
                <AvatarFallback>
                  {candidateProfile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  <h3 className="text-xl font-semibold">{candidateProfile.name}</h3>
                  <p className="text-muted-foreground">{candidateProfile.position}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{candidateProfile.overallScore}/100</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {candidateProfile.matchPercentage}% Match
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View Resume
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{candidateProfile.matchPercentage}%</div>
              <div className="text-sm text-muted-foreground">Job Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{candidateProfile.salaryExpectation}</div>
              <div className="text-sm text-muted-foreground">Salary Expectation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{candidateProfile.availability}</div>
              <div className="text-sm text-muted-foreground">Availability</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{candidateProfile.location}</div>
              <div className="text-sm text-muted-foreground">Location</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Skills Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Assessment</CardTitle>
            <CardDescription>Candidate skills vs job requirements and market average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                  <Radar
                    name="Candidate"
                    dataKey="candidate"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Requirement"
                    dataKey="requirement"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Radar
                    name="Market Average"
                    dataKey="market"
                    stroke="#6b7280"
                    fill="#6b7280"
                    fillOpacity={0.1}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Experience Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Experience Analysis</CardTitle>
            <CardDescription>Years of experience and proficiency by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experienceBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="category" type="category" width={120} className="text-xs" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "proficiency" ? `${value}%` : `${value} years`,
                      name === "proficiency" ? "Proficiency" : "Experience",
                    ]}
                  />
                  <Bar dataKey="proficiency" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Skills Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Skills Analysis</CardTitle>
          <CardDescription>Individual skill assessment with gap analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skillsData.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{skill.skill}</h4>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">Candidate: {skill.candidate}%</span>
                    <span className="text-sm text-muted-foreground">Required: {skill.requirement}%</span>
                    {skill.candidate >= skill.requirement ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Exceeds
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Gap: {skill.requirement - skill.candidate}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={skill.candidate} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span className="text-red-500">Required: {skill.requirement}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Recommendations</CardTitle>
          <CardDescription>Intelligent insights and next steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium text-green-800">Strengths to Leverage</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                  <span>Exceptional communication skills (90% vs 85% required)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                  <span>High adaptability score indicates strong learning potential</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                  <span>Technical skills exceed market average by 10%</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-yellow-800">Development Areas</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5" />
                  <span>Domain knowledge gap of 3% - consider mentoring program</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5" />
                  <span>Backend development experience could be strengthened</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5" />
                  <span>Cloud technologies proficiency below team average</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Interview Recommendations</h4>
            <div className="grid gap-2 md:grid-cols-2 text-sm text-blue-700">
              <div>
                <strong>Focus Areas:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• System design and architecture</li>
                  <li>• Problem-solving methodology</li>
                  <li>• Team collaboration examples</li>
                </ul>
              </div>
              <div>
                <strong>Questions to Ask:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Experience with cloud migration projects</li>
                  <li>• Leadership style and mentoring approach</li>
                  <li>• Handling of technical debt scenarios</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
