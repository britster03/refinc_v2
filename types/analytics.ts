import type { ReferralStatus } from "./referral"

export interface ReferralMetrics {
  total: number
  byStatus: Record<ReferralStatus, number>
  conversionRate: number
  averageTimeToHire: number
  topDepartments: Array<{ department: string; count: number }>
}

export interface EmployeeMetrics {
  totalReferrals: number
  successfulReferrals: number
  conversionRate: number
  averageRating: number
  engagementScore: number
}

export interface CandidateMetrics {
  interviewRate: number
  offerRate: number
  averageFeedbackScore: number
  skillMatchScore: number
}

export interface PredictiveMetrics {
  hiringProbability: number
  fitScore: number
  retentionProbability: number
  performancePrediction: number
}

export interface TimeSeriesData {
  date: string
  value: number
  category?: string
}

export interface AnalyticsFilters {
  startDate?: Date
  endDate?: Date
  department?: string
  position?: string
  status?: ReferralStatus
  employeeId?: string
}
