"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Badge } from "@/components/ui/badge"
import { ProfileVerificationBadge } from "@/components/ui/verification-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Star,
  StarHalf,
  Briefcase,
  Building,
  Calendar,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  Award,
  Clock,
  MapPin,
  ExternalLink,
  Heart,
  Share2,
  BookOpen,
  Code,
  Zap,
  BarChart3,
} from "lucide-react"
import { PaymentModal } from "@/components/premium-conversation/payment-modal"
import { EmployeeAPI } from "@/lib/api/employees"

interface Employee {
  id: number
  name: string
  role: string
  company: string
  department: string
  location: string
  expertise: string[]
  rating: number
  referrals: number
  successfulReferrals: number
  responseTime: string
  bio: string
  avatar_url?: string
  projects: Array<{
    name: string
    description: string
    technologies: string[]
    impact: string
  }>
  achievements: Array<string | { title: string; description?: string; date_achieved?: string; category?: string }>
  joinedDate: string
  lastActive: string
  verified: boolean
  premiumMentor: boolean
  languages: Array<string | { language: string; proficiency?: string }>
  education: Array<{
    degree: string
    institution: string
    year: string
  }>
  certifications: Array<string | { name: string; issuing_organization?: string; issue_date?: string; expiration_date?: string }>
}

interface Testimonial {
  id: number
  author: string
  role: string
  content: string
  date: string
  rating: number
  outcome: "hired" | "interview" | "pending"
  avatar: string
}

function PaymentModalTrigger({ employeeId, employeeName }: { employeeId: number; employeeName: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        className="w-full border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="mr-2 h-4 w-4" />
        Request Premium Conversation
      </Button>
      <PaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
      />
    </>
  )
}

// Helper function to determine if user is recently active (online)
function isRecentlyActive(lastActive: string): boolean {
  if (!lastActive || lastActive === "Unknown") {
    return false
  }
  
  // If it explicitly says "Offline", they are not online
  if (lastActive.toLowerCase().includes("offline")) {
    return false
  }
  
  // If it says "Online", they are currently online
  if (lastActive.toLowerCase() === "online") {
    return true
  }
  
  // If it says "Recently", they are currently online
  if (lastActive === "Recently" || lastActive.toLowerCase().includes("recently")) {
    return true
  }
  
  // Parse different activity formats
  if (lastActive.includes("minutes ago")) {
    const minutes = parseInt(lastActive.match(/\d+/)?.[0] || "0")
    return minutes <= 5 // Consider online if active within 5 minutes
  }
  
  if (lastActive.includes("hours ago")) {
    const hours = parseInt(lastActive.match(/\d+/)?.[0] || "0")
    return hours <= 1 // Consider online if active within 1 hour
  }
  
  if (lastActive.includes("days ago")) {
    return false // Not online if last active days ago
  }
  
  return false
}

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const [isFollowing, setIsFollowing] = useState(false)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  // This page is for viewing other employees only - no editing functionality

  useEffect(() => {
    const loadEmployeeProfile = async () => {
      try {
        setLoading(true)
        console.log(`Loading profile for employee ID: ${resolvedParams.id}`)
        
        const profileData = await EmployeeAPI.getEmployeeProfile(Number.parseInt(resolvedParams.id))
        console.log('Received profile data:', profileData)
        
        // Transform API data to match the expected interface
        const transformedEmployee: Employee = {
          id: profileData.id || Number.parseInt(resolvedParams.id),
          name: profileData.name || "Unknown Employee",
          role: profileData.position || profileData.role || "Software Engineer",
          company: profileData.company || "Unknown Company",
          department: profileData.department || "Engineering",
          location: profileData.location || `${profileData.company || "Unknown Company"}, CA`,
          expertise: Array.isArray(profileData.skills) ? profileData.skills : [],
          rating: Number(profileData.rating) || 0,
          referrals: Number(profileData.total_referrals) || 0,
          successfulReferrals: Number(profileData.successful_referrals) || 0,
          responseTime: profileData.response_time || "< 2 hours",
          bio: profileData.bio || "No bio available",
          projects: Array.isArray(profileData.projects) ? profileData.projects : [],
          achievements: Array.isArray(profileData.achievements) ? profileData.achievements : [],
          joinedDate: profileData.joined_date || (profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "Unknown"),
          lastActive: profileData.last_active || "Recently",
          verified: Boolean(profileData.verified || profileData.is_verified),
          premiumMentor: Boolean(profileData.premium_mentor || profileData.is_premium_mentor),
          languages: Array.isArray(profileData.languages) ? profileData.languages : [],
          education: Array.isArray(profileData.education) ? profileData.education : [],
          certifications: Array.isArray(profileData.certifications) ? profileData.certifications : [],
          avatar_url: profileData.avatar_url
        }
        
        console.log('Transformed employee data:', transformedEmployee)
        setEmployee(transformedEmployee)
        setTestimonials(Array.isArray(profileData.testimonials) ? profileData.testimonials : [])
        
      } catch (error: any) {
        console.error('Failed to load employee profile:', error)
        console.error('Error details:', error.message)
        
        // Set default/error state with better error handling
        setEmployee({
          id: Number.parseInt(resolvedParams.id),
          name: "Profile Load Error",
          role: "Unable to load",
          company: "Error loading company info",
          department: "Error loading department",
          location: "Unknown",
          expertise: [],
          rating: 0,
          referrals: 0,
          successfulReferrals: 0,
          responseTime: "Unknown",
          bio: `Failed to load profile data. Error: ${error.message || 'Unknown error'}`,
          projects: [],
          achievements: [],
          joinedDate: "Unknown",
          lastActive: "Unknown",
          verified: false,
          premiumMentor: false,
          languages: [],
          education: [],
          certifications: []
        })
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }

    loadEmployeeProfile()
  }, [resolvedParams.id])

  if (loading || !employee) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  const successRate = Math.round((employee.successfulReferrals / employee.referrals) * 100)

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/employees"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to employees
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {employee.name}
              </h1>
              <p className="text-xl text-muted-foreground mt-1">
                {employee.role} at {employee.company}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFollowing(!isFollowing)}
                className={isFollowing ? "bg-purple-50 border-purple-200" : ""}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFollowing ? "fill-purple-500 text-purple-500" : ""}`} />
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile Card */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="sticky top-6 bg-gradient-to-br from-white to-purple-50/30 border-purple-100 shadow-xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center gap-6 text-center">
                  {/* Avatar with status */}
                  <div className="relative">
                    <UserAvatar
                      src={employee.avatar_url}
                      alt={employee.name}
                      name={employee.name}
                      size="xl"
                      className="border-4 border-white shadow-lg"
                      fallbackClassName="text-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold"
                    />
                    
                    <ProfileVerificationBadge 
                      isVerified={employee.verified} 
                      className="absolute -bottom-1 -right-1 z-10"
                    />
                    
                    {/* Status indicator - online (green) or offline (gray) */}
                    <div className="absolute -top-2 -left-2 bg-white rounded-full p-1 shadow-lg">
                      {isRecentlyActive(employee.lastActive) ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{employee.name}</h2>
                    <p className="text-muted-foreground">{employee.role}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {employee.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {isRecentlyActive(employee.lastActive) ? (
                        <span className="text-green-600 font-medium">Online now</span>
                      ) : (
                        <span>Active {employee.lastActive}</span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {employee.verified && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {employee.premiumMentor && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Premium Mentor
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Zap className="w-3 h-3 mr-1" />
                      Fast Response
                    </Badge>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.span
                            key={star}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: star * 0.1 }}
                          >
                            {employee.rating >= star ? (
                              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ) : employee.rating >= star - 0.5 ? (
                              <StarHalf className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <Star className="h-5 w-5 text-gray-300" />
                            )}
                          </motion.span>
                        ))}
                      </div>
                      <span className="font-bold text-lg">{employee.rating}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Based on {employee.referrals} referrals</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
                      <div className="text-xs text-purple-600">Success Rate</div>
                    </div>
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-pink-600">{employee.responseTime}</div>
                      <div className="text-xs text-pink-600">Response Time</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full space-y-3">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Request Referral
                    </Button>
                    <PaymentModalTrigger employeeId={employee.id} employeeName={employee.name} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Detailed Info */}
          <motion.div
            className="lg:col-span-2 space-y-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-purple-50">
                <TabsTrigger value="about" className="data-[state=active]:bg-white">
                  About
                </TabsTrigger>
                <TabsTrigger value="projects" className="data-[state=active]:bg-white">
                  Projects
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="data-[state=active]:bg-white">
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="insights" className="data-[state=active]:bg-white">
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6 mt-6">
                {/* Bio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      About {employee.name.split(" ")[0]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{employee.bio}</p>
                  </CardContent>
                </Card>

                {/* Expertise */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Technical Expertise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {employee.expertise.map((skill, index) => (
                        <motion.div
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 transition-all duration-200"
                          >
                            {skill}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Education & Certifications */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Education</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {employee.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-purple-200 pl-4">
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-sm text-muted-foreground">{edu.institution}</p>
                          <p className="text-xs text-muted-foreground">{edu.year}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {employee.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-purple-500" />
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {typeof cert === 'string' ? cert : cert.name}
                              </div>
                              {typeof cert === 'object' && cert.issuing_organization && (
                                <div className="text-xs text-muted-foreground">
                                  {cert.issuing_organization}
                                </div>
                              )}
                              {typeof cert === 'object' && cert.issue_date && (
                                <div className="text-xs text-muted-foreground">
                                  Issued: {new Date(cert.issue_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Key Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {employee.achievements.map((achievement, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {typeof achievement === 'string' ? achievement : achievement.title}
                            </div>
                            {typeof achievement === 'object' && achievement.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {achievement.description}
                              </div>
                            )}
                            {typeof achievement === 'object' && achievement.date_achieved && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(achievement.date_achieved).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {employee.languages.map((language, index) => (
                          <Badge key={index} variant="outline" className="border-purple-200">
                            {typeof language === 'string' ? language : `${language.language} (${language.proficiency || 'basic'})`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Company Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employee.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employee.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{employee.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Joined {employee.joinedDate}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {employee.projects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-300">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{project.name}</CardTitle>
                              <p className="text-muted-foreground mt-2">{project.description}</p>
                            </div>
                            <ExternalLink className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Technologies Used</h4>
                            <div className="flex flex-wrap gap-2">
                              {project.technologies.map((tech) => (
                                <Badge key={tech} variant="secondary" className="bg-blue-100 text-blue-800">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <h4 className="font-semibold text-green-800 mb-1">Impact</h4>
                            <p className="text-sm text-green-700">{project.impact}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="testimonials" className="space-y-6 mt-6">
                <div className="space-y-6">
                  {testimonials.map((testimonial, index) => (
                    <motion.div
                      key={testimonial.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={testimonial.avatar || undefined} alt={testimonial.author} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                {testimonial.author
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{testimonial.author}</h4>
                                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    ))}
                                  </div>
                                  <Badge
                                    className={
                                      testimonial.outcome === "hired"
                                        ? "bg-green-100 text-green-800"
                                        : testimonial.outcome === "interview"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }
                                  >
                                    {testimonial.outcome === "hired"
                                      ? "Hired"
                                      : testimonial.outcome === "interview"
                                        ? "Interview"
                                        : "Pending"}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-muted-foreground leading-relaxed mb-3">"{testimonial.content}"</p>
                              <p className="text-xs text-muted-foreground">{testimonial.date}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-6 mt-6">
                {/* Performance Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Success Rate</span>
                            <span className="text-sm font-bold text-green-600">{successRate}%</span>
                          </div>
                          <Progress value={successRate} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Response Speed</span>
                            <span className="text-sm font-bold text-blue-600">
                              {employee.responseTime || 'N/A'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Average response time for referral requests
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Profile Rating</span>
                            <span className="text-sm font-bold text-purple-600">{employee.rating}/5</span>
                          </div>
                          <Progress value={(employee.rating / 5) * 100} className="h-2" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                          <div className="text-3xl font-bold text-green-600">{employee.successfulReferrals}</div>
                          <div className="text-sm text-green-600">Successful Referrals</div>
                        </div>

                        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                          <div className="text-3xl font-bold text-blue-600">{employee.referrals}</div>
                          <div className="text-sm text-blue-600">Total Referrals</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Profile Status: Active</p>
                          <p className="text-xs text-muted-foreground">Last active {employee.lastActive}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Total Referrals: {employee.referrals}</p>
                          <p className="text-xs text-muted-foreground">Success rate: {successRate}%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50">
                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Member since {employee.joinedDate}</p>
                          <p className="text-xs text-muted-foreground">
                            {employee.verified ? 'Verified profile' : 'Profile pending verification'}
                          </p>
                        </div>
                      </div>

                      {employee.premiumMentor && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Premium Mentor Available</p>
                            <p className="text-xs text-muted-foreground">Offers premium consultation services</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
