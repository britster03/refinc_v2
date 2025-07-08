export type UserRole = "employee" | "candidate" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  department?: string
  position?: string
  bio?: string
  skills?: string[]
  experience?: number
  rating?: number
  createdAt: Date
  updatedAt: Date
}
