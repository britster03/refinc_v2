"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, Clock, RefreshCw, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface OTPVerificationProps {
  email: string
  onVerificationSuccess: (otpCode: string) => void
  onRequestNewOTP: () => void
  isLoading?: boolean
  countdown?: number
}

export default function OTPVerification({
  email,
  onVerificationSuccess,
  onRequestNewOTP,
  isLoading = false,
  countdown = 0
}: OTPVerificationProps) {
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(countdown)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  useEffect(() => {
    setTimeLeft(countdown)
  }, [countdown])

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters

    const newOtpCode = [...otpCode]
    newOtpCode[index] = value

    setOtpCode(newOtpCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newOtpCode.every(digit => digit !== "") && !isVerifying) {
      handleVerify(newOtpCode.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    
    if (pastedData.length === 6) {
      const newOtpCode = pastedData.split("")
      setOtpCode(newOtpCode)
      
      // Auto-submit pasted OTP
      if (!isVerifying) {
        handleVerify(pastedData)
      }
    }
  }

  const handleVerify = async (code?: string) => {
    const codeToVerify = code || otpCode.join("")
    
    if (codeToVerify.length !== 6) {
      toast.error("Please enter a complete 6-digit verification code")
      return
    }

    setIsVerifying(true)
    try {
      await onVerificationSuccess(codeToVerify)
    } catch (error) {
      // Reset OTP inputs on error
      setOtpCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRequestNew = () => {
    setOtpCode(["", "", "", "", "", ""])
    onRequestNewOTP()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
            >
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
            
            <div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 mt-2">
                We've sent a 6-digit verification code to
                <br />
                <span className="font-medium text-slate-900 dark:text-slate-100">{maskedEmail}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Verification Code
              </Label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otpCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-bold border-2 focus:border-blue-500 focus:ring-blue-500/20"
                    disabled={isLoading || isVerifying}
                  />
                ))}
              </div>
            </div>

            {/* Timer Display */}
            {timeLeft > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400"
              >
                <Clock className="w-4 h-4" />
                <span>Code expires in {formatTime(timeLeft)}</span>
              </motion.div>
            )}

            {/* Verify Button */}
            <Button
              onClick={() => handleVerify()}
              disabled={isLoading || isVerifying || otpCode.some(digit => digit === "")}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Email
                </>
              )}
            </Button>

            {/* Request New Code */}
            <div className="text-center">
              <button
                onClick={handleRequestNew}
                disabled={isLoading || timeLeft > 0}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:text-slate-400 disabled:no-underline flex items-center gap-1 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                {timeLeft > 0 ? "Request new code available soon" : "Didn't receive a code? Send new one"}
              </button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center space-y-1">
              <p>Check your spam folder if you don't see the email</p>
              <p>Make sure you're using your company email address</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
} 