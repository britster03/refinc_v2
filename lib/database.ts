// Database utilities and connection management
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database schemas and types
export interface DatabaseUser {
  id: string
  email: string
  name: string
  role: "candidate" | "employee" | "admin"
  avatar_url?: string
  department?: string
  position?: string
  bio?: string
  skills?: string[]
  experience_years?: number
  rating?: number
  created_at: string
  updated_at: string
}

export interface DatabaseReferral {
  id: string
  candidate_id: string
  employee_id: string
  position: string
  department: string
  company: string
  status:
    | "pending"
    | "reviewing"
    | "interview_scheduled"
    | "interview_completed"
    | "offer_extended"
    | "hired"
    | "rejected"
  notes?: string
  resume_url?: string
  ai_analysis_score?: number
  ai_analysis_summary?: string
  feedback_score?: number
  feedback_comments?: string[]
  created_at: string
  updated_at: string
}

export interface DatabaseConversation {
  id: string
  candidate_id: string
  employee_id: string
  status: "requested" | "accepted" | "scheduled" | "completed" | "cancelled"
  scheduled_at?: string
  completed_at?: string
  payment_amount?: number
  payment_status?: "pending" | "completed" | "failed"
  created_at: string
  updated_at: string
}

export interface DatabaseMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  attachments?: string[]
  created_at: string
}

export interface DatabaseNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  read: boolean
  data?: Record<string, any>
  created_at: string
}

// Database operations
export class DatabaseService {
  // User operations
  static async createUser(userData: Partial<DatabaseUser>) {
    const { data, error } = await supabase.from("users").insert(userData).select().single()

    if (error) throw error
    return data
  }

  static async getUserById(id: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  static async updateUser(id: string, updates: Partial<DatabaseUser>) {
    const { data, error } = await supabase.from("users").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  // Referral operations
  static async createReferral(referralData: Partial<DatabaseReferral>) {
    const { data, error } = await supabase.from("referrals").insert(referralData).select().single()

    if (error) throw error
    return data
  }

  static async getReferralsByUserId(userId: string, role: "candidate" | "employee") {
    const column = role === "candidate" ? "candidate_id" : "employee_id"

    const { data, error } = await supabase
      .from("referrals")
      .select(`
        *,
        candidate:candidate_id(name, email, avatar_url),
        employee:employee_id(name, email, avatar_url, department, position)
      `)
      .eq(column, userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  static async updateReferralStatus(id: string, status: DatabaseReferral["status"], notes?: string) {
    const { data, error } = await supabase
      .from("referrals")
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Conversation operations
  static async createConversation(conversationData: Partial<DatabaseConversation>) {
    const { data, error } = await supabase.from("conversations").insert(conversationData).select().single()

    if (error) throw error
    return data
  }

  static async getConversationsByUserId(userId: string) {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        candidate:candidate_id(name, email, avatar_url),
        employee:employee_id(name, email, avatar_url, department, position)
      `)
      .or(`candidate_id.eq.${userId},employee_id.eq.${userId}`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  // Message operations
  static async createMessage(messageData: Partial<DatabaseMessage>) {
    const { data, error } = await supabase.from("messages").insert(messageData).select().single()

    if (error) throw error
    return data
  }

  static async getMessagesByConversationId(conversationId: string) {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:sender_id(name, avatar_url)
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data
  }

  // Notification operations
  static async createNotification(notificationData: Partial<DatabaseNotification>) {
    const { data, error } = await supabase.from("notifications").insert(notificationData).select().single()

    if (error) throw error
    return data
  }

  static async getNotificationsByUserId(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  static async markNotificationAsRead(id: string) {
    const { data, error } = await supabase.from("notifications").update({ read: true }).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  // Analytics operations
  static async getReferralAnalytics(userId?: string, role?: "candidate" | "employee") {
    let query = supabase.from("referrals").select("status, created_at, department, position")

    if (userId && role) {
      const column = role === "candidate" ? "candidate_id" : "employee_id"
      query = query.eq(column, userId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  // Real-time subscriptions
  static subscribeToReferralUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel("referral-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "referrals",
          filter: `candidate_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe()
  }

  static subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        callback,
      )
      .subscribe()
  }

  static subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback,
      )
      .subscribe()
  }
}
