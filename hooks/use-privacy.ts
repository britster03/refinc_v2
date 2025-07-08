"use client"

import { useSettings } from "@/lib/contexts/settings-context"
import { authClient } from "@/lib/auth"

interface PrivacyOptions {
  userId?: string | number
  isOwner?: boolean
  forceShow?: boolean
}

export function usePrivacy() {
  const { settings } = useSettings()
  
  // Get current user session for comparison
  const getCurrentUserId = () => {
    const session = authClient.getSession()
    return session?.user?.id
  }

  // Check if current user can view a profile based on privacy settings
  const canViewProfile = (targetUserId: string | number): boolean => {
    if (!settings) return true // Default to visible if settings not loaded
    
    const currentUserId = getCurrentUserId()
    
    // User can always view their own profile
    if (currentUserId && currentUserId.toString() === targetUserId.toString()) {
      return true
    }
    
    // Check privacy setting
    switch (settings.privacy.profile_visibility) {
      case "private":
        return false
      case "connections":
        // TODO: Implement connection checking logic
        // For now, show to all authenticated users
        return !!currentUserId
      case "public":
      default:
        return true
    }
  }

  // Check if email should be shown
  const canShowEmail = (options: PrivacyOptions = {}): boolean => {
    if (options.forceShow) return true
    
    if (!settings) return false
    
    const currentUserId = getCurrentUserId()
    
    // Always show to the owner
    if (options.isOwner || (options.userId && currentUserId?.toString() === options.userId.toString())) {
      return true
    }
    
    return settings.privacy.show_email
  }

  // Check if phone should be shown
  const canShowPhone = (options: PrivacyOptions = {}): boolean => {
    if (options.forceShow) return true
    
    if (!settings) return false
    
    const currentUserId = getCurrentUserId()
    
    // Always show to the owner
    if (options.isOwner || (options.userId && currentUserId?.toString() === options.userId.toString())) {
      return true
    }
    
    return settings.privacy.show_phone
  }

  // Check if referral requests are allowed
  const canSendReferralRequest = (targetUserId?: string | number): boolean => {
    if (!settings) return true
    
    const currentUserId = getCurrentUserId()
    
    // Can't send request to yourself
    if (targetUserId && currentUserId?.toString() === targetUserId.toString()) {
      return false
    }
    
    return settings.privacy.allow_referral_requests
  }

  // Check if premium conversations are allowed
  const canStartPremiumConversation = (targetUserId?: string | number): boolean => {
    if (!settings) return true
    
    const currentUserId = getCurrentUserId()
    
    // Can't start conversation with yourself
    if (targetUserId && currentUserId?.toString() === targetUserId.toString()) {
      return false
    }
    
    return settings.privacy.allow_premium_conversations
  }

  // Check if data sharing is enabled
  const isDataSharingEnabled = (): boolean => {
    if (!settings) return true
    return settings.privacy.data_sharing
  }

  // Check if analytics tracking is enabled
  const isAnalyticsTrackingEnabled = (): boolean => {
    if (!settings) return true
    return settings.privacy.analytics_tracking
  }

  // Format contact info based on privacy settings
  const formatContactInfo = (email?: string, phone?: string, options: PrivacyOptions = {}) => {
    return {
      email: canShowEmail(options) ? email : undefined,
      phone: canShowPhone(options) ? phone : undefined,
      emailVisible: canShowEmail(options),
      phoneVisible: canShowPhone(options)
    }
  }

  return {
    canViewProfile,
    canShowEmail,
    canShowPhone,
    canSendReferralRequest,
    canStartPremiumConversation,
    isDataSharingEnabled,
    isAnalyticsTrackingEnabled,
    formatContactInfo,
    privacySettings: settings?.privacy
  }
} 