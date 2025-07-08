import { authClient } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface NotificationData {
  id: number
  user_id: number
  type: string
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
}

export interface NotificationsResponse {
  notifications: NotificationData[]
  total: number
  unread_count: number
  limit: number
  offset: number
}

export interface UnreadCountResponse {
  count: number
}

export interface BroadcastRequest {
  title: string
  message: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

export class NotificationsAPI {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(
    unreadOnly: boolean = false,
    limit: number = 50,
    offset: number = 0
  ): Promise<NotificationsResponse> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const params = new URLSearchParams({
      unread_only: unreadOnly.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    })

    const response = await fetch(`${API_BASE_URL}/notifications/?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to get notifications: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(notificationId: number): Promise<void> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to mark notification as read: ${response.status}`)
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<void> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to mark all notifications as read: ${response.status}`)
    }
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(notificationId: number): Promise<void> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to delete notification: ${response.status}`)
    }
  }

  /**
   * Get count of unread notifications
   */
  static async getUnreadCount(): Promise<number> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to get unread count: ${response.status}`)
    }

    const data: UnreadCountResponse = await response.json()
    return data.count
  }

  /**
   * Broadcast notification to all users (admin only)
   */
  static async broadcastNotification(request: BroadcastRequest): Promise<void> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const params = new URLSearchParams({
      title: request.title,
      message: request.message,
      ...(request.priority && { priority: request.priority })
    })

    const response = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      
      if (response.status === 403) {
        throw new Error('Only administrators can broadcast notifications')
      }
      
      throw new Error(errorData.detail || `Failed to broadcast notification: ${response.status}`)
    }
  }

  /**
   * Get notification icon based on type
   */
  static getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'referral_received': '⏰',
      'referral_accepted': '✅',
      'referral_rejected': '❌',
      'referral_status_update': '📋',
      'message_received': '💬',
      'profile_updated': '👤',
      'feedback_received': '📝',
      'conversation_requested': '🎯',
      'conversation_accepted': '✅',
      'payment_completed': '💳',
      'system_announcement': '📢'
    }
    
    return iconMap[type] || '📬'
  }

  /**
   * Get notification priority color
   */
  static getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'low': 'text-blue-500',
      'medium': 'text-yellow-500', 
      'high': 'text-orange-500',
      'urgent': 'text-red-500'
    }
    
    return colorMap[priority] || 'text-gray-500'
  }

  /**
   * Get relative time display
   */
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  /**
   * Get notification link based on type and data
   */
  static getNotificationLink(notification: NotificationData): string {
    const { type, data } = notification
    
    switch (type) {
      case 'referral_received':
        return data?.referral_id ? `/referrals/employee/${data.referral_id}` : '/referrals'
      case 'referral_accepted':
      case 'referral_rejected':
      case 'referral_status_update':
        return data?.referral_id ? `/referrals/${data.referral_id}` : '/referrals'
      case 'message_received':
        return data?.conversation_id ? `/conversations/${data.conversation_id}` : '/conversations'
      case 'profile_updated':
        return '/profile'
      case 'feedback_received':
        return data?.referral_id ? `/referrals/${data.referral_id}/feedback` : '/referrals'
      case 'conversation_requested':
      case 'conversation_accepted':
        return data?.conversation_id ? `/conversations/${data.conversation_id}` : '/conversations'
      case 'payment_completed':
        return '/billing'
      default:
        return '/notifications'
    }
  }

  /**
   * Format notification data for display
   */
  static formatNotification(notification: NotificationData) {
    return {
      ...notification,
      icon: this.getNotificationIcon(notification.type),
      priorityColor: this.getPriorityColor(notification.priority),
      relativeTime: this.getRelativeTime(notification.created_at),
      link: this.getNotificationLink(notification)
    }
  }
} 