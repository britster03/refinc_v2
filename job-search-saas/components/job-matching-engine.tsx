"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  Star,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  ExternalLink,
  Heart,
  X,
  Filter,
  Search,
  Zap,
  TrendingUp,
  Users,
} from "lucide-react"

const jobMatches = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechCorp",
    location: "San Francisco, CA",
    salary: "$130k - $160k",
    matchScore: 95,
    postedDate: "2 days ago",
    skills: ["React", "TypeScript", "Next.js", "Tailwind"],
    companySize: "500-1000",
    remote: true,
    description: "Join our team building next-generation web applications...",
    benefits: ["Health Insurance", "401k", "Remote Work", "Stock Options"],
  },
  {
    id: 2,
    title: "Full Stack Engineer",
    company: "StartupXYZ",
    location: "New York, NY",
    salary: "$110k - $140k",
    matchScore: 89,
    postedDate: "1 day ago",
    skills: ["React", "Node.js", "PostgreSQL", "AWS"],
    companySize: "50-100",
    remote: false,
    description: "Help us scale our platform to millions of users...",
    benefits: ["Health Insurance", "Equity", "Learning Budget"],
  },
  {
    id: 3,
    title: "React Developer",
    company: "InnovateLab",
    location: "Austin, TX",
    salary: "$100k - $130k",
    matchScore: 87,
    postedDate: "3 days ago",
    skills: ["React", "JavaScript", "GraphQL", "Jest"],
    companySize: "100-500",
    remote: true,
    description: "Build innovative solutions for our enterprise clients...",
    benefits: ["Health Insurance", "Flexible Hours", "Remote Work"],
  },
  {
    id: 4,
    title: "Frontend Engineer",
    company: "DesignCo",
    location: "Los Angeles, CA",
    salary: "$95k - $125k",
    matchScore: 82,
    postedDate: "1 week ago",
    skills: ["Vue.js", "JavaScript", "CSS", "Figma"],
    companySize: "200-500",
    remote: true,
    description: "Create beautiful user experiences for our design platform...",
    benefits: ["Health Insurance", "Creative Freedom", "Design Tools"],
  },
]

export function JobMatchingEngine() {
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("all")
  const [remoteFilter, setRemoteFilter] = useState("all")
  const [likedJobs, setLikedJobs] = useState<number[]>([])
  const [rejectedJobs, setRejectedJobs] = useState<number[]>([])

  const handleLike = (jobId: number) => {
    setLikedJobs((prev) => [...prev, jobId])
  }

  const handleReject = (jobId: number) => {
    setRejectedJobs((prev) => [...prev, jobId])
  }

  const filteredJobs = jobMatches.filter((job) => {
    if (rejectedJobs.includes(job.id)) return false

    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = locationFilter === "all" || job.location.includes(locationFilter)
    const matchesRemote =
      remoteFilter === "all" || (remoteFilter === "remote" && job.remote) || (remoteFilter === "onsite" && !job.remote)

    return matchesSearch && matchesLocation && matchesRemote
  })

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">Total Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">8.7</div>
                <p className="text-xs text-muted-foreground">Avg Match Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{likedJobs.length}</div>
                <p className="text-xs text-muted-foreground">Saved Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">New Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Job Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="San Francisco">San Francisco</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="Austin">Austin</SelectItem>
                <SelectItem value="Los Angeles">Los Angeles</SelectItem>
              </SelectContent>
            </Select>

            <Select value={remoteFilter} onValueChange={setRemoteFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Top Matches ({filteredJobs.length})</h3>
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Refresh Matches
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold">{job.title}</h4>
                          {job.remote && <Badge variant="secondary">Remote</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.postedDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">{job.matchScore}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Match Score</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                          <span className="text-white font-bold">{job.matchScore}</span>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Skills Match</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-1" />

                      <div className="flex justify-between text-xs">
                        <span>Experience Level</span>
                        <span>88%</span>
                      </div>
                      <Progress value={88} className="h-1" />

                      <div className="flex justify-between text-xs">
                        <span>Location Preference</span>
                        <span>95%</span>
                      </div>
                      <Progress value={95} className="h-1" />
                    </div>

                    {/* Job Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{job.salary}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{job.companySize} employees</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Required Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {job.skills.slice(0, 4).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                    {/* Benefits */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Benefits</p>
                      <div className="flex flex-wrap gap-1">
                        {job.benefits.slice(0, 3).map((benefit) => (
                          <Badge key={benefit} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                        {job.benefits.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{job.benefits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(job.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Pass
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLike(job.id)}
                      className={likedJobs.includes(job.id) ? "text-red-600" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-1 ${likedJobs.includes(job.id) ? "fill-current" : ""}`} />
                      Save
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Job
                    </Button>
                    <Button size="sm">Quick Apply</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
