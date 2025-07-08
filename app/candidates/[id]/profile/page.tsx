"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  MapPin, 
  Mail, 
  Calendar, 
  Award, 
  GraduationCap, 
  Trophy, 
  Globe, 
  ExternalLink,
  Loader2,
  ArrowLeft,
  Clock,
  Activity
} from "lucide-react"
import { CandidateAPI, DetailedCandidateProfile } from "@/lib/api/candidates"
import { authClient } from "@/lib/auth"
import { toast } from "sonner"

function formatDate(dateString: string) {
  if (!dateString) return "Not specified"
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatProficiency(proficiency: string) {
  const levels = {
    basic: "Basic",
    conversational: "Conversational", 
    professional: "Professional",
    native: "Native"
  }
  return levels[proficiency as keyof typeof levels] || proficiency
}

function getActivityStatus(lastActive: string, isLoggedOut: boolean = false) {
  // If user is explicitly logged out, show offline regardless of timing
  if (isLoggedOut) {
    return { status: "offline", label: "Offline", color: "bg-gray-500" }
  }
  
  const lastActiveDate = new Date(lastActive)
  const now = new Date()
  const diffInHours = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    return { status: "online", label: "Online", color: "bg-green-500" }
  } else if (diffInHours < 24) {
    return { status: "recent", label: "Active today", color: "bg-blue-500" }
  } else if (diffInHours < 168) { // 7 days
    return { status: "week", label: "Active this week", color: "bg-yellow-500" }
  } else {
    return { status: "offline", label: "Offline", color: "bg-gray-500" }
  }
}

export default function CandidateProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState<DetailedCandidateProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const candidateId = parseInt(params.id as string)

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Check if user is an employee
      const user = await authClient.getUser()
      if (!user) {
        toast.error("Please log in to view profiles")
        router.push("/auth/login")
        return
      }
      
      if (user.role !== "employee") {
        toast.error("Only employees can view candidate profiles")
        router.push("/dashboard")
        return
      }
      
      setCurrentUser(user)
      
      // Fetch candidate profile
      const candidateProfile = await CandidateAPI.getCandidateProfile(candidateId)
      setProfile(candidateProfile)
      
    } catch (error) {
      console.error('Failed to load candidate profile:', error)
      toast.error("Failed to load candidate profile")
      router.push("/referrals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (candidateId) {
      loadProfile()
    }
  }, [candidateId, router])

  // Auto-refresh profile data every 30 seconds to catch activity status changes
  useEffect(() => {
    if (!profile) return

    const refreshInterval = setInterval(async () => {
      try {
        const candidateProfile = await CandidateAPI.getCandidateProfile(candidateId)
        setProfile(candidateProfile)
      } catch (error) {
        console.error('Failed to auto-refresh profile:', error)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [candidateId, profile])

  if (loading) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading candidate profile...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout role="employee">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-xl font-semibold mb-2">Candidate Not Found</h2>
          <p className="text-muted-foreground mb-4">The candidate profile you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/referrals")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Referrals
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const activityStatus = getActivityStatus(profile.last_active, profile.is_logged_out)

  return (
    <DashboardLayout role="employee">
      <div className="flex flex-col gap-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Candidate Profile</h1>
            <p className="text-muted-foreground">Complete profile information</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setLoading(true)
              // Reload profile data to get fresh activity status
              const loadProfile = async () => {
                try {
                  const candidateProfile = await CandidateAPI.getCandidateProfile(candidateId)
                  setProfile(candidateProfile)
                } catch (error) {
                  console.error('Failed to refresh profile:', error)
                  toast.error("Failed to refresh profile")
                } finally {
                  setLoading(false)
                }
              }
              loadProfile()
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Clock className="w-4 h-4 mr-2" />
            )}
            Refresh Status
          </Button>
        </div>

        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${activityStatus.color}`}></div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${activityStatus.color}`}></div>
                  <span className="text-muted-foreground">{activityStatus.label}</span>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <p className="text-lg text-muted-foreground">{profile.position || "No position specified"}</p>
                  {profile.company && (
                    <p className="text-muted-foreground">at {profile.company}</p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(profile.joined_date)}</span>
                  </div>
                  {profile.experience_years && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{profile.experience_years} years experience</span>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground">{profile.bio}</p>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {profile.recent_activity_count} recent activities
                    </span>
                  </div>
                  {profile.is_verified && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Profile Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            {profile.projects && profile.projects.length > 0 ? (
              profile.projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {project.name}
                          {project.url && (
                            <a href={project.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {project.start_date && formatDate(project.start_date)}
                          {project.start_date && project.end_date && " - "}
                          {project.end_date && !project.is_current && formatDate(project.end_date)}
                          {project.is_current && "Present"}
                        </CardDescription>
                      </div>
                      {project.is_current && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Current
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-muted-foreground mb-4">{project.description}</p>
                    )}
                    
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Technologies Used</h4>
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {project.impact && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-1">Impact</h4>
                        <p className="text-sm text-muted-foreground">{project.impact}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Projects Listed</h3>
                  <p className="text-muted-foreground text-center">
                    This candidate hasn't added any projects to their profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            {profile.education && profile.education.length > 0 ? (
              profile.education.map((edu) => (
                <Card key={edu.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      {edu.degree}
                    </CardTitle>
                    <CardDescription>
                      {edu.institution}
                      {edu.field_of_study && ` • ${edu.field_of_study}`}
                      {edu.graduation_year && ` • Class of ${edu.graduation_year}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {edu.gpa && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">GPA:</span>
                          <span className="text-sm">{edu.gpa}</span>
                        </div>
                      )}
                      {edu.description && (
                        <div>
                          <span className="font-semibold text-sm">Description:</span>
                          <p className="text-sm text-muted-foreground mt-1">{edu.description}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Education Listed</h3>
                  <p className="text-muted-foreground text-center">
                    This candidate hasn't added any education information to their profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-4">
            {profile.certifications && profile.certifications.length > 0 ? (
              profile.certifications.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      {cert.name}
                      {cert.credential_url && (
                        <a href={cert.credential_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {cert.issuing_organization}
                      {cert.issue_date && ` • Issued ${formatDate(cert.issue_date)}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {cert.credential_id && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Credential ID:</span>
                          <code className="text-sm bg-muted px-2 py-1 rounded">{cert.credential_id}</code>
                        </div>
                      )}
                      {cert.expiration_date && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Expires:</span>
                          <span className="text-sm">{formatDate(cert.expiration_date)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Certifications Listed</h3>
                  <p className="text-muted-foreground text-center">
                    This candidate hasn't added any certifications to their profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-4">
            {profile.languages && profile.languages.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Languages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {profile.languages.map((lang, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">{lang.language}</span>
                        <Badge variant="outline">{formatProficiency(lang.proficiency)}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Languages Listed</h3>
                  <p className="text-muted-foreground text-center">
                    This candidate hasn't added any language skills to their profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            {profile.achievements && profile.achievements.length > 0 ? (
              profile.achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      {achievement.title}
                      {achievement.verification_url && (
                        <a href={achievement.verification_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </a>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {achievement.date_achieved && (
                        <>
                          <Calendar className="w-4 h-4" />
                          {formatDate(achievement.date_achieved)}
                        </>
                      )}
                      {achievement.category && (
                        <Badge variant="outline" className="ml-2">
                          {achievement.category}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  {achievement.description && (
                    <CardContent>
                      <p className="text-muted-foreground">{achievement.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Achievements Listed</h3>
                  <p className="text-muted-foreground text-center">
                    This candidate hasn't added any achievements to their profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 