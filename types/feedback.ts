export interface FeedbackQuestion {
  id: string
  text: string
  type: "rating" | "text" | "multiple_choice"
  options?: string[]
  required: boolean
}

export interface FeedbackResponse {
  id: string
  referralId: string
  questionId: string
  response: string | number
  createdAt: Date
}

export interface FeedbackForm {
  id: string
  title: string
  description: string
  questions: FeedbackQuestion[]
  createdAt: Date
  updatedAt: Date
}

export interface SentimentAnalysis {
  score: number // -1 to 1
  magnitude: number // 0 to +inf
  positive: number // percentage
  negative: number // percentage
  neutral: number // percentage
  keywords: string[]
}
