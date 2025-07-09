"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react"

const jobApplications = [
  {
    id: 1,
    company: "TechCorp",
    role: "Senior Frontend Developer",
    location: "San Francisco, CA",
    salary: "$120k - $150k",
    status: "interview",
    appliedDate: "2024-01-15",
    lastUpdate: "2024-01-20",
    matchScore: 95,
    url: "https://techcorp.com/jobs/123",
    notes: "Great company culture, remote-friendly",
  },
  {
    id: 2,
    company: "StartupXYZ",
    role: "Full Stack Engineer",
    location: "New York, NY",
    salary: "$100k - $130k",
    status: "pending",
    appliedDate: "2024-01-10",
    lastUpdate: "2024-01-10",
    matchScore: 87,
    url: "https://startupxyz.com/careers/456",
    notes: "Fast-growing startup, equity options",
  },
  {
    id: 3,
    company: "BigTech Inc",
    role: "React Developer",
    location: "Seattle, WA",
    salary: "$110k - $140k",
    status: "rejected",
    appliedDate: "2024-01-05",
    lastUpdate: "2024-01-18",
    matchScore: 78,
    url: "https://bigtech.com/jobs/789",
    notes: "Competitive process, good benefits",
  },
  {
    id: 4,
    company: "InnovateLab",
    role: "UI/UX Developer",
    location: "Austin, TX",
    salary: "$90k - $120k",
    status: "applied",
    appliedDate: "2024-01-18",
    lastUpdate: "2024-01-18",
    matchScore: 92,
    url: "https://innovatelab.com/careers/101",
    notes: "Design-focused role, creative environment",
  },
]

export { AdvancedJobGrid as JobGrid }

function AddJobForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="Company name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Job Title</Label>
          <Input id="role" placeholder="Job title" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="City, State" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salary">Salary Range</Label>
          <Input id="salary" placeholder="$80k - $120k" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Job URL</Label>
        <Input id="url" placeholder="https://company.com/jobs/123" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Add any notes about this application..." />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Add Application</Button>
      </div>
    </form>
  )
}

function AdvancedJobGrid() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedJob, setSelectedJob] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredJobs = jobApplications.filter((job) => {
    const matchesSearch =
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "interview":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "applied":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "interview":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "applied":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Job Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Job Application</DialogTitle>
              <DialogDescription>Add a new job application to track your progress</DialogDescription>
            </DialogHeader>
            <AddJobForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Job Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Applications ({filteredJobs.length})</CardTitle>
          <CardDescription>Manage and track all your job applications in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company & Role</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Match Score</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{job.company}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{job.role}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{job.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{job.salary}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(job.status)}
                          {job.status}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{job.matchScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{job.appliedDate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedJob(job)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
