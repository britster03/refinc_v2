import type { User } from "./user"

export type ReferralStatus =
  | "pending"
  | "reviewing"
  | "interview_scheduled"
  | "interview_completed"
  | "offer_extended"
  | "hired"
  | "rejected"

export interface Referral {
  id: string
  candidateId: string
  candidate?: User
  employeeId: string
  employee?: User
  company: string
  position: string
  department: string
  status: ReferralStatus
  notes?: string
  resume_url?: string
  job_description?: string
  ai_analysis_score?: number
  ai_analysis_summary?: string
  ai_analysis_details?: string
  feedback_score?: number
  feedback_comments?: string[]
  rejection_feedback?: string
  rejection_feedback_analysis?: {
    primary_reasons: string[]
    sentiment: string
    tone: string
    constructiveness_score: number
    improvement_suggestions: string[]
    potential_additional_reasons: string[]
    follow_up_questions: string[]
    overall_analysis: string
    candidate_action_items: string[]
  }
  created_at: string
  updated_at: string
}
