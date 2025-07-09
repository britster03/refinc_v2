"use client"

import { useState, useEffect } from "react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Users,
  Brain,
  TrendingUp,
  MoreHorizontal,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  UserPlus,
  MessageSquare,
  Zap,
  Eye
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Types
interface JobApplication {
  id: number
  company: string
  position: string
  department?: string
  location?: string
  salary_range?: string
  job_url?: string
  job_description?: string
  status: 'not_applied' | 'applied' | 'pending' | 'interview' | 'rejected' | 'hired'
  applied_date?: string
  last_status_update: string
  ai_match_score?: number
  ai_analysis_data?: any
  source: 'ai_recommendation' | 'manual_entry' | 'referral_opportunity'
  notes?: string
  interview_date?: string
  offer_date?: string
  rejection_date?: string
  rejection_reason?: string
  referral_id?: number
  referral_employee_id?: number
  referral_status?: string
  created_at: string
  updated_at: string
  referral_employee?: any
}

interface Employee {
  id: number
  name: string
  email: string
  avatar_url?: string
  position?: string
  company?: string
  department?: string
  rating?: number
}

// Add Job Form Component
function AddJobForm({ onClose, onAdd }: { onClose: () => void, onAdd: (job: Partial<JobApplication>) => void }) {
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    location: '',
    salary_range: '',
    job_url: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      ...formData,
      status: 'not_applied',
      last_status_update: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company and Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-semibold text-slate-700">
              Company *
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                id="company" 
                placeholder="e.g. Google, Microsoft"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all"
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-semibold text-slate-700">
              Job Title *
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                id="position" 
                placeholder="e.g. Senior Software Engineer"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all"
                required 
              />
            </div>
          </div>
        </div>

        {/* Location and Salary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-semibold text-slate-700">
              Location
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                id="location" 
                placeholder="e.g. San Francisco, CA"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salary_range" className="text-sm font-semibold text-slate-700">
              Salary Range
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                id="salary_range" 
                placeholder="e.g. $120k - $150k"
                value={formData.salary_range}
                onChange={(e) => handleInputChange('salary_range', e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Job URL */}
        <div className="space-y-2">
          <Label htmlFor="job_url" className="text-sm font-semibold text-slate-700">
            Job Posting URL
          </Label>
          <div className="relative">
            <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              id="job_url" 
              placeholder="https://company.com/jobs/123"
              value={formData.job_url}
              onChange={(e) => handleInputChange('job_url', e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-semibold text-slate-700">
            Notes
          </Label>
          <Textarea 
            id="notes" 
            placeholder="Add any notes about this position, requirements, or application strategy..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="min-h-[100px] bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 transition-all resize-none"
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="flex-1 bg-white hover:bg-slate-50 border-slate-300"
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={!formData.company || !formData.position}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Job Application
          </Button>
        </div>
      </form>
    </div>
  )
}

// Main Job Grid Component
export function JobGrid() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const { toast } = useToast()

  // Load jobs
  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/job-applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`)
      }
      
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
      // Fall back to mock data for now if API fails
      setJobs(mockJobs)
      toast({
        title: "API Error",
        description: "Using demo data. Check backend connection.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddJob = async (jobData: Partial<JobApplication>) => {
    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...jobData,
          source: 'manual_entry'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create job: ${response.statusText}`)
      }

      const newJob = await response.json()
      setJobs(prev => [...prev, newJob])
      
      toast({
        title: "Job Added",
        description: `${jobData.position} at ${jobData.company} has been added to your job board`
      })
    } catch (error) {
      console.error('Failed to create job:', error)
      toast({
        title: "Creation Failed",
        description: "Failed to create job application. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteJob = async (jobId: number) => {
    try {
      const response = await fetch(`/api/job-applications/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`)
      }

      setJobs(prev => prev.filter(job => job.id !== jobId))
      toast({
        title: "Job Deleted",
        description: "Job application has been removed from your board"
      })
    } catch (error) {
      console.error('Failed to delete job:', error)
      toast({
        title: "Deletion Failed",
        description: "Failed to delete job application. Please try again.",
        variant: "destructive"
      })
    }
  }

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/job-applications/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(`Failed to update job status: ${response.statusText}`)
      }

      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: newStatus as any,
              last_status_update: new Date().toISOString(),
              applied_date: newStatus === 'applied' && !job.applied_date ? new Date().toISOString() : job.applied_date
            }
          : job
      ))

      toast({
        title: "Status Updated",
        description: `Job status changed to ${newStatus.replace('_', ' ')}`
      })
    } catch (error) {
      console.error('Failed to update job status:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update job status. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'not_applied': { label: 'Not Applied', color: 'bg-slate-100 text-slate-800 border-slate-200' },
      'applied': { label: 'Applied', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'pending': { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'interview': { label: 'Interview', color: 'bg-green-100 text-green-800 border-green-200' },
      'rejected': { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
      'hired': { label: 'Hired', color: 'bg-purple-100 text-purple-800 border-purple-200' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_applied

    return (
      <Badge className={`${config.color} border`}>
        {config.label}
      </Badge>
    )
  }

  const getMatchScoreColor = (score?: number) => {
    if (!score) return "text-slate-400"
    if (score >= 90) return "text-emerald-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-amber-600"
    return "text-rose-600"
  }

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.position.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || job.status === statusFilter
    const matchesSource = sourceFilter === "all" || job.source === sourceFilter
    return matchesSearch && matchesStatus && matchesSource
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your job applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search jobs or companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-400">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_applied">Not Applied</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-44 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-blue-400">
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="ai_recommendation">AI Recommended</SelectItem>
              <SelectItem value="manual_entry">Manual Entry</SelectItem>
              <SelectItem value="referral_opportunity">Referral</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-indigo-300">
            <Brain className="h-4 w-4 mr-2 text-indigo-600" />
            AI Recommendations
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Add Job Application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Job Application</DialogTitle>
                <DialogDescription>Add a new job to track in your application pipeline</DialogDescription>
              </DialogHeader>
              <AddJobForm onClose={() => setIsAddDialogOpen(false)} onAdd={handleAddJob} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Job Applications Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-white border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-900">
            Job Applications ({filteredJobs.length})
          </CardTitle>
          <CardDescription className="text-slate-600">
            Manage and track all your job applications in one place
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">Company & Role</TableHead>
                  <TableHead className="font-semibold text-slate-700">Location</TableHead>
                  <TableHead className="font-semibold text-slate-700">Salary</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700">Match Score</TableHead>
                  <TableHead className="font-semibold text-slate-700">Applied Date</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <Building2 className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{job.company}</div>
                          <div className="text-sm text-slate-600">{job.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        <span className="text-sm">{job.location || 'Remote'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium">{job.salary_range || 'Not specified'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Select value={job.status} onValueChange={(value) => updateJobStatus(job.id, value)}>
                        <SelectTrigger className="w-auto border-0 bg-transparent p-0 h-auto">
                          {getStatusBadge(job.status)}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_applied">Not Applied</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4">
                      {job.ai_match_score ? (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className={`font-semibold text-sm ${getMatchScoreColor(job.ai_match_score)}`}>
                            {job.ai_match_score}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {job.applied_date ? (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm">
                            {new Date(job.applied_date).toLocaleDateString('en-US', { 
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Application
                          </DropdownMenuItem>
                          {job.job_url && (
                            <DropdownMenuItem asChild>
                              <a href={job.job_url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Job Posting
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteJob(job.id)} className="cursor-pointer text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

// Mock data for development
const mockJobs: JobApplication[] = [
  {
    id: 1,
    company: "TechCorp",
    position: "Senior Frontend Developer",
    location: "San Francisco, CA",
    salary_range: "$120k - $150k",
    status: "interview",
    applied_date: "2024-01-15T00:00:00Z",
    last_status_update: "2024-01-20T00:00:00Z",
    ai_match_score: 95,
    source: "ai_recommendation",
    job_url: "https://techcorp.com/jobs/123",
    notes: "Great company culture, remote-friendly",
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-20T00:00:00Z",
  },
  {
    id: 2,
    company: "StartupXYZ",
    position: "Full Stack Engineer",
    location: "New York, NY",
    salary_range: "$100k - $130k",
    status: "pending",
    applied_date: "2024-01-10T00:00:00Z",
    last_status_update: "2024-01-10T00:00:00Z",
    ai_match_score: 87,
    source: "manual_entry",
    job_url: "https://startupxyz.com/careers/456",
    notes: "Fast-growing startup, equity options",
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
  },
  {
    id: 3,
    company: "BigTech Inc",
    position: "React Developer",
    location: "Seattle, WA",
    salary_range: "$110k - $140k",
    status: "rejected",
    applied_date: "2024-01-05T00:00:00Z",
    last_status_update: "2024-01-18T00:00:00Z",
    ai_match_score: 78,
    source: "referral_opportunity",
    job_url: "https://bigtech.com/jobs/789",
    notes: "Competitive process, good benefits",
    rejection_date: "2024-01-18T00:00:00Z",
    rejection_reason: "Position filled internally",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-18T00:00:00Z",
  },
  {
    id: 4,
    company: "InnovateLab",
    position: "UI/UX Developer",
    location: "Austin, TX",
    salary_range: "$90k - $120k",
    status: "applied",
    applied_date: "2024-01-18T00:00:00Z",
    last_status_update: "2024-01-18T00:00:00Z",
    ai_match_score: 92,
    source: "ai_recommendation",
    job_url: "https://innovatelab.com/careers/101",
    notes: "Design-focused role, creative environment",
    created_at: "2024-01-18T00:00:00Z",
    updated_at: "2024-01-18T00:00:00Z",
  },
]

export { JobGrid as AdvancedJobGrid }
