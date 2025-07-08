import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function SettingsSection({ 
  title, 
  description, 
  icon, 
  children, 
  className 
}: SettingsSectionProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
} 