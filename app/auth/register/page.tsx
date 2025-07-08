"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, Loader2, Eye, EyeOff, ArrowLeft, UserPlus, Users, Briefcase } from "lucide-react"
import { AuthClient, RegisterData, EmployeeRegistrationData, OTPVerification } from "@/lib/auth"
import { toast } from "sonner"
import ClientOnly from "@/components/client-only"
import OTPVerificationComponent from "@/components/OTPVerification"

// Floating background elements
const FloatingElements = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Large gradient orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ top: "15%", right: "15%" }}
      />
      
      <motion.div
        className="absolute w-80 h-80 bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl"
        animate={{
          x: [0, 80, 0],
          y: [0, -60, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
        style={{ bottom: "10%", left: "10%" }}
      />

      {/* Medium orbs */}
      <motion.div
        className="absolute w-64 h-64 bg-gradient-to-r from-green-400/10 to-blue-400/10 rounded-full blur-2xl"
        animate={{
          x: [0, -60, 0],
          y: [0, 40, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{ top: "40%", right: "20%" }}
      />

      {/* Small floating dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-blue-400/40 rounded-full"
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
          style={{
            top: `${15 + i * 8}%`,
            right: `${5 + i * 12}%`,
          }}
        />
      ))}
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") || "candidate"
  
  const [role, setRole] = useState(defaultRole as "candidate" | "employee")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: searchParams.get("email") || "",
    password: "",
    name: "",
    company: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // OTP verification state
  const [showOTPVerification, setShowOTPVerification] = useState(false)
  const [otpCountdown, setOtpCountdown] = useState(0)
  const [employeeRegistrationData, setEmployeeRegistrationData] = useState<EmployeeRegistrationData | null>(null)

  const authClient = new AuthClient()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    } else if (role === "employee") {
      // Validate company email for employees
      const emailDomain = formData.email.split('@')[1]?.toLowerCase()
      const commonFreedomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
      ]
      if (commonFreedomains.includes(emailDomain)) {
        newErrors.email = "Please use your company email address, not a personal email"
      }
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }
    
    if (!formData.name) {
      newErrors.name = "Full name is required"
    }
    
    if (role === "employee" && !formData.company) {
      newErrors.company = "Company is required for employees"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      if (role === "employee") {
        // Employee registration with OTP verification
        const employeeData: EmployeeRegistrationData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          company: formData.company,
          skills: [],
          experience_years: 0
        }
        
        setEmployeeRegistrationData(employeeData)
        
        const otpResponse = await authClient.requestEmployeeOTP(employeeData)
        
        if (otpResponse.success) {
          setShowOTPVerification(true)
          setOtpCountdown(otpResponse.expires_in || 600) // 10 minutes default
          toast.success("Verification code sent to your email!")
        } else {
          toast.error(otpResponse.message || "Failed to send verification code")
        }
      } else {
        // Candidate registration (existing flow)
        const registerData: RegisterData = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: role,
          company: role === "employee" ? formData.company : undefined,
          skills: [],
          experience_years: 0
        }
        
        const response = await authClient.signUp(
          formData.email,
          formData.password,
          registerData
        )
        
        toast.success("Account created successfully! Welcome to ReferralInc!")
        router.push("/dashboard/candidate")
      }
      
    } catch (error: any) {
      console.error("Registration error:", error)
      
      if (error.message.includes("already registered")) {
        setErrors({ email: "This email is already registered" })
        toast.error("Email already registered")
      } else if (error.message.includes("company email")) {
        setErrors({ email: "Please use your company email address" })
        toast.error("Please use your company email address")
      } else if (error.message.includes("password")) {
        setErrors({ password: "Password doesn't meet requirements" })
        toast.error("Password doesn't meet requirements")
      } else {
        toast.error("Registration failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPVerification = async (otpCode: string) => {
    if (!employeeRegistrationData) {
      toast.error("Registration data not found. Please start over.")
      return
    }

    try {
      const verificationData: OTPVerification = {
        email: employeeRegistrationData.email,
        otp_code: otpCode,
        purpose: "registration"
      }

      const response = await authClient.verifyEmployeeOTP(verificationData)
      
      toast.success("Email verified! Welcome to ReferralInc!")
      router.push("/dashboard/employee")
      
    } catch (error: any) {
      console.error("OTP verification error:", error)
      toast.error(error.message || "Verification failed. Please try again.")
      throw error // Re-throw to handle in OTP component
    }
  }

  const handleRequestNewOTP = async () => {
    if (!employeeRegistrationData) {
      toast.error("Registration data not found. Please start over.")
      return
    }

    try {
      setIsLoading(true)
      const otpResponse = await authClient.requestEmployeeOTP(employeeRegistrationData)
      
      if (otpResponse.success) {
        setOtpCountdown(otpResponse.expires_in || 600)
        toast.success("New verification code sent!")
      } else {
        toast.error(otpResponse.message || "Failed to send new verification code")
      }
    } catch (error: any) {
      console.error("Request new OTP error:", error)
      toast.error("Failed to send new verification code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackFromOTP = () => {
    setShowOTPVerification(false)
    setEmployeeRegistrationData(null)
    setOtpCountdown(0)
  }

  return (
    <ClientOnly>
      <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
        <FloatingElements />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity group"
          >
            <div className="relative">
              <Building2 className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-md"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              ReferralInc
            </span>
          </Link>
          
          <button 
            onClick={showOTPVerification ? handleBackFromOTP : () => router.push("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {showOTPVerification ? "Back to registration" : "Back to home"}
          </button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4 py-8">
          {showOTPVerification ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <OTPVerificationComponent
                email={employeeRegistrationData?.email || ""}
                onVerificationSuccess={handleOTPVerification}
                onRequestNewOTP={handleRequestNewOTP}
                isLoading={isLoading}
                countdown={otpCountdown}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-0 shadow-2xl shadow-black/10 dark:shadow-black/20">
                <CardHeader className="space-y-1 text-center pb-8">
                  <div className="flex justify-center mb-4">
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                        <UserPlus className="h-8 w-8 text-white" />
                      </div>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-50"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    Join ReferralInc
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Create your account and start building your professional network
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email address
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${
                          errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                        }`}
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <motion.p 
                          className="text-sm text-red-500"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={`h-12 pr-12 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${
                            errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                          }`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <motion.p 
                          className="text-sm text-red-500"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <Label htmlFor="name" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input 
                        id="name" 
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${
                          errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                        }`}
                        disabled={isLoading}
                      />
                      {errors.name && (
                        <motion.p 
                          className="text-sm text-red-500"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </motion.div>
                    
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Label className="text-sm font-medium">Account Type</Label>
                      <RadioGroup 
                        defaultValue={role} 
                        onValueChange={(value) => setRole(value as "candidate" | "employee")} 
                        className="grid grid-cols-2 gap-4"
                        disabled={isLoading}
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RadioGroupItem value="candidate" id="candidate" className="peer sr-only" />
                          <Label
                            htmlFor="candidate"
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-600 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950/30 [&:has([data-state=checked])]:border-blue-500 cursor-pointer transition-all duration-200 group"
                          >
                            <Users className="h-6 w-6 mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Candidate</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">Looking for referrals</span>
                          </Label>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RadioGroupItem value="employee" id="employee" className="peer sr-only" />
                          <Label
                            htmlFor="employee"
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300 dark:hover:border-green-600 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 dark:peer-data-[state=checked]:bg-green-950/30 [&:has([data-state=checked])]:border-green-500 cursor-pointer transition-all duration-200 group"
                          >
                            <Briefcase className="h-6 w-6 mb-2 text-green-600 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Employee</span>
                            <span className="text-xs text-muted-foreground text-center mt-1">Provide referrals</span>
                          </Label>
                        </motion.div>
                      </RadioGroup>
                    </motion.div>
                    
                    {role === "employee" && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label htmlFor="company" className="text-sm font-medium">
                          Company
                        </Label>
                        <Input 
                          id="company" 
                          type="text" 
                          placeholder="Enter your company name"
                          value={formData.company}
                          onChange={(e) => handleInputChange("company", e.target.value)}
                          className={`h-12 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 ${
                            errors.company ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                          }`}
                          disabled={isLoading}
                        />
                        {errors.company && (
                          <motion.p 
                            className="text-sm text-red-500"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            {errors.company}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {role === "employee" ? "Sending verification..." : "Creating account..."}
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          {role === "employee" ? "Send Verification Code" : "Create Account"}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
                
                <div className="px-6 pb-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                        Already have an account?
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center mt-4">
                    <Link 
                      href="/auth/login" 
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Sign in here
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </ClientOnly>
  )
}
