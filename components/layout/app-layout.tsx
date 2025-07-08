"use client"

import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import type { UserRole } from "@/types/user"

interface AppLayoutProps {
  children: React.ReactNode
  userRole: UserRole
  userName: string
  userAvatar?: string
  unreadNotifications?: number
}

export function AppLayout({ children, userRole, userName, userAvatar, unreadNotifications = 0 }: AppLayoutProps) {
  return (
    <NotificationProvider>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar
            userRole={userRole}
            userName={userName}
            userAvatar={userAvatar}
            unreadNotifications={unreadNotifications}
          />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </SidebarProvider>
    </NotificationProvider>
  )
}
