"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, Clock, Settings, Star, Zap, AlertCircle, Info, X } from "lucide-react"

interface Notification {
  id: string
  type: "reminder" | "update" | "achievement" | "alert" | "tip"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "high" | "medium" | "low"
  actionUrl?: string
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "reminder",
    title: "Follow-up Reminder",
    message: "Time to follow up on your application to TechCorp (applied 1 week ago)",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    priority: "high",
  },
  {
    id: "2",
    type: "update",
    title: "Application Status Update",
    message: "Your application to StartupXYZ has been viewed by the hiring manager",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: false,
    priority: "medium",
  },
  {
    id: "3",
    type: "achievement",
    title: "Milestone Reached!",
    message: "Congratulations! You've reached 100 job applications this month",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
    priority: "medium",
  },
  {
    id: "4",
    type: "tip",
    title: "AI Resume Tip",
    message: "Add 'TypeScript' to your skills to increase match rate by 15%",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: false,
    priority: "low",
  },
  {
    id: "5",
    type: "alert",
    title: "Interview Scheduled",
    message: "Interview with InnovateLab scheduled for tomorrow at 2:00 PM",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: true,
    priority: "high",
  },
]

export function NotificationCenter() {
  const [notificationList, setNotificationList] = useState(notifications)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    followUpReminders: true,
    applicationUpdates: true,
    aiInsights: true,
    weeklyReports: true,
  })

  const markAsRead = (id: string) => {
    setNotificationList((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotificationList((prev) => prev.filter((notif) => notif.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "update":
        return <Info className="h-4 w-4 text-blue-600" />
      case "achievement":
        return <Star className="h-4 w-4 text-yellow-600" />
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "tip":
        return <Zap className="h-4 w-4 text-purple-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-500"
    }
  }

  const unreadCount = notificationList.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">{unreadCount} unread notifications</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notificationList.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationList
            notifications={notificationList}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
          />
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <NotificationList
            notifications={notificationList.filter((n) => !n.read)}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
          />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <NotificationList
            notifications={notificationList.filter((n) => n.type === "reminder")}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
          />
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <NotificationList
            notifications={notificationList.filter((n) => n.type === "update")}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Customize how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Follow-up Reminders</p>
                      <p className="text-xs text-muted-foreground">Reminders to follow up on applications</p>
                    </div>
                    <Switch
                      checked={settings.followUpReminders}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, followUpReminders: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Application Updates</p>
                      <p className="text-xs text-muted-foreground">Status changes on your applications</p>
                    </div>
                    <Switch
                      checked={settings.applicationUpdates}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, applicationUpdates: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">AI Insights & Tips</p>
                      <p className="text-xs text-muted-foreground">Personalized recommendations from AI</p>
                    </div>
                    <Switch
                      checked={settings.aiInsights}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, aiInsights: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Weekly Reports</p>
                      <p className="text-xs text-muted-foreground">Weekly summary of your job search progress</p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationList({
  notifications,
  onMarkAsRead,
  onDelete,
  getNotificationIcon,
  getPriorityColor,
}: {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getNotificationIcon: (type: string) => React.ReactNode
  getPriorityColor: (priority: string) => string
}) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
          <p className="text-muted-foreground text-center">You're all caught up! New notifications will appear here.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`border-l-4 ${getPriorityColor(notification.priority)} ${
            !notification.read ? "bg-blue-50/50" : ""
          }`}
        >
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3 flex-1">
                <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    <Badge variant="outline" className="text-xs">
                      {notification.type}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{notification.timestamp.toLocaleString()}</span>
                    <Badge
                      variant={
                        notification.priority === "high"
                          ? "destructive"
                          : notification.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {notification.priority} priority
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-1 ml-2">
                {!notification.read && (
                  <Button variant="ghost" size="sm" onClick={() => onMarkAsRead(notification.id)}>
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => onDelete(notification.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {notification.actionUrl && (
              <div className="mt-3">
                <Button variant="outline" size="sm">
                  Take Action
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
