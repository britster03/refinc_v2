import { authClient } from '@/lib/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface FeedbackType {
  NO_RESPONSE: 'no_response'
  NO_INTERVIEW: 'no_interview'
  REJECTED_AFTER_INTERVIEW: 'rejected_after_interview'
  DECLINED_OFFER: 'declined_offer'
  POSITION_FILLED: 'position_filled'
  POOR_REFERRAL_QUALITY: 'poor_referral_quality'
  OTHER: 'other'
}

export interface FeedbackSubmission {
  referral_id: number
  feedback_type: string
  feedback_text: string
  metadata?: Record<string, any>
}

export interface FeedbackResponse {
  id: number
  referral_id: number
  candidate_id: number
  employee_id: number
  feedback_type: string
  feedback_text: string
  rating_impact: number
  sentiment_score?: number
  sentiment_analysis?: Record<string, any>
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface EmployeeRatingUpdate {
  employee_id: number
  old_rating: number
  new_rating: number
  total_feedback_count: number
  positive_feedback_count: number
  negative_feedback_count: number
  fell_through_count: number
}

export interface FeedbackSummary {
  employee_id: number
  summary: {
    total_feedback: number
    severe_issues: number
    moderate_issues: number
    neutral_feedback: number
    avg_sentiment?: number
    feedback_types?: string
  }
  recent_feedback: Array<{
    feedback_type: string
    feedback_text: string
    rating_impact: number
    created_at: string
  }>
}

export class FeedbackAPI {
  /**
   * Submit fell-through feedback for a referral
   */
  static async submitFeedback(
    feedbackData: FeedbackSubmission
  ): Promise<FeedbackResponse> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/feedback/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(feedbackData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      
      if (response.status === 409) {
        throw new Error('Feedback has already been submitted for this referral')
      } else if (response.status === 400) {
        throw new Error(errorData.detail || 'Invalid feedback data')
      } else if (response.status === 403) {
        throw new Error('You are not authorized to submit feedback for this referral')
      } else if (response.status === 404) {
        throw new Error('Referral not found')
      }
      
      throw new Error(errorData.detail || `Failed to submit feedback: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get feedback for a specific referral
   */
  static async getReferralFeedback(referralId: number): Promise<FeedbackResponse> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/feedback/referral/${referralId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('No feedback found for this referral')
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to get feedback: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get feedback summary for an employee
   */
  static async getEmployeeFeedbackSummary(employeeId: number): Promise<FeedbackSummary> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const response = await fetch(`${API_BASE_URL}/feedback/employee/${employeeId}/summary`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `Failed to get feedback summary: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Check if feedback can be submitted for a referral
   */
  static async canSubmitFeedback(referralId: number): Promise<boolean> {
    try {
      await this.getReferralFeedback(referralId)
      return false // Feedback already exists
    } catch (error) {
      // If we get a 404, it means no feedback exists, so we can submit
      if (error instanceof Error && error.message.includes('No feedback found')) {
        return true
      }
      throw error
    }
  }

  /**
   * Validate feedback submission data
   */
  static validateFeedbackData(data: Partial<FeedbackSubmission>): string[] {
    const errors: string[] = []

    if (!data.referral_id || data.referral_id <= 0) {
      errors.push('Valid referral ID is required')
    }

    if (!data.feedback_type) {
      errors.push('Feedback type is required')
    }

    if (!data.feedback_text || data.feedback_text.trim().length < 10) {
      errors.push('Feedback text must be at least 10 characters long')
    }

    if (data.feedback_text && data.feedback_text.length > 2000) {
      errors.push('Feedback text cannot exceed 2000 characters')
    }

    const validFeedbackTypes = [
      'no_response',
      'no_interview', 
      'rejected_after_interview',
      'declined_offer',
      'position_filled',
      'poor_referral_quality',
      'other'
    ]

    if (data.feedback_type && !validFeedbackTypes.includes(data.feedback_type)) {
      errors.push('Invalid feedback type')
    }

    return errors
  }

  /**
   * Get localized feedback type labels
   */
  static getFeedbackTypeLabel(feedbackType: string): string {
    const labels: Record<string, string> = {
      no_response: "I didn't hear back from anyone",
      no_interview: "I didn't get an interview",
      rejected_after_interview: "I was rejected after the interview",
      declined_offer: "I declined the offer",
      position_filled: "The position was filled by someone else",
      poor_referral_quality: "The referral quality was poor",
      other: "Other reason"
    }

    return labels[feedbackType] || feedbackType
  }

  /**
   * Get feedback type severity (for UI styling)
   */
  static getFeedbackTypeSeverity(feedbackType: string): 'high' | 'medium' | 'low' {
    const severityMap: Record<string, 'high' | 'medium' | 'low'> = {
      no_response: 'high',
      poor_referral_quality: 'high',
      no_interview: 'medium',
      other: 'medium',
      rejected_after_interview: 'low',
      declined_offer: 'low',
      position_filled: 'low'
    }

    return severityMap[feedbackType] || 'medium'
  }
} 