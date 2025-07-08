"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Upload, Check, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { ReferralAPI, ReferralCreateData } from "@/lib/api/referrals"
import { authClient } from "@/lib/auth"

interface Company {
  name: string
}

interface Employee {
  id: number
  name: string
  position: string
  department: string
  company: string
  rating: number
  avatar_url?: string
}

interface FormData {
  company: string
  position: string
  jobLink: string
  jobDescription: string
  notes: string
  resume: File | null
  employeeId: number | null
}

export default function NewReferralPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState<FormData>({
    company: "",
    position: "",
    jobLink: "",
    jobDescription: "",
    notes: "",
    resume: null,
    employeeId: null
  })
  
  const [resumeUrl, setResumeUrl] = useState<string>("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load companies on component mount
  useEffect(() => {
    loadCompanies()
  }, [])

  // Load employees when company is selected
  useEffect(() => {
    if (formData.company) {
      loadEmployees(formData.company)
    } else {
      setEmployees([])
    }
  }, [formData.company])

  const loadCompanies = async () => {
    try {
      const companiesList = await ReferralAPI.getCompanies()
      setCompanies(companiesList)
    } catch (error) {
      console.error("Failed to load companies:", error)
      toast({
        title: "Error",
        description: "Failed to load companies. Please try again.",
        variant: "destructive"
      })
    }
  }

  const loadEmployees = async (company: string) => {
    setLoadingEmployees(true)
    try {
      const employeesList = await ReferralAPI.getEmployeesByCompany(company)
      setEmployees(employeesList)
    } catch (error) {
      console.error("Failed to load employees:", error)
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['.pdf', '.doc', '.docx']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOC, or DOCX file.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      })
      return
    }

    setUploadingResume(true)
    try {
      const response = await ReferralAPI.uploadResume(file)
      setResumeUrl(response.file_url)
      setFormData(prev => ({ ...prev, resume: file }))
      toast({
        title: "Resume uploaded",
        description: "Your resume has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Failed to upload resume:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload resume. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingResume(false)
    }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.company) newErrors.company = "Company is required"
    if (!formData.position) newErrors.position = "Position is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.employeeId) newErrors.employee = "Please select an employee"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setStep(Math.max(1, step - 1))
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const user = await authClient.getUser()
      if (!user || user.role !== 'candidate') {
        throw new Error("Only candidates can create referral requests")
      }

      const selectedEmployee = employees.find(emp => emp.id === formData.employeeId)
      if (!selectedEmployee) {
        throw new Error("Selected employee not found")
      }

      const referralData: ReferralCreateData = {
        employee_id: formData.employeeId!,
        position: formData.position,
        department: selectedEmployee.department,
        company: formData.company,
        notes: formData.notes || undefined,
        resume_url: resumeUrl || undefined,
        job_description: formData.jobDescription || undefined
      }

      const referral = await ReferralAPI.createReferral(referralData)
      
      toast({
        title: "Referral request submitted!",
        description: `Your referral request for ${formData.position} at ${formData.company} has been sent to ${selectedEmployee.name}.`,
      })

      // Redirect to referrals page
      router.push('/referrals')
      
    } catch (error: any) {
      console.error("Failed to create referral:", error)
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit referral request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployee = employees.find(emp => emp.id === formData.employeeId)

  return (
    <DashboardLayout role="candidate">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/referrals" className="flex items-center text-sm text-muted-foreground hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to referrals
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">New Referral Request</h1>
          <p className="text-muted-foreground">Submit a new referral request to an employee</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step >= stepNumber
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {step > stepNumber ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{stepNumber}</span>
                )}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`w-16 h-0.5 mx-2 ${
                    step > stepNumber ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Job Details</CardTitle>
              <CardDescription>Provide details about the job you're applying for</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company">Company *</Label>
                <Select
                  value={formData.company}
                  onValueChange={(value) => handleInputChange('company', value)}
                >
                  <SelectTrigger className={errors.company ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.company && <p className="text-sm text-destructive">{errors.company}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  placeholder="e.g. Senior Frontend Developer"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  className={errors.position ? "border-destructive" : ""}
                />
                {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="job-link">Job Posting Link (optional)</Label>
                <Input
                  id="job-link"
                  placeholder="https://example.com/job/123"
                  value={formData.jobLink}
                  onChange={(e) => handleInputChange('jobLink', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the full job description here. This helps our AI provide better matching analysis."
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange('jobDescription', e.target.value)}
                  className="min-h-[120px]"
                />
                <p className="text-xs text-muted-foreground">
                  Including the job description enables AI-powered match analysis
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="resume">Resume</Label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="resume-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploadingResume ? (
                        <Loader2 className="w-8 h-8 mb-2 text-muted-foreground animate-spin" />
                      ) : formData.resume ? (
                        <Check className="w-8 h-8 mb-2 text-green-500" />
                      ) : (
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      )}
                      <p className="mb-2 text-sm text-muted-foreground">
                        {uploadingResume ? (
                          "Uploading..."
                        ) : formData.resume ? (
                          <span className="font-semibold text-green-600">
                            {formData.resume.name} uploaded
                          </span>
                        ) : (
                          <>
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </>
                        )}
                      </p>
                      {!formData.resume && (
                        <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX (max 5MB)</p>
                      )}
                    </div>
                    <input
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={uploadingResume}
                    />
                  </label>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information you'd like to share with the employee"
                  className="min-h-[100px]"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNext} disabled={!formData.company || !formData.position}>
                Next: Select Employee
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Select Employee</CardTitle>
              <CardDescription>
                Choose an employee from {formData.company} to send your referral request to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEmployees ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading employees...</span>
                </div>
              ) : employees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No employees found for {formData.company}. Please try a different company.
                </div>
              ) : (
                <RadioGroup
                  value={formData.employeeId?.toString() || ""}
                  onValueChange={(value) => handleInputChange('employeeId', parseInt(value))}
                >
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className={`flex items-center space-x-4 rounded-md border p-4 cursor-pointer hover:bg-muted/50 ${
                          formData.employeeId === employee.id ? "border-primary bg-primary/5" : "border-muted"
                        }`}
                        onClick={() => handleInputChange('employeeId', employee.id)}
                      >
                        <RadioGroupItem
                          value={employee.id.toString()}
                          id={`employee-${employee.id}`}
                          className="sr-only"
                        />
                        <Avatar>
                          <AvatarImage src={employee.avatar_url || "/placeholder.svg"} alt={employee.name} />
                          <AvatarFallback>
                            {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee.position} • {employee.department}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Rating: {employee.rating.toFixed(1)}/5.0
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}
              {errors.employee && <p className="text-sm text-destructive mt-2">{errors.employee}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleNext} disabled={!formData.employeeId}>
                Next: Review
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review & Submit</CardTitle>
              <CardDescription>Review your referral request before submitting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Job Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Company:</div>
                  <div>{formData.company}</div>
                  <div className="text-muted-foreground">Position:</div>
                  <div>{formData.position}</div>
                  {formData.jobLink && (
                    <>
                      <div className="text-muted-foreground">Job Link:</div>
                      <div className="truncate">
                        <a 
                          href={formData.jobLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {formData.jobLink}
                        </a>
                      </div>
                    </>
                  )}
                  {formData.resume && (
                    <>
                      <div className="text-muted-foreground">Resume:</div>
                      <div>{formData.resume.name}</div>
                    </>
                  )}
                  {formData.notes && (
                    <>
                      <div className="text-muted-foreground">Notes:</div>
                      <div className="col-span-2">{formData.notes}</div>
                    </>
                  )}
                </div>
              </div>
              
              {selectedEmployee && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Selected Employee</h3>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={selectedEmployee.avatar_url || "/placeholder.svg"} alt={selectedEmployee.name} />
                      <AvatarFallback>
                        {selectedEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedEmployee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEmployee.position} • {selectedEmployee.department}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedEmployee.company} • Rating: {selectedEmployee.rating.toFixed(1)}/5.0
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="text-muted-foreground">Note:</div>
                  <div>By submitting this request, you agree to our terms of service and privacy policy.</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Referral Request"
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
