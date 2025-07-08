"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BarChart3,
  Bell,
  ChevronDown,
  Coins,
  FileText,
  Home,
  MessageSquare,
  Settings,
  Star,
  User,
  Users,
  ClipboardList,
  Clock,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { NotificationIndicator } from "@/components/notifications/notification-indicator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { UserRole } from "@/types/user"

interface AppSidebarProps {
  userRole: UserRole
  userName: string
  userAvatar?: string
  unreadNotifications: number
}

export function AppSidebar({ userRole, userName, userAvatar, unreadNotifications }: AppSidebarProps) {
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/")

  const userInitials = userName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-lg font-bold text-primary-foreground">R</span>
          </div>
          <div className="font-semibold">ReferralInc</div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/referrals")}>
                  <Link href="/referrals">
                    <FileText className="h-4 w-4" />
                    <span>Referrals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userRole === "employee" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/employees")}>
                    <Link href="/employees">
                      <Users className="h-4 w-4" />
                      <span>Employees</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/notifications")}>
                  <Link href="/notifications">
                    <div className="relative">
                      <Bell className="h-4 w-4" />
                      {unreadNotifications > 0 && <NotificationIndicator count={unreadNotifications} />}
                    </div>
                    <span>Notifications</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/coins")}>
                  <Link href="/coins">
                    <Coins className="h-4 w-4" />
                    <span>Coins & Rewards</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Features</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible className="w-full">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild className="w-full">
                    <SidebarMenuButton>
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                      <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/analytics")}>
                          <Link href="/analytics">Overview</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/analytics/advanced")}>
                          <Link href="/analytics/advanced">Advanced</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isActive("/reports")}>
                          <Link href="/reports">Custom Reports</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/premium-conversations")}>
                  <Link href="/premium-conversations">
                    <MessageSquare className="h-4 w-4" />
                    <span>Premium Conversations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userRole === "candidate" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/free-conversations")}>
                    <Link href="/free-conversations">
                      <MessageSquare className="h-4 w-4" />
                      <span>Free Conversations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {userRole === "employee" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/free-conversations")}>
                    <Link href="/free-conversations/employee">
                      <MessageSquare className="h-4 w-4" />
                      <span>Free Conversations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/resume-analysis")}>
                  <Link href="/resume-analysis">
                    <ClipboardList className="h-4 w-4" />
                    <span>Resume Analysis</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userRole === "employee" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/feedback-analysis")}>
                    <Link href="/feedback-analysis">
                      <Star className="h-4 w-4" />
                      <span>Feedback Analysis</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {userRole === "employee" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/waitlist")}>
                    <Link href="/waitlist">
                      <Clock className="h-4 w-4" />
                      <span>Waitlist</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/profile")}>
                  <Link href="/profile">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")}>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={userAvatar || "/placeholder.svg"} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
