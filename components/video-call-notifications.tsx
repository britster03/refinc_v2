"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Users, 
  UserPlus, 
  UserMinus,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone
} from "lucide-react"

interface NotificationEvent {
  id: string
  type: "join" | "leave" | "mute" | "unmute" | "video_on" | "video_off" | "connection" | "warning" | "info"
  user: string
  message: string
  timestamp: Date
  duration?: number
}

interface VideoCallNotificationsProps {
  events: NotificationEvent[]
  onDismiss?: (id: string) => void
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  maxVisible?: number
}

export default function VideoCallNotifications({
  events,
  onDismiss,
  position = "top-right",
  maxVisible = 3
}: VideoCallNotificationsProps) {
  const [visibleEvents, setVisibleEvents] = useState<NotificationEvent[]>([])

  useEffect(() => {
    // Show only the most recent events
    const recentEvents = events.slice(-maxVisible)
    setVisibleEvents(recentEvents)

    // Auto-dismiss info events after 5 seconds
    recentEvents.forEach(event => {
      if (event.type === "info" && event.duration !== -1) {
        setTimeout(() => {
          if (onDismiss) {
            onDismiss(event.id)
          }
        }, event.duration || 5000)
      }
    })
  }, [events, maxVisible, onDismiss])

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4"
      case "bottom-right":
        return "bottom-4 right-4"
      case "bottom-left":
        return "bottom-4 left-4"
      default:
        return "top-4 right-4"
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "join":
        return <UserPlus className="w-4 h-4 text-green-500" />
      case "leave":
        return <UserMinus className="w-4 h-4 text-red-500" />
      case "mute":
        return <MicOff className="w-4 h-4 text-yellow-500" />
      case "unmute":
        return <Mic className="w-4 h-4 text-green-500" />
      case "video_on":
        return <Video className="w-4 h-4 text-green-500" />
      case "video_off":
        return <VideoOff className="w-4 h-4 text-yellow-500" />
      case "connection":
        return <Wifi className="w-4 h-4 text-blue-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case "join":
        return "bg-green-50 border-green-200"
      case "leave":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-orange-50 border-orange-200"
      case "connection":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  if (visibleEvents.length === 0) {
    return null
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm`}>
      {visibleEvents.map((event) => (
        <Card
          key={event.id}
          className={`${getBackgroundColor(event.type)} shadow-lg animate-in slide-in-from-right duration-300`}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.user}
                  </p>
                  <span className="text-xs text-gray-500">
                    {event.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {event.message}
                </p>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(event.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Hook for managing video call notifications
export function useVideoCallNotifications() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([])

  const addNotification = (
    type: NotificationEvent["type"],
    user: string,
    message: string,
    duration?: number
  ) => {
    const notification: NotificationEvent = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      user,
      message,
      timestamp: new Date(),
      duration
    }

    setNotifications(prev => [...prev, notification])
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Convenience methods
  const notifyUserJoined = (userName: string) => {
    addNotification("join", userName, "joined the call", 3000)
  }

  const notifyUserLeft = (userName: string) => {
    addNotification("leave", userName, "left the call", 3000)
  }

  const notifyUserMuted = (userName: string) => {
    addNotification("mute", userName, "muted their microphone", 2000)
  }

  const notifyUserUnmuted = (userName: string) => {
    addNotification("unmute", userName, "unmuted their microphone", 2000)
  }

  const notifyVideoOn = (userName: string) => {
    addNotification("video_on", userName, "turned on their camera", 2000)
  }

  const notifyVideoOff = (userName: string) => {
    addNotification("video_off", userName, "turned off their camera", 2000)
  }

  const notifyConnectionIssue = (userName: string) => {
    addNotification("warning", userName, "is experiencing connection issues", 5000)
  }

  const notifyReconnected = (userName: string) => {
    addNotification("connection", userName, "reconnected successfully", 3000)
  }

  const notifyCallStarted = () => {
    addNotification("info", "System", "Video call started", 3000)
  }

  const notifyCallEnded = () => {
    addNotification("info", "System", "Video call ended", 3000)
  }

  const notifyRecordingStarted = () => {
    addNotification("warning", "System", "Recording started - all participants will be notified", 5000)
  }

  const notifyRecordingStopped = () => {
    addNotification("info", "System", "Recording stopped", 3000)
  }

  const notifyScreenShareStarted = (userName: string) => {
    addNotification("info", userName, "started sharing their screen", 3000)
  }

  const notifyScreenShareStopped = (userName: string) => {
    addNotification("info", userName, "stopped sharing their screen", 3000)
  }

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    // Convenience methods
    notifyUserJoined,
    notifyUserLeft,
    notifyUserMuted,
    notifyUserUnmuted,
    notifyVideoOn,
    notifyVideoOff,
    notifyConnectionIssue,
    notifyReconnected,
    notifyCallStarted,
    notifyCallEnded,
    notifyRecordingStarted,
    notifyRecordingStopped,
    notifyScreenShareStarted,
    notifyScreenShareStopped
  }
} 