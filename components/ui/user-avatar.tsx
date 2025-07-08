"use client"

import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  src?: string
  alt: string
  name: string
  className?: string
  fallbackClassName?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12", 
  lg: "h-16 w-16",
  xl: "h-32 w-32"
}

const fallbackSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg", 
  xl: "text-2xl"
}

export function UserAvatar({ 
  src, 
  alt, 
  name, 
  className,
  fallbackClassName,
  size = "md" 
}: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage 
        src={src || undefined} 
        alt={alt}
        onError={(e) => {
          // Hide broken images to show fallback
          e.currentTarget.style.display = 'none'
        }}
      />
      <AvatarFallback 
        className={cn(
          "bg-primary/10 text-primary font-medium",
          fallbackSizeClasses[size],
          fallbackClassName
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
} 