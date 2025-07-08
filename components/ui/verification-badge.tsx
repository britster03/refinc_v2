"use client"

import { CheckCircle, ShieldCheck, Verified } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface VerificationBadgeProps {
  isVerified: boolean
  variant?: "icon" | "badge" | "text" | "minimal"
  size?: "sm" | "md" | "lg"
  className?: string
  showTooltip?: boolean
  tooltipText?: string
}

export function VerificationBadge({ 
  isVerified, 
  variant = "icon",
  size = "md",
  className,
  showTooltip = true,
  tooltipText = "Email verified through OTP verification"
}: VerificationBadgeProps) {
  if (!isVerified) return null

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  }

  const badgeSizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1"
  }

  const renderBadgeContent = () => {
    switch (variant) {
      case "icon":
        return (
          <div className={cn(
            "bg-green-500 text-white rounded-full p-1 shadow-sm",
            className
          )}>
            <CheckCircle className={sizeClasses[size]} />
          </div>
        )
      
      case "badge":
        return (
          <Badge 
            variant="secondary" 
            className={cn(
              "bg-green-100 text-green-800 border-green-200 flex items-center gap-1",
              badgeSizeClasses[size],
              className
            )}
          >
            <CheckCircle className={sizeClasses[size]} />
            <span>Verified</span>
          </Badge>
        )
      
      case "text":
        return (
          <div className={cn(
            "flex items-center gap-1 text-green-700",
            size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs",
            className
          )}>
            <CheckCircle className={sizeClasses[size]} />
            <span>Email Verified</span>
          </div>
        )
      
      case "minimal":
        return (
          <ShieldCheck className={cn(
            "text-green-600",
            sizeClasses[size],
            className
          )} />
        )
      
      default:
        return (
          <div className={cn(
            "bg-green-500 text-white rounded-full p-1",
            className
          )}>
            <CheckCircle className={sizeClasses[size]} />
          </div>
        )
    }
  }

  const content = renderBadgeContent()

  if (!showTooltip) {
    return content
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">✅ Verified Employee</p>
            <p className="text-sm text-muted-foreground">{tooltipText}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Specific variants for common use cases
export function ProfileVerificationBadge({ isVerified, className }: { isVerified: boolean; className?: string }) {
  return (
    <VerificationBadge 
      isVerified={isVerified}
      variant="icon"
      size="md"
      className={cn("absolute -bottom-1 -right-1", className)}
      tooltipText="Employee verified through company email OTP"
    />
  )
}

export function ListVerificationBadge({ isVerified, className }: { isVerified: boolean; className?: string }) {
  return (
    <VerificationBadge 
      isVerified={isVerified}
      variant="minimal"
      size="sm"
      className={className}
      tooltipText="OTP verified employee"
    />
  )
}

export function DetailedVerificationBadge({ isVerified, className }: { isVerified: boolean; className?: string }) {
  return (
    <VerificationBadge 
      isVerified={isVerified}
      variant="badge"
      size="md"
      className={className}
      tooltipText="Email verified through company OTP verification"
    />
  )
} 