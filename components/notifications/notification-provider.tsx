"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { NotificationsAPI, type NotificationData } from "@/lib/api/notifications"
import type { Notification } from "@/types/notification"
import { safeParseDate } from "@/lib/utils/date"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Convert API notification to component notification format
  const convertApiNotification = (apiNotification: NotificationData): Notification => {
    return {
      id: apiNotification.id.toString(),
      userId: apiNotification.user_id.toString(),
      type: apiNotification.type as any,
      title: apiNotification.title,
      message: apiNotification.message,
      read: apiNotification.read,
      data: apiNotification.data || {},
      createdAt: safeParseDate(apiNotification.created_at),
      priority: apiNotification.priority
    }
  }

  // Fetch notifications from API
  const refreshNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await NotificationsAPI.getNotifications(false, 20, 0)
      
      const convertedNotifications = response.notifications.map(convertApiNotification)
      setNotifications(convertedNotifications)
      setUnreadCount(response.unread_count)
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      // Don't show error toast for every failed fetch, just log it
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshNotifications])

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev])
    setUnreadCount((prev) => prev + 1)

    // Show toast for new notifications
    toast({
      title: notification.title,
      description: notification.message,
      duration: 5000,
    })
  }

  const markAsRead = async (id: string) => {
    try {
      await NotificationsAPI.markAsRead(parseInt(id))
      
      setNotifications((prev) =>
        prev.map((notification) => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      )
      
      setUnreadCount((prev) => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      await NotificationsAPI.markAllAsRead()
      
      setNotifications((prev) => 
        prev.map((notification) => ({ ...notification, read: true }))
      )
      setUnreadCount(0)
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
        duration: 3000,
      })
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast({
        title: "Error", 
        description: "Failed to mark all notifications as read",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const removeNotification = async (id: string) => {
    try {
      await NotificationsAPI.deleteNotification(parseInt(id))
      
      const deletedNotification = notifications.find(n => n.id === id)
      setNotifications((prev) => prev.filter((notification) => notification.id !== id))
      
      // Update unread count if deleted notification was unread
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      
      toast({
        title: "Success",
        description: "Notification deleted",
        duration: 3000,
      })
      
    } catch (error) {
      console.error('Failed to delete notification:', error)
      toast({
        title: "Error",
        description: "Failed to delete notification", 
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
