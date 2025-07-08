import type { User } from "./user"

export type ConversationStatus = "requested" | "accepted" | "scheduled" | "completed" | "cancelled"

export interface Message {
  id: string
  conversationId: string
  senderId: string
  sender?: User
  content: string
  attachments?: string[]
  createdAt: Date
}

export interface Conversation {
  id: string
  candidateId: string
  candidate?: User
  employeeId: string
  employee?: User
  status: ConversationStatus
  scheduledAt?: Date
  completedAt?: Date
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}
