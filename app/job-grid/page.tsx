"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { JobGrid } from "@/components/job-grid"

export default function JobGridPage() {
  return (
    <DashboardLayout role="candidate">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Job Applications</h1>
          <p className="text-muted-foreground">
            Manage and track all your job applications with our AI-powered Kanban board
          </p>
        </div>
        <JobGrid />
      </div>
    </DashboardLayout>
  )
} 