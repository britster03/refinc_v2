"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ProfileVerificationBadge } from "@/components/ui/verification-badge"
import { Star, TrendingUp, Users, MessageSquare } from "lucide-react"

interface EmployeeProfileCardProps {
  employee?: {
    id: string
    name: string
    role: string
    department: string
    avatar?: string
    rating: number
    totalReferrals: number
    successRate: number
    responseTime: string
    skills: string[]
    engagementScore: number
    isVerified?: boolean
  }
}

export function EmployeeProfileCard({ employee }: EmployeeProfileCardProps) {
  // Mock data if no employee provided
  const defaultEmployee = {
    id: "1",
    name: "Sarah Johnson",
    role: "Senior Software Engineer",
    department: "Engineering",
    avatar: "/placeholder.svg?height=64&width=64",
    rating: 4.8,
    totalReferrals: 23,
    successRate: 78,
    responseTime: "2.3 hours",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    engagementScore: 92,
    isVerified: true,
  }

  const emp = employee || defaultEmployee

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={emp.avatar || "/placeholder.svg"} alt={emp.name} />
              <AvatarFallback>
                {emp.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <ProfileVerificationBadge isVerified={emp.isVerified || false} />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="font-semibold text-lg">{emp.name}</h3>
              <p className="text-sm text-muted-foreground">{emp.role}</p>
              <Badge variant="secondary" className="text-xs">
                {emp.department}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{emp.rating}</span>
              <span className="text-xs text-muted-foreground">({emp.totalReferrals} referrals)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-medium">{emp.successRate}%</span>
            </div>
            <Progress value={emp.successRate} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium">{emp.engagementScore}%</span>
            </div>
            <Progress value={emp.engagementScore} className="h-2" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm font-medium">{emp.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">Referrals</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-sm font-medium">{emp.successRate}%</div>
            <div className="text-xs text-muted-foreground">Success</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-sm font-medium">{emp.responseTime}</div>
            <div className="text-xs text-muted-foreground">Response</div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Skills</h4>
          <div className="flex flex-wrap gap-1">
            {emp.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button size="sm" className="flex-1">
            View Profile
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
