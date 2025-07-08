"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Download, FileText, BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react"
import type { DateRange } from "react-day-picker"

interface ReportConfig {
  name: string
  description: string
  dateRange: DateRange | undefined
  departments: string[]
  metrics: string[]
  format: "pdf" | "excel" | "csv"
  schedule: "once" | "daily" | "weekly" | "monthly"
  recipients: string[]
}

const availableMetrics = [
  { id: "referrals", label: "Total Referrals", category: "volume" },
  { id: "success_rate", label: "Success Rate", category: "performance" },
  { id: "time_to_hire", label: "Time to Hire", category: "efficiency" },
  { id: "candidate_satisfaction", label: "Candidate Satisfaction", category: "quality" },
  { id: "employee_engagement", label: "Employee Engagement", category: "engagement" },
  { id: "conversion_rate", label: "Conversion Rate", category: "performance" },
  { id: "cost_per_hire", label: "Cost per Hire", category: "efficiency" },
  { id: "diversity_metrics", label: "Diversity Metrics", category: "diversity" },
]

const departments = ["Engineering", "Product", "Design", "Marketing", "Sales", "HR", "Finance", "Operations"]

const savedReports = [
  {
    id: 1,
    name: "Monthly Executive Summary",
    description: "High-level metrics for leadership team",
    lastRun: "2024-01-15",
    schedule: "monthly",
    recipients: 3,
  },
  {
    id: 2,
    name: "Engineering Referral Performance",
    description: "Detailed analysis of engineering department referrals",
    lastRun: "2024-01-14",
    schedule: "weekly",
    recipients: 5,
  },
  {
    id: 3,
    name: "Diversity & Inclusion Report",
    description: "Comprehensive diversity metrics across all departments",
    lastRun: "2024-01-10",
    schedule: "monthly",
    recipients: 8,
  },
]

export function CustomReportGenerator() {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: "",
    description: "",
    dateRange: undefined,
    departments: [],
    metrics: [],
    format: "pdf",
    schedule: "once",
    recipients: [],
  })

  const [newRecipient, setNewRecipient] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleMetricToggle = (metricId: string) => {
    setReportConfig((prev) => ({
      ...prev,
      metrics: prev.metrics.includes(metricId)
        ? prev.metrics.filter((m) => m !== metricId)
        : [...prev.metrics, metricId],
    }))
  }

  const handleDepartmentToggle = (department: string) => {
    setReportConfig((prev) => ({
      ...prev,
      departments: prev.departments.includes(department)
        ? prev.departments.filter((d) => d !== department)
        : [...prev.departments, department],
    }))
  }

  const addRecipient = () => {
    if (newRecipient && !reportConfig.recipients.includes(newRecipient)) {
      setReportConfig((prev) => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient],
      }))
      setNewRecipient("")
    }
  }

  const removeRecipient = (email: string) => {
    setReportConfig((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }))
  }

  const generateReport = async () => {
    setIsGenerating(true)
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsGenerating(false)
    // In a real app, this would trigger the actual report generation
    console.log("Generating report with config:", reportConfig)
  }

  const metricsByCategory = availableMetrics.reduce(
    (acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = []
      }
      acc[metric.category].push(metric)
      return acc
    },
    {} as Record<string, typeof availableMetrics>,
  )

  return (
    <div className="space-y-6">
      {/* Saved Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Reports</CardTitle>
          <CardDescription>Previously configured reports and templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savedReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Last run: {report.lastRun}</span>
                    <span>Schedule: {report.schedule}</span>
                    <span>{report.recipients} recipients</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Run Now
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Report</CardTitle>
          <CardDescription>Build a comprehensive report with your selected metrics and filters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="e.g., Q1 Performance Report"
                value={reportConfig.name}
                onChange={(e) => setReportConfig((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-format">Format</Label>
              <Select
                value={reportConfig.format}
                onValueChange={(value: any) => setReportConfig((prev) => ({ ...prev, format: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-description">Description</Label>
            <Textarea
              id="report-description"
              placeholder="Brief description of the report purpose and audience"
              value={reportConfig.description}
              onChange={(e) => setReportConfig((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <DatePickerWithRange
              date={reportConfig.dateRange}
              setDate={(date) => setReportConfig((prev) => ({ ...prev, dateRange: date }))}
            />
          </div>

          <Separator />

          {/* Departments */}
          <div className="space-y-4">
            <Label>Departments</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {departments.map((department) => (
                <div key={department} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${department}`}
                    checked={reportConfig.departments.includes(department)}
                    onCheckedChange={() => handleDepartmentToggle(department)}
                  />
                  <Label htmlFor={`dept-${department}`} className="text-sm">
                    {department}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Metrics Selection */}
          <div className="space-y-4">
            <Label>Metrics to Include</Label>
            {Object.entries(metricsByCategory).map(([category, metrics]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium capitalize text-muted-foreground">
                  {category.replace("_", " ")} Metrics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`metric-${metric.id}`}
                        checked={reportConfig.metrics.includes(metric.id)}
                        onCheckedChange={() => handleMetricToggle(metric.id)}
                      />
                      <Label htmlFor={`metric-${metric.id}`} className="text-sm">
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Schedule and Recipients */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select
                value={reportConfig.schedule}
                onValueChange={(value: any) => setReportConfig((prev) => ({ ...prev, schedule: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Run Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="email@company.com"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addRecipient()}
                />
                <Button variant="outline" onClick={addRecipient}>
                  Add
                </Button>
              </div>
              {reportConfig.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reportConfig.recipients.map((email) => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button onClick={() => removeRecipient(email)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Save Template
              </Button>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            <Button
              onClick={generateReport}
              disabled={isGenerating || !reportConfig.name || reportConfig.metrics.length === 0}
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Pre-configured reports for common use cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Executive Dashboard</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">High-level KPIs and trends for leadership team</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  Success Rate
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Volume
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Efficiency
                </Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center space-x-2 mb-2">
                <PieChart className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Department Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Detailed breakdown by department and team</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  By Department
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Performance
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Engagement
                </Badge>
              </div>
            </div>

            <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium">Trend Analysis</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Historical trends and predictive insights</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  Time Series
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Predictions
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Seasonality
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
