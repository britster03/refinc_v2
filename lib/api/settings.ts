import { authClient } from "@/lib/auth"

export interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  referral_updates: boolean
  message_notifications: boolean
  system_notifications: boolean
  weekly_digest: boolean
  marketing_emails: boolean
  notification_frequency: "instant" | "hourly" | "daily" | "weekly"
}

export interface PrivacySettings {
  profile_visibility: "public" | "private" | "connections"
  show_email: boolean
  show_phone: boolean
  allow_referral_requests: boolean
  allow_premium_conversations: boolean
  data_sharing: boolean
  analytics_tracking: boolean
}

export interface AccountPreferences {
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
  currency: string
  date_format: string
  time_format: "12h" | "24h"
}

export interface UserSettings {
  notifications: NotificationSettings
  privacy: PrivacySettings
  preferences: AccountPreferences
}

export interface PasswordChangeData {
  current_password: string
  new_password: string
}

export interface AccountDeletionData {
  password: string
  confirmation: string
}

export interface SuccessResponse {
  success: boolean
  message: string
}

class SettingsAPI {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const session = authClient.getSession()
    if (!session?.access_token) {
      throw new Error("Authentication required")
    }

    const url = `${this.baseUrl}/settings${endpoint}`
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...options.headers,
      },
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  async getUserSettings(): Promise<UserSettings> {
    return this.makeRequest<UserSettings>("/")
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>("/notifications", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>("/privacy", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  async updateAccountPreferences(preferences: Partial<AccountPreferences>): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>("/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    })
  }

  async changePassword(passwordData: PasswordChangeData): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>("/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    })
  }

  async deleteAccount(deletionData: AccountDeletionData): Promise<SuccessResponse> {
    return this.makeRequest<SuccessResponse>("/account", {
      method: "DELETE",
      body: JSON.stringify(deletionData),
    })
  }

  async exportUserData(): Promise<any> {
    return this.makeRequest<any>("/export")
  }

  // Helper methods for common operations
  async toggleNotificationSetting(
    setting: keyof NotificationSettings,
    value: boolean
  ): Promise<SuccessResponse> {
    return this.updateNotificationSettings({ [setting]: value })
  }

  async togglePrivacySetting(
    setting: keyof PrivacySettings,
    value: boolean | string
  ): Promise<SuccessResponse> {
    return this.updatePrivacySettings({ [setting]: value })
  }

  async updateTheme(theme: AccountPreferences["theme"]): Promise<SuccessResponse> {
    return this.updateAccountPreferences({ theme })
  }

  async updateTimezone(timezone: string): Promise<SuccessResponse> {
    return this.updateAccountPreferences({ timezone })
  }

  async updateLanguage(language: string): Promise<SuccessResponse> {
    return this.updateAccountPreferences({ language })
  }

  // Validation helpers
  static validatePassword(password: string): string[] {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character")
    }
    
    return errors
  }

  static getAvailableTimezones(): { value: string; label: string }[] {
    return [
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
      { value: "America/New_York", label: "Eastern Time (ET)" },
      { value: "America/Chicago", label: "Central Time (CT)" },
      { value: "America/Denver", label: "Mountain Time (MT)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
      { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
      { value: "Europe/Paris", label: "Central European Time (CET)" },
      { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
      { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
      { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
      { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
    ]
  }

  static getAvailableLanguages(): { value: string; label: string }[] {
    return [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
      { value: "de", label: "German" },
      { value: "it", label: "Italian" },
      { value: "pt", label: "Portuguese" },
      { value: "zh", label: "Chinese" },
      { value: "ja", label: "Japanese" },
      { value: "ko", label: "Korean" },
      { value: "hi", label: "Hindi" },
    ]
  }

  static getAvailableCurrencies(): { value: string; label: string }[] {
    return [
      { value: "USD", label: "US Dollar ($)" },
      { value: "EUR", label: "Euro (€)" },
      { value: "GBP", label: "British Pound (£)" },
      { value: "JPY", label: "Japanese Yen (¥)" },
      { value: "CAD", label: "Canadian Dollar (C$)" },
      { value: "AUD", label: "Australian Dollar (A$)" },
      { value: "CHF", label: "Swiss Franc (CHF)" },
      { value: "CNY", label: "Chinese Yuan (¥)" },
      { value: "INR", label: "Indian Rupee (₹)" },
    ]
  }
}

export const settingsAPI = new SettingsAPI()
export { SettingsAPI } 