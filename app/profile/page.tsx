"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Upload, Star, Edit, Save, Loader2, GraduationCap, Award, Globe, Trophy } from "lucide-react"
import { EmployeeAPI, EmployeeProfileUpdateData } from '@/lib/api/employees'
import { CandidateAPI, CandidateProfileUpdateData } from '@/lib/api/candidates'
import { authClient } from '@/lib/auth'
import { toast } from 'sonner'

interface ProfileData {
  id: number
  name: string
  email: string
  role: string
  position: string
  company: string
  department: string
  bio: string
  skills: string[]
  experience_years: number
  rating: number
  total_referrals: number
  successful_referrals: number
  avatar_url: string
  location: string
  projects: Array<{
    id?: number
    name: string
    description: string
    technologies: string[]
    impact: string
    start_date?: string
    end_date?: string
    is_current?: boolean
    url?: string
  }>
  education: Array<{
    id?: number
    degree: string
    institution: string
    field_of_study: string
    graduation_year: number
    gpa?: number
    description?: string
  }>
  certifications: Array<{
    id?: number
    name: string
    issuing_organization: string
    issue_date?: string
    expiration_date?: string
    credential_id?: string
    credential_url?: string
  }>
  languages: Array<{
    id?: number
    language: string
    proficiency: 'basic' | 'conversational' | 'professional' | 'native'
  }>
  achievements: Array<{
    id?: number
    title: string
    description?: string
    date_achieved?: string
    category?: string
    verification_url?: string
  }>
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Form states for new additions
  const [newSkill, setNewSkill] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [newProjectTechnologies, setNewProjectTechnologies] = useState("")
  const [newProjectImpact, setNewProjectImpact] = useState("")
  
  // Education form states
  const [newEducationDegree, setNewEducationDegree] = useState("")
  const [newEducationInstitution, setNewEducationInstitution] = useState("")
  const [newEducationField, setNewEducationField] = useState("")
  const [newEducationYear, setNewEducationYear] = useState("")
  const [newEducationGPA, setNewEducationGPA] = useState("")
  
  // Certification form states
  const [newCertificationName, setNewCertificationName] = useState("")
  const [newCertificationOrg, setNewCertificationOrg] = useState("")
  const [newCertificationDate, setNewCertificationDate] = useState("")
  const [newCertificationUrl, setNewCertificationUrl] = useState("")
  
  // Language form states
  const [newLanguageName, setNewLanguageName] = useState("")
  const [newLanguageProficiency, setNewLanguageProficiency] = useState<'basic' | 'conversational' | 'professional' | 'native'>('basic')
  
  // Achievement form states
  const [newAchievementTitle, setNewAchievementTitle] = useState("")
  const [newAchievementDescription, setNewAchievementDescription] = useState("")
  const [newAchievementDate, setNewAchievementDate] = useState("")
  const [newAchievementCategory, setNewAchievementCategory] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        
        // Get current user info
        const user = await authClient.getUser()
        if (!user) {
          toast.error("Please log in to view your profile")
          return
        }
        
        setCurrentUser(user)
        
        // Fetch full profile data based on user role
        const profileData = user.role === 'employee' 
          ? await EmployeeAPI.getEmployeeProfile(user.id)
          : await CandidateAPI.getCandidateProfile(user.id)
        
        // Transform to expected format
        const transformedProfile: ProfileData = {
          id: profileData.id,
          name: profileData.name || user.name,
          email: profileData.email || user.email,
          role: profileData.role || user.role,
          position: profileData.position || user.position || "",
          company: profileData.company || user.company || "",
          department: profileData.department || user.department || "",
          bio: profileData.bio || "",
          skills: profileData.skills || [],
          experience_years: profileData.experience_years || 0,
          rating: profileData.rating || 0,
          total_referrals: profileData.total_referrals || 0,
          successful_referrals: profileData.successful_referrals || 0,
          avatar_url: profileData.avatar_url || user.avatar_url || "",
          location: profileData.location || "",
          projects: profileData.projects || [],
          education: profileData.education || [],
          certifications: profileData.certifications || [],
          languages: profileData.languages || [],
          achievements: profileData.achievements || []
        }
        
        setProfile(transformedProfile)
        
      } catch (error) {
        console.error('Failed to load profile:', error)
        toast.error("Failed to load profile data")
        
        // Fallback to user data if available
        const user = await authClient.getUser()
        if (user) {
          setProfile({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            position: user.position || "",
            company: user.company || "",
            department: user.department || "",
            bio: user.bio || "",
            skills: user.skills || [],
            experience_years: user.experience_years || 0,
            rating: (user as any).rating || 0,
            total_referrals: 0,
            successful_referrals: 0,
            avatar_url: user.avatar_url || "",
            location: "",
            projects: [],
            education: [],
            certifications: [],
            languages: [],
            achievements: []
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const addSkill = () => {
    if (newSkill.trim() && profile && !profile.skills.includes(newSkill.trim())) {
      setProfile({
        ...profile,
        skills: [...profile.skills, newSkill.trim()],
      })
      setNewSkill("")
    }
  }

  const removeSkill = (skill: string) => {
    if (profile) {
    setProfile({
      ...profile,
        skills: profile.skills.filter((s) => s !== skill),
    })
    }
  }

  const addProject = () => {
    if (newProjectName.trim() && newProjectDescription.trim() && profile) {
      const newProject = {
        name: newProjectName.trim(),
        description: newProjectDescription.trim(),
        technologies: newProjectTechnologies.split(',').map(t => t.trim()).filter(t => t),
        impact: newProjectImpact.trim(),
      }
      
      setProfile({
        ...profile,
        projects: [...profile.projects, newProject],
      })
      
      setNewProjectName("")
      setNewProjectDescription("")
      setNewProjectTechnologies("")
      setNewProjectImpact("")
    }
  }

  const removeProject = (index: number) => {
    if (profile) {
    setProfile({
      ...profile,
      projects: profile.projects.filter((_, i) => i !== index),
    })
    }
  }

  const addEducation = () => {
    if (newEducationDegree.trim() && newEducationInstitution.trim() && profile) {
      const newEducation = {
        degree: newEducationDegree.trim(),
        institution: newEducationInstitution.trim(),
        field_of_study: newEducationField.trim(),
        graduation_year: parseInt(newEducationYear) || new Date().getFullYear(),
        gpa: parseFloat(newEducationGPA) || undefined,
      }
      
      setProfile({
        ...profile,
        education: [...profile.education, newEducation],
      })
      
      // Reset form
      setNewEducationDegree("")
      setNewEducationInstitution("")
      setNewEducationField("")
      setNewEducationYear("")
      setNewEducationGPA("")
    }
  }

  const removeEducation = (index: number) => {
    if (profile) {
      setProfile({
        ...profile,
        education: profile.education.filter((_, i) => i !== index),
      })
    }
  }

  const addCertification = () => {
    if (newCertificationName.trim() && newCertificationOrg.trim() && profile) {
      const newCertification = {
        name: newCertificationName.trim(),
        issuing_organization: newCertificationOrg.trim(),
        issue_date: newCertificationDate.trim() || undefined,
        credential_url: newCertificationUrl.trim() || undefined,
      }
      
      setProfile({
        ...profile,
        certifications: [...profile.certifications, newCertification],
      })
      
      // Reset form
      setNewCertificationName("")
      setNewCertificationOrg("")
      setNewCertificationDate("")
      setNewCertificationUrl("")
    }
  }

  const removeCertification = (index: number) => {
    if (profile) {
      setProfile({
        ...profile,
        certifications: profile.certifications.filter((_, i) => i !== index),
      })
    }
  }

  const addLanguage = () => {
    if (newLanguageName.trim() && profile) {
      const newLanguage = {
        language: newLanguageName.trim(),
        proficiency: newLanguageProficiency,
      }
      
      setProfile({
        ...profile,
        languages: [...profile.languages, newLanguage],
      })
      
      // Reset form
      setNewLanguageName("")
      setNewLanguageProficiency('basic')
    }
  }

  const removeLanguage = (index: number) => {
    if (profile) {
      setProfile({
        ...profile,
        languages: profile.languages.filter((_, i) => i !== index),
      })
    }
  }

  const addAchievement = () => {
    if (newAchievementTitle.trim() && profile) {
      const newAchievement = {
        title: newAchievementTitle.trim(),
        description: newAchievementDescription.trim() || undefined,
        date_achieved: newAchievementDate.trim() || undefined,
        category: newAchievementCategory.trim() || "professional",
      }
      
      setProfile({
        ...profile,
        achievements: [...profile.achievements, newAchievement],
      })
      
      // Reset form
      setNewAchievementTitle("")
      setNewAchievementDescription("")
      setNewAchievementDate("")
      setNewAchievementCategory("")
    }
  }

  const removeAchievement = (index: number) => {
    if (profile) {
      setProfile({
        ...profile,
        achievements: profile.achievements.filter((_, i) => i !== index),
      })
    }
  }

  const saveProfile = async () => {
    if (!profile || !currentUser) return

    try {
      setSaving(true)
      
      if (currentUser.role === 'employee') {
        const updateData: EmployeeProfileUpdateData = {
          bio: profile.bio,
          position: profile.position,
          department: profile.department,
          experience_years: profile.experience_years,
          skills: profile.skills,
          company: profile.company,
          location: profile.location,
          avatar_url: profile.avatar_url,
          projects: profile.projects.filter(p => p.name?.trim()),
          education: profile.education.filter(e => e.degree?.trim() && e.institution?.trim()),
          certifications: profile.certifications.filter(c => c.name?.trim() && c.issuing_organization?.trim()),
          languages: profile.languages.filter(l => l.language?.trim()),
          achievements: profile.achievements.filter(a => a.title?.trim())
        }

        await EmployeeAPI.updateEmployeeProfile(profile.id, updateData)
      } else if (currentUser.role === 'candidate') {
        const updateData: CandidateProfileUpdateData = {
          bio: profile.bio,
          position: profile.position,
          department: profile.department,
          experience_years: profile.experience_years,
          skills: profile.skills,
          company: profile.company,
          location: profile.location,
          avatar_url: profile.avatar_url,
          projects: profile.projects.filter(p => p.name?.trim()),
          education: profile.education.filter(e => e.degree?.trim() && e.institution?.trim()),
          certifications: profile.certifications.filter(c => c.name?.trim() && c.issuing_organization?.trim()),
          languages: profile.languages.filter(l => l.language?.trim()),
          achievements: profile.achievements.filter(a => a.title?.trim())
        }

        await CandidateAPI.updateCandidateProfile(profile.id, updateData)
      }
      
      toast.success('Profile updated successfully!')
      
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast.error(error.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('File size must be less than 5MB')
          return
        }
        
        // Convert to base64 for preview/storage
        const reader = new FileReader()
        reader.onload = (event) => {
          const result = event.target?.result as string
          if (profile) {
            setProfile({ ...profile, avatar_url: result })
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  if (loading) {
    return (
      <DashboardLayout role={currentUser?.role || "employee"}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout role={currentUser?.role || "employee"}>
        <div className="flex flex-col gap-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-muted-foreground">Profile not found</h1>
            <p className="text-muted-foreground">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={profile.role as "employee" | "candidate"}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground">
            {currentUser?.role === 'employee' 
              ? 'Manage your profile information visible to candidates'
              : 'Manage your profile information visible to employees'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Update your profile picture</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} alt="Profile" />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="ml-1 font-medium">{profile.rating}</span>
                <span className="ml-1 text-sm text-muted-foreground">({profile.total_referrals} referrals)</span>
              </div>
              <Button variant="outline" className="w-full" onClick={handleAvatarUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Picture
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your basic profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    placeholder="Engineering"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Tech Solutions Inc."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={profile.experience_years}
                    onChange={(e) => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
              <CardDescription>Add your skills and technical expertise</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new skill"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <Button variant="outline" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
              <CardDescription>Showcase your notable projects and achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.projects.map((project, index) => (
                <div key={index} className="rounded-md border p-4 relative">
                  <button
                    onClick={() => removeProject(index)}
                    className="absolute right-2 top-2 rounded-full hover:bg-muted p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid gap-3 pr-8">
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.impact && (
                      <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                        <strong>Impact:</strong> {project.impact}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Add New Project</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      placeholder="e.g. E-commerce Platform"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                    />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="project-technologies">Technologies (comma-separated)</Label>
                      <Input
                        id="project-technologies"
                        placeholder="e.g. React, Node.js, MongoDB"
                        value={newProjectTechnologies}
                        onChange={(e) => setNewProjectTechnologies(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-description">Project Description</Label>
                    <Textarea
                      id="project-description"
                      placeholder="Describe your role and what you built"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="project-impact">Impact & Results</Label>
                    <Textarea
                      id="project-impact"
                      placeholder="What was the impact or outcome of this project?"
                      value={newProjectImpact}
                      onChange={(e) => setNewProjectImpact(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                  <Button variant="outline" onClick={addProject}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Education Section */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
              <CardDescription>Add your educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.education.map((edu, index) => (
                <div key={index} className="rounded-md border p-4 relative">
                  <button
                    onClick={() => removeEducation(index)}
                    className="absolute right-2 top-2 rounded-full hover:bg-muted p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid gap-3 pr-8">
                    <h3 className="font-medium">{edu.degree}</h3>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {edu.field_of_study && <span>Field: {edu.field_of_study}</span>}
                      {edu.graduation_year && <span>Year: {edu.graduation_year}</span>}
                      {edu.gpa && <span>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Add Education</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edu-degree">Degree</Label>
                      <Input
                        id="edu-degree"
                        placeholder="e.g. Bachelor of Science"
                        value={newEducationDegree}
                        onChange={(e) => setNewEducationDegree(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edu-institution">Institution</Label>
                      <Input
                        id="edu-institution"
                        placeholder="e.g. Stanford University"
                        value={newEducationInstitution}
                        onChange={(e) => setNewEducationInstitution(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edu-field">Field of Study</Label>
                      <Input
                        id="edu-field"
                        placeholder="e.g. Computer Science"
                        value={newEducationField}
                        onChange={(e) => setNewEducationField(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edu-year">Graduation Year</Label>
                      <Input
                        id="edu-year"
                        type="number"
                        placeholder="e.g. 2020"
                        value={newEducationYear}
                        onChange={(e) => setNewEducationYear(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edu-gpa">GPA (optional)</Label>
                      <Input
                        id="edu-gpa"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 3.8"
                        value={newEducationGPA}
                        onChange={(e) => setNewEducationGPA(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={addEducation}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Education
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certifications Section */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
              <CardDescription>Add your professional certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.certifications.map((cert, index) => (
                <div key={index} className="rounded-md border p-4 relative">
                  <button
                    onClick={() => removeCertification(index)}
                    className="absolute right-2 top-2 rounded-full hover:bg-muted p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid gap-3 pr-8">
                    <h3 className="font-medium">{cert.name}</h3>
                    <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {cert.issue_date && <span>Issued: {cert.issue_date}</span>}
                      {cert.credential_url && (
                        <a 
                          href={cert.credential_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Certificate
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Add Certification</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cert-name">Certification Name</Label>
                      <Input
                        id="cert-name"
                        placeholder="e.g. AWS Certified Solutions Architect"
                        value={newCertificationName}
                        onChange={(e) => setNewCertificationName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cert-org">Issuing Organization</Label>
                      <Input
                        id="cert-org"
                        placeholder="e.g. Amazon Web Services"
                        value={newCertificationOrg}
                        onChange={(e) => setNewCertificationOrg(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="cert-date">Issue Date</Label>
                      <Input
                        id="cert-date"
                        type="date"
                        value={newCertificationDate}
                        onChange={(e) => setNewCertificationDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cert-url">Certificate URL (optional)</Label>
                      <Input
                        id="cert-url"
                        placeholder="https://..."
                        value={newCertificationUrl}
                        onChange={(e) => setNewCertificationUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={addCertification}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Certification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages Section */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages
              </CardTitle>
              <CardDescription>Add languages you speak</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((lang, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {lang.language} ({lang.proficiency})
                    <button onClick={() => removeLanguage(index)} className="ml-1 rounded-full hover:bg-muted p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Add Language</h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="lang-name">Language</Label>
                      <Input
                        id="lang-name"
                        placeholder="e.g. Spanish"
                        value={newLanguageName}
                        onChange={(e) => setNewLanguageName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lang-proficiency">Proficiency Level</Label>
                      <Select value={newLanguageProficiency} onValueChange={(value) => setNewLanguageProficiency(value as 'basic' | 'conversational' | 'professional' | 'native')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="native">Native</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button variant="outline" onClick={addLanguage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Language
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Section */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Key Achievements
              </CardTitle>
              <CardDescription>Highlight your professional accomplishments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.achievements.map((achievement, index) => (
                <div key={index} className="rounded-md border p-4 relative">
                  <button
                    onClick={() => removeAchievement(index)}
                    className="absolute right-2 top-2 rounded-full hover:bg-muted p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="grid gap-3 pr-8">
                    <h3 className="font-medium">{achievement.title}</h3>
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    )}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {achievement.date_achieved && <span>Date: {achievement.date_achieved}</span>}
                      {achievement.category && (
                        <Badge variant="outline" className="text-xs">
                          {achievement.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Add Achievement</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="achievement-title">Achievement Title</Label>
                    <Input
                      id="achievement-title"
                      placeholder="e.g. Employee of the Year"
                      value={newAchievementTitle}
                      onChange={(e) => setNewAchievementTitle(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="achievement-description">Description</Label>
                    <Textarea
                      id="achievement-description"
                      placeholder="Describe this achievement"
                      value={newAchievementDescription}
                      onChange={(e) => setNewAchievementDescription(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="achievement-date">Date Achieved</Label>
                      <Input
                        id="achievement-date"
                        type="date"
                        value={newAchievementDate}
                        onChange={(e) => setNewAchievementDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="achievement-category">Category</Label>
                      <Input
                        id="achievement-category"
                        placeholder="e.g. professional, academic"
                        value={newAchievementCategory}
                        onChange={(e) => setNewAchievementCategory(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={addAchievement}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Achievement
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save All Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
