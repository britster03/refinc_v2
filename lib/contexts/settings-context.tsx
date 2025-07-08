"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { settingsAPI, UserSettings, NotificationSettings, PrivacySettings, AccountPreferences } from "@/lib/api/settings"
import { authClient } from "@/lib/auth"

interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
  updateNotificationSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>
  updatePrivacySettings: (newSettings: Partial<PrivacySettings>) => Promise<void>
  updateAccountPreferences: (newPreferences: Partial<AccountPreferences>) => Promise<void>
  refreshSettings: () => Promise<void>
  // Computed properties for easy access
  timezone: string
  currency: string
  dateFormat: string
  timeFormat: "12h" | "24h"
  language: string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check if we have authentication before making API calls
      const session = authClient.getSession()
      
      if (session) {
        const userSettings = await settingsAPI.getUserSettings()
        setSettings(userSettings)
        
        // Apply theme immediately
        if (userSettings.preferences.theme) {
          setTheme(userSettings.preferences.theme)
        }
      } else {
        // Use default settings if not authenticated
        throw new Error('Not authenticated')
      }
    } catch (error) {
      console.warn('Using default settings:', error)
      // Set default settings if loading fails or user is not authenticated
      const defaultSettings = {
        notifications: {
          email_notifications: true,
          push_notifications: true,
          referral_updates: true,
          message_notifications: true,
          system_notifications: true,
          weekly_digest: true,
          marketing_emails: false,
          notification_frequency: "instant" as const
        },
        privacy: {
          profile_visibility: "public" as const,
          show_email: false,
          show_phone: false,
          allow_referral_requests: true,
          allow_premium_conversations: true,
          data_sharing: true,
          analytics_tracking: true
        },
        preferences: {
          theme: "light" as const,
          language: "en",
          timezone: "UTC",
          currency: "USD",
          date_format: "MM/dd/yyyy",
          time_format: "12h" as const
        }
      }
      setSettings(defaultSettings)
      
      // Apply default theme
      setTheme(defaultSettings.preferences.theme)
    } finally {
      setLoading(false)
    }
  }, [setTheme])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!settings) return

    try {
      await settingsAPI.updateNotificationSettings(newSettings)
      
      setSettings({
        ...settings,
        notifications: { ...settings.notifications, ...newSettings }
      })
      
      toast.success('Notification settings updated')
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error('Failed to update notification settings')
      throw error
    }
  }

  const updatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    if (!settings) return

    try {
      await settingsAPI.updatePrivacySettings(newSettings)
      
      setSettings({
        ...settings,
        privacy: { ...settings.privacy, ...newSettings }
      })
      
      toast.success('Privacy settings updated')
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast.error('Failed to update privacy settings')
      throw error
    }
  }

  const updateAccountPreferences = async (newPreferences: Partial<AccountPreferences>) => {
    if (!settings) return

    try {
      await settingsAPI.updateAccountPreferences(newPreferences)
      
      // Apply theme change immediately
      if (newPreferences.theme) {
        setTheme(newPreferences.theme)
      }
      
      setSettings({
        ...settings,
        preferences: { ...settings.preferences, ...newPreferences }
      })
      
      // Show specific feedback messages
      if (newPreferences.theme) {
        toast.success(`Theme updated to ${newPreferences.theme}`)
      }
      if (newPreferences.language) {
        toast.success(`Language updated to ${newPreferences.language}`)
      }
      if (newPreferences.timezone) {
        toast.success(`Timezone updated to ${newPreferences.timezone}`)
      }
      if (newPreferences.currency) {
        toast.success(`Currency updated to ${newPreferences.currency}`)
      }
      if (newPreferences.time_format) {
        toast.success(`Time format updated to ${newPreferences.time_format === '12h' ? '12-hour' : '24-hour'}`)
      }
      if (newPreferences.date_format) {
        toast.success(`Date format updated to ${newPreferences.date_format}`)
      }
    } catch (error) {
      console.error('Error updating account preferences:', error)
      toast.error('Failed to update account preferences')
      throw error
    }
  }

  const refreshSettings = async () => {
    await loadSettings()
  }

  const contextValue: SettingsContextType = {
    settings,
    loading,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAccountPreferences,
    refreshSettings,
    // Computed properties for easy access
    timezone: settings?.preferences.timezone || "UTC",
    currency: settings?.preferences.currency || "USD",
    dateFormat: settings?.preferences.date_format || "MM/dd/yyyy",
    timeFormat: settings?.preferences.time_format || "12h",
    language: settings?.preferences.language || "en"
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 