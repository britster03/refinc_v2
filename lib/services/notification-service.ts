import { NotificationSettings } from "@/lib/api/settings"

export interface NotificationPayload {
  userId: string | number
  type: 'email' | 'push' | 'in-app'
  title: string
  message: string
  data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high'
  category?: 'referral' | 'message' | 'system' | 'marketing'
}

export interface EmailPayload extends NotificationPayload {
  type: 'email'
  template?: string
  recipientEmail: string
  subject?: string
}

export interface PushPayload extends NotificationPayload {
  type: 'push'
  deviceTokens?: string[]
  icon?: string
  badge?: number
  sound?: string
}

class NotificationService {
  // Check if notification should be sent based on user settings
  private shouldSendNotification(
    settings: NotificationSettings, 
    payload: NotificationPayload
  ): boolean {
    // Check if notifications are enabled globally
    if (!settings.email_notifications && payload.type === 'email') {
      return false
    }
    
    if (!settings.push_notifications && payload.type === 'push') {
      return false
    }

    // Check category-specific settings
    switch (payload.category) {
      case 'referral':
        return settings.referral_updates
      case 'message':
        return settings.message_notifications
      case 'system':
        return settings.system_notifications
      case 'marketing':
        return settings.marketing_emails
      default:
        return true
    }
  }

  // Check notification frequency preferences
  private shouldSendBasedOnFrequency(
    settings: NotificationSettings,
    payload: NotificationPayload,
    lastSentTime?: Date
  ): boolean {
    // High priority notifications always go through
    if (payload.priority === 'high') {
      return true
    }

    const now = new Date()
    
    switch (settings.notification_frequency) {
      case 'instant':
        return true
      case 'hourly':
        if (!lastSentTime) return true
        return (now.getTime() - lastSentTime.getTime()) >= 60 * 60 * 1000 // 1 hour
      case 'daily':
        if (!lastSentTime) return true
        return (now.getTime() - lastSentTime.getTime()) >= 24 * 60 * 60 * 1000 // 24 hours
      case 'weekly':
        if (!lastSentTime) return true
        return (now.getTime() - lastSentTime.getTime()) >= 7 * 24 * 60 * 60 * 1000 // 7 days
      default:
        return true
    }
  }

  // Send email notification
  async sendEmail(payload: EmailPayload, settings: NotificationSettings): Promise<boolean> {
    if (!this.shouldSendNotification(settings, payload)) {
      console.log(`Email notification blocked by user settings for user ${payload.userId}`)
      return false
    }

    try {
      // In a real implementation, this would integrate with an email service like:
      // - SendGrid
      // - AWS SES  
      // - Resend
      // - Mailgun
      
      const emailData = {
        to: payload.recipientEmail,
        subject: payload.subject || payload.title,
        html: this.generateEmailTemplate(payload),
        userId: payload.userId,
        category: payload.category,
        timestamp: new Date().toISOString()
      }

      console.log('📧 Email notification would be sent:', emailData)
      
      // Simulate API call
      // await fetch('/api/send-email', { method: 'POST', body: JSON.stringify(emailData) })
      
      return true
    } catch (error) {
      console.error('Failed to send email notification:', error)
      return false
    }
  }

  // Send push notification
  async sendPush(payload: PushPayload, settings: NotificationSettings): Promise<boolean> {
    if (!this.shouldSendNotification(settings, payload)) {
      console.log(`Push notification blocked by user settings for user ${payload.userId}`)
      return false
    }

    try {
      // In a real implementation, this would integrate with:
      // - Firebase Cloud Messaging (FCM)
      // - Apple Push Notification Service (APNs)
      // - OneSignal
      // - Pusher
      
      const pushData = {
        userId: payload.userId,
        title: payload.title,
        body: payload.message,
        data: payload.data,
        icon: payload.icon || '/icons/notification-icon.png',
        badge: payload.badge || 1,
        sound: payload.sound || 'default',
        category: payload.category,
        timestamp: new Date().toISOString()
      }

      console.log('📱 Push notification would be sent:', pushData)
      
      // Simulate API call
      // await fetch('/api/send-push', { method: 'POST', body: JSON.stringify(pushData) })
      
      return true
    } catch (error) {
      console.error('Failed to send push notification:', error)
      return false
    }
  }

  // Send in-app notification (this still goes through - only email/push are filtered)
  async sendInApp(payload: NotificationPayload): Promise<boolean> {
    try {
      // This would integrate with the notifications API
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: payload.userId,
          type: payload.category || 'general',
          title: payload.title,
          message: payload.message,
          data: payload.data,
          priority: payload.priority || 'normal'
        })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to send in-app notification:', error)
      return false
    }
  }

  // Generate email template
  private generateEmailTemplate(payload: EmailPayload): string {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${payload.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${payload.title}</h2>
            </div>
            <div class="content">
              <p>${payload.message}</p>
              ${payload.data?.actionUrl ? `<a href="${payload.data.actionUrl}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Take Action</a>` : ''}
            </div>
            <div class="footer">
              <p>You're receiving this email because you have notifications enabled. You can update your preferences in Settings.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    return baseTemplate
  }

  // Weekly digest functionality
  async sendWeeklyDigest(userId: string | number, settings: NotificationSettings): Promise<boolean> {
    if (!settings.weekly_digest) {
      return false
    }

    // This would gather weekly stats and send a summary
    const digestPayload: EmailPayload = {
      userId,
      type: 'email',
      title: 'Your Weekly ReferralInc Summary',
      message: 'Here\'s what happened this week...',
      category: 'system',
      priority: 'low',
      recipientEmail: '', // Would get from user profile
      template: 'weekly-digest'
    }

    return this.sendEmail(digestPayload, settings)
  }

  // Marketing email functionality
  async sendMarketingEmail(
    userId: string | number, 
    settings: NotificationSettings,
    campaign: {
      title: string
      content: string
      actionUrl?: string
    }
  ): Promise<boolean> {
    if (!settings.marketing_emails) {
      return false
    }

    const marketingPayload: EmailPayload = {
      userId,
      type: 'email',
      title: campaign.title,
      message: campaign.content,
      category: 'marketing',
      priority: 'low',
      recipientEmail: '', // Would get from user profile
      data: { actionUrl: campaign.actionUrl }
    }

    return this.sendEmail(marketingPayload, settings)
  }
}

export const notificationService = new NotificationService()