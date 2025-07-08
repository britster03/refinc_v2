"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Bell, 
  User,
  FileText,
  Target,
  CreditCard,
  Megaphone,
  Loader2,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { NotificationsAPI, type NotificationData } from "@/lib/api/notifications"
import { authClient } from "@/lib/auth"
import { toast } from "sonner"
import { Timestamp } from "@/components/ui/timestamp"

interface FormattedNotification extends NotificationData {
  icon: React.ReactNode
  priorityColor: string
  link: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<FormattedNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [userRole, setUserRole] = useState<string>("")

  // Get notification icon component
  const getNotificationIconComponent = (type: string): React.ReactNode => {
    const iconProps = { className: "h-5 w-5" }
    
    switch (type) {
      case "referral_accepted":
        return <CheckCircle {...iconProps} className="h-5 w-5 text-green-500" />
      case "referral_rejected":
        return <XCircle {...iconProps} className="h-5 w-5 text-red-500" />
      case "referral_received":
        return <Clock {...iconProps} className="h-5 w-5 text-yellow-500" />
      case "referral_status_update":
        return <FileText {...iconProps} className="h-5 w-5 text-blue-500" />
      case "message_received":
        return <MessageSquare {...iconProps} className="h-5 w-5 text-blue-500" />
      case "profile_updated":
        return <User {...iconProps} className="h-5 w-5 text-purple-500" />
      case "feedback_received":
        return <FileText {...iconProps} className="h-5 w-5 text-orange-500" />
      case "conversation_requested":
      case "conversation_accepted":
        return <Target {...iconProps} className="h-5 w-5 text-indigo-500" />
      case "payment_completed":
        return <CreditCard {...iconProps} className="h-5 w-5 text-green-500" />
      case "system_announcement":
        return <Megaphone {...iconProps} className="h-5 w-5 text-gray-500" />
      default:
        return <Bell {...iconProps} className="h-5 w-5 text-muted-foreground" />
    }
  }

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await NotificationsAPI.getNotifications()
      
      const formattedNotifications = response.notifications.map(notification => ({
        ...notification,
        icon: getNotificationIconComponent(notification.type),
        priorityColor: NotificationsAPI.getPriorityColor(notification.priority),
        link: NotificationsAPI.getNotificationLink(notification)
      }))
      
      setNotifications(formattedNotifications)
      setUnreadCount(response.unread_count)
      
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await NotificationsAPI.markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true)
      await NotificationsAPI.markAllAsRead()
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      )
      setUnreadCount(0)
      
      toast.success('All notifications marked as read')
      
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    } finally {
      setMarkingAllRead(false)
    }
  }

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    try {
      await NotificationsAPI.deleteNotification(notificationId)
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success('Notification deleted')
      
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  // Get user role and load notifications on mount
  useEffect(() => {
    const session = authClient.getSession()
    if (session?.user) {
      setUserRole(session.user.role)
    }
    
    loadNotifications()
  }, [])

  // No need to refresh timestamps since we use the Timestamp component now

  const unreadNotifications = notifications.filter(n => !n.read)

  // Helper to get dashboard role
  const getDashboardRole = () => {
    if (userRole === "admin") return "employee" // Admin can access employee views
    return (userRole as "candidate" | "employee") || "candidate"
  }

  if (loading) {
    return (
      <DashboardLayout role={getDashboardRole()}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading notifications...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={getDashboardRole()}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your referral activities</p>
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Marking all as read...
                </>
              ) : (
                'Mark all as read'
              )}
            </Button>
          )}
        </div>

        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="outline" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge variant="outline" className="ml-2">
                  {unreadCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-0">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 font-medium">No notifications</h3>
                    <p className="text-sm text-muted-foreground">You don't have any notifications at the moment.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors ${
                          !notification.read ? "bg-muted/30" : ""
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {notification.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <Link
                            href={notification.link}
                            className="block"
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id)
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Timestamp 
                                    date={notification.created_at}
                                    variant="muted"
                                  />
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${notification.priorityColor}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault()
                                markAsRead(notification.id)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              deleteNotification(notification.id)
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unread" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-0">
                {unreadNotifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 font-medium">No unread notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      All your notifications have been read.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {unreadNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors bg-muted/30"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {notification.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <Link
                            href={notification.link}
                            className="block"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-foreground">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Timestamp 
                                    date={notification.created_at}
                                    variant="muted"
                                  />
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${notification.priorityColor}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              markAsRead(notification.id)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              deleteNotification(notification.id)
                            }}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
