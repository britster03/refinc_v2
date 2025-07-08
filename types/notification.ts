import type { User } from "./user"

export type NotificationType =
  | "referral_received"
  | "referral_accepted" 
  | "referral_rejected"
  | "referral_status_update"
  | "message_received"
  | "profile_updated"
  | "feedback_received"
  | "conversation_requested"
  | "conversation_accepted"
  | "payment_completed"
  | "system_announcement"
  | "referral_status_change"
  | "new_referral"
  | "feedback_request"
  | "premium_conversation_request"
  | "premium_conversation_accepted"
  | "waitlist_position_change"
  | "ai_analysis_complete"
  | "system"

export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export interface Notification {
  id: string
  userId: string
  user?: User
  type: NotificationType
  title: string
  message: string
  read: boolean
  data?: Record<string, any>
  createdAt: Date
  priority?: NotificationPriority
}
