"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { CustomReportGenerator } from "@/components/ui/custom-report-generator"
import { EmployeeEngagementDashboard } from "@/components/ui/employee-engagement-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, BarChart3, Download, Calendar } from "lucide-react"

const recentReports = [
  {
    id: 1,
    name: "Q1 2024 Performance Report",
    type: "Performance",
    generatedDate: "2024-03-31",
    size: "2.4 MB",
    format: "PDF",
    downloads: 23,
  },
  {
    id: 2,
    name: "Engineering Department Analysis",
    type: "Department",
    generatedDate: "2024-03-28",
    size: "1.8 MB",
    format: "Excel",
    downloads: 15,
  },
  {
    id: 3,
    name: "Diversity & Inclusion Metrics",
    type: "Diversity",
    generatedDate: "2024-03-25",
    size: "3.1 MB",
    format: "PDF",
    downloads: 31,
  },
]

export default function ReportsPage() {
  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and analyze engagement metrics across your organization
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">47</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
                <Download className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg File Size</p>
                  <p className="text-2xl font-bold">2.1 MB</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generator">Report Generator</TabsTrigger>
            <TabsTrigger value="engagement">Engagement Dashboard</TabsTrigger>
            <TabsTrigger value="recent">Recent Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="generator">
            <CustomReportGenerator />
          </TabsContent>

          <TabsContent value="engagement">
            <EmployeeEngagementDashboard />
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Your recently generated reports and analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{report.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Generated: {report.generatedDate}</span>
                            <span>Size: {report.size}</span>
                            <span>Downloads: {report.downloads}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{report.format}</Badge>
                        <Badge variant="secondary">{report.type}</Badge>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
