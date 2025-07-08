"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Timestamp } from "@/components/ui/timestamp"
import { useNotifications } from "@/components/notifications/notification-provider"
import { NotificationIndicator } from "@/components/notifications/notification-indicator"
import type { Notification } from "@/types/notification"
import Link from "next/link"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setOpen(false)
  }

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case "referral_status_change":
        return `/referrals/${notification.data?.referralId}`
      case "premium_conversation_request":
      case "premium_conversation_accepted":
        return `/premium-conversations/${notification.data?.conversationId}`
      case "feedback_request":
        return `/referrals/${notification.data?.referralId}/feedback`
      case "waitlist_position_change":
        return "/waitlist"
      case "ai_analysis_complete":
        return `/resume-analysis/${notification.data?.analysisId}`
      default:
        return "/notifications"
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && <NotificationIndicator count={unreadCount} />}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="text-base">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-8">
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-0"
                onSelect={(e) => e.preventDefault()}
              >
                <Link
                  href={getNotificationLink(notification)}
                  className="flex w-full flex-col gap-1 p-3 hover:bg-accent"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{notification.title}</span>
                    <Timestamp 
                      date={notification.createdAt} 
                      variant="compact"
                      className="whitespace-nowrap"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  {!notification.read && <div className="mt-1 h-2 w-2 rounded-full bg-primary self-end" />}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer justify-center">
          <Link href="/notifications" className="w-full text-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
