"use client"

import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  Calendar,
  Grid3X3,
  Home,
  MessageSquare,
  Settings,
  Target,
  TrendingUp,
  Bell,
  Download,
  Upload,
  Zap,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { JobGrid } from "@/components/job-grid"
import { AIResumeAnalyzer } from "@/components/ai-resume-analyzer"
import { JobMatchingEngine } from "@/components/job-matching-engine"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { CareerChatbot } from "@/components/career-chatbot"
import { NotificationCenter } from "@/components/notification-center"
import { PredictiveAnalytics } from "@/components/predictive-analytics"

const menuItems = [
  {
    title: "Dashboard",
    url: "#dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Job Grid",
    url: "#job-grid",
    icon: Grid3X3,
  },
  {
    title: "AI Resume Analyzer",
    url: "#resume-analyzer",
    icon: BrainCircuit,
  },
  {
    title: "Job Matching",
    url: "#job-matching",
    icon: Target,
  },
  {
    title: "Predictive Analytics",
    url: "#predictive-analytics",
    icon: TrendingUp,
  },
  {
    title: "Analytics",
    url: "#analytics",
    icon: BarChart3,
  },
  {
    title: "Career Coach",
    url: "#career-coach",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    url: "#notifications",
    icon: Bell,
  },
]

export default function JobSearchDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">JobHunter AI</h2>
                <p className="text-xs text-muted-foreground">Smart Job Search</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeTab === item.url.slice(1)}
                        onClick={() => setActiveTab(item.url.slice(1))}
                      >
                        <button className="w-full">
                          <item.icon />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john@example.com</p>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">
                    {activeTab === "dashboard" && "Dashboard"}
                    {activeTab === "job-grid" && "Job Applications"}
                    {activeTab === "resume-analyzer" && "AI Resume Analyzer"}
                    {activeTab === "job-matching" && "Job Matching Engine"}
                    {activeTab === "predictive-analytics" && "Predictive Analytics"}
                    {activeTab === "analytics" && "Analytics & Reports"}
                    {activeTab === "career-coach" && "Career Coach"}
                    {activeTab === "notifications" && "Notifications"}
                  </h1>
                  <p className="text-muted-foreground">
                    {activeTab === "dashboard" && "Your job search overview"}
                    {activeTab === "job-grid" && "Manage your job applications"}
                    {activeTab === "resume-analyzer" && "AI-powered resume optimization"}
                    {activeTab === "job-matching" && "Find your perfect job match"}
                    {activeTab === "predictive-analytics" && "AI-powered success predictions and insights"}
                    {activeTab === "analytics" && "Track your job search progress"}
                    {activeTab === "career-coach" && "Get personalized career advice"}
                    {activeTab === "notifications" && "Stay updated on your applications"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Jobs
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            {activeTab === "dashboard" && <DashboardOverview />}
            {activeTab === "job-grid" && <JobGrid />}
            {activeTab === "resume-analyzer" && <AIResumeAnalyzer />}
            {activeTab === "job-matching" && <JobMatchingEngine />}
            {activeTab === "predictive-analytics" && <PredictiveAnalytics />}
            {activeTab === "analytics" && <AnalyticsDashboard />}
            {activeTab === "career-coach" && <CareerChatbot />}
            {activeTab === "notifications" && <NotificationCenter />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 scheduled this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23%</div>
            <p className="text-xs text-muted-foreground">+5% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Match Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.7/10</div>
            <p className="text-xs text-muted-foreground">Excellent profile match</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              AI Insights
            </CardTitle>
            <CardDescription>Personalized recommendations to boost your job search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Resume Optimization</p>
                <p className="text-xs text-muted-foreground">
                  Add "React" and "TypeScript" skills to increase match rate by 15%
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Perfect Match Found</p>
                <p className="text-xs text-muted-foreground">Senior Frontend Developer at TechCorp (95% match)</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Follow-up Reminder</p>
                <p className="text-xs text-muted-foreground">3 applications need follow-up this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { company: "TechCorp", role: "Senior Frontend Developer", status: "interview", date: "2 days ago" },
                { company: "StartupXYZ", role: "Full Stack Engineer", status: "pending", date: "1 week ago" },
                { company: "BigTech Inc", role: "React Developer", status: "rejected", date: "2 weeks ago" },
                { company: "InnovateLab", role: "UI/UX Developer", status: "applied", date: "3 days ago" },
              ].map((app, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{app.company.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{app.role}</p>
                      <p className="text-xs text-muted-foreground">{app.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        app.status === "interview"
                          ? "default"
                          : app.status === "pending"
                            ? "secondary"
                            : app.status === "rejected"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {app.status === "interview" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {app.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {app.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {app.status === "applied" && <AlertCircle className="h-3 w-3 mr-1" />}
                      {app.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{app.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Job Search Progress</CardTitle>
          <CardDescription>Track your progress towards your job search goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Applications Goal</span>
                <span>127/150</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-muted-foreground">23 more to reach monthly goal</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Interview Conversion</span>
                <span>8/127</span>
              </div>
              <Progress value={23} className="h-2" />
              <p className="text-xs text-muted-foreground">Above average conversion rate</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Profile Completeness</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground">Add portfolio links to complete</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
