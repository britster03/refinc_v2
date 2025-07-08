"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Bell, BellOff, Settings, Check, X, Clock, User, MessageSquare, TrendingUp } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "referral_update" | "message" | "system" | "achievement"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "low" | "medium" | "high" | "urgent"
  actionUrl?: string
  avatar?: string
  metadata?: Record<string, any>
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "referral_update",
    title: "Referral Status Update",
    message: "Your referral for Sarah Johnson has been accepted by the hiring team",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    priority: "high",
    avatar: "/placeholder.svg?height=32&width=32",
    actionUrl: "/referrals/123",
  },
  {
    id: "2",
    type: "message",
    title: "New Premium Conversation Request",
    message: "Alex Thompson wants to schedule a premium conversation with you",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    priority: "medium",
    avatar: "/placeholder.svg?height=32&width=32",
    actionUrl: "/premium-conversations/456",
  },
  {
    id: "3",
    type: "achievement",
    title: "Milestone Reached!",
    message: "Congratulations! You've successfully referred 25 candidates this quarter",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    priority: "medium",
    metadata: { milestone: "25_referrals" },
  },
  {
    id: "4",
    type: "system",
    title: "System Maintenance",
    message: "Scheduled maintenance will occur tonight from 2-4 AM EST",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
    priority: "low",
  },
]

const notificationSettings = [
  {
    id: "referral_updates",
    label: "Referral Status Updates",
    enabled: true,
    description: "Get notified when referral status changes",
  },
  {
    id: "messages",
    label: "Messages & Conversations",
    enabled: true,
    description: "New messages and conversation requests",
  },
  {
    id: "achievements",
    label: "Achievements & Milestones",
    enabled: true,
    description: "Celebrate your successes and milestones",
  },
  { id: "system", label: "System Notifications", enabled: false, description: "Maintenance and system updates" },
  { id: "weekly_digest", label: "Weekly Digest", enabled: true, description: "Weekly summary of your activity" },
  {
    id: "email_notifications",
    label: "Email Notifications",
    enabled: true,
    description: "Receive notifications via email",
  },
  { id: "push_notifications", label: "Push Notifications", enabled: true, description: "Browser push notifications" },
]

export function RealTimeNotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [settings, setSettings] = useState(notificationSettings)
  const [isConnected, setIsConnected] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Calculate unread count
    const count = notifications.filter((n) => !n.read).length
    setUnreadCount(count)
  }, [notifications])

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        // 20% chance every 5 seconds
        const newNotification: Notification = {
          id: Date.now().toString(),
          type: "referral_update",
          title: "New Activity",
          message: "You have new activity on your referrals",
          timestamp: new Date(),
          read: false,
          priority: "medium",
        }
        setNotifications((prev) => [newNotification, ...prev])
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const toggleSetting = (id: string) => {
    setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50 border-red-200"
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "referral_update":
        return <User className="h-4 w-4" />
      case "message":
        return <MessageSquare className="h-4 w-4" />
      case "achievement":
        return <TrendingUp className="h-4 w-4" />
      case "system":
        return <Settings className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <div>
                <h3 className="font-medium">Real-time Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? "Connected and receiving live updates" : "Disconnected - trying to reconnect..."}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{unreadCount} unread</Badge>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Live Notifications
              </CardTitle>
              <CardDescription>Real-time updates on your referral activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellOff className="mx-auto h-12 w-12 mb-4" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        !notification.read ? "bg-blue-50 border-blue-200" : "bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {notification.avatar ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={notification.avatar || "/placeholder.svg"} />
                              <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                              {getTypeIcon(notification.type)}
                            </div>
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                              <Badge variant="outline" className="text-xs capitalize">
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </span>
                              {notification.actionUrl && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                  View Details
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          {!notification.read && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Customize your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={setting.id} className="font-medium">
                      {setting.label}
                    </Label>
                    <Switch
                      id={setting.id}
                      checked={setting.enabled}
                      onCheckedChange={() => toggleSetting(setting.id)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                  {setting.id !== settings[settings.length - 1].id && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notification Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Stats</CardTitle>
              <CardDescription>Your notification activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                  <div className="text-xs text-muted-foreground">Total Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{unreadCount}</div>
                  <div className="text-xs text-muted-foreground">Unread</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">By Type</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Referral Updates</span>
                    <span>12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Messages</span>
                    <span>8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Achievements</span>
                    <span>3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>System</span>
                    <span>2</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
