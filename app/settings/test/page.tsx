"use client"

import { useSettings } from "@/lib/contexts/settings-context"
import { usePrivacy } from "@/hooks/use-privacy"
import { useTranslation } from "@/lib/i18n/translations"
import { FormattedDate, FormattedCurrency } from "@/components/ui/formatted-date"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { notificationService } from "@/lib/services/notification-service"
import DashboardLayout from "@/components/dashboard-layout"
import { useState } from "react"
import { toast } from "sonner"
import { 
  Clock, 
  DollarSign, 
  Globe, 
  Shield, 
  Bell, 
  Eye, 
  EyeOff,
  Mail,
  Smartphone,
  Calendar,
  Palette,
  Settings
} from "lucide-react"

export default function SettingsTestPage() {
  const { 
    settings, 
    loading, 
    timezone, 
    currency, 
    dateFormat, 
    timeFormat, 
    language 
  } = useSettings()
  
  const {
    canShowEmail,
    canShowPhone,
    canSendReferralRequest,
    canStartPremiumConversation,
    isDataSharingEnabled,
    isAnalyticsTrackingEnabled,
    formatContactInfo
  } = usePrivacy()
  
  const { t } = useTranslation(language as any)
  
  const [testingNotifications, setTestingNotifications] = useState(false)

  // Test data
  const testDates = [
    new Date(),
    new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago
    new Date("2024-01-15T10:30:00Z"), // Fixed date
  ]

  const testPrices = [99.99, 1234.56, 50, 299.00, 1500]

  const testContactInfo = formatContactInfo(
    "test@example.com", 
    "+1 (555) 123-4567", 
    { userId: "123" }
  )

  const testNotifications = async () => {
    if (!settings) return
    
    setTestingNotifications(true)
    
    try {
      // Test email notification
      await notificationService.sendEmail({
        userId: "test-user",
        type: "email",
        title: "Test Email Notification",
        message: "This is a test email based on your notification settings",
        category: "system",
        priority: "normal",
        recipientEmail: "test@example.com"
      }, settings.notifications)

      // Test push notification
      await notificationService.sendPush({
        userId: "test-user",
        type: "push",
        title: "Test Push Notification",
        message: "This is a test push notification",
        category: "system",
        priority: "normal"
      }, settings.notifications)

      toast.success("Test notifications sent! Check console for results.")
    } catch (error) {
      toast.error("Failed to send test notifications")
      console.error(error)
    } finally {
      setTestingNotifications(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!settings) {
    return (
      <DashboardLayout role="candidate">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Settings className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>Settings not available</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="candidate">
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("settings.title", "Settings Test Page")}
          </h1>
          <p className="text-muted-foreground">
            Comprehensive demonstration of all settings working end-to-end
          </p>
        </div>

        {/* Current Settings Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Current User Settings
            </CardTitle>
            <CardDescription>
              Your active preferences and how they affect the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Theme: <Badge variant="outline">{settings.preferences.theme}</Badge></span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-green-500" />
                <span className="text-sm">Language: <Badge variant="outline">{language}</Badge></span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Timezone: <Badge variant="outline">{timezone}</Badge></span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Currency: <Badge variant="outline">{currency}</Badge></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date and Time Formatting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date & Time Formatting
            </CardTitle>
            <CardDescription>
              Dates and times formatted according to your preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Format: {dateFormat} • {timeFormat} • {timezone}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testDates.map((date, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium">Test Date #{index + 1}</div>
                  <div className="space-y-1 text-sm">
                    <div>Date: <FormattedDate date={date} variant="date" className="font-mono" /></div>
                    <div>Time: <FormattedDate date={date} variant="time" className="font-mono" /></div>
                    <div>DateTime: <FormattedDate date={date} variant="datetime" className="font-mono" /></div>
                    <div>Relative: <FormattedDate date={date} variant="relative" className="font-mono" /></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Currency Formatting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Currency Formatting
            </CardTitle>
            <CardDescription>
              Prices formatted in your preferred currency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {testPrices.map((price, index) => (
                <div key={index} className="border rounded-lg p-3 text-center">
                  <div className="text-sm text-muted-foreground">Price #{index + 1}</div>
                  <div className="text-lg font-mono">
                    <FormattedCurrency amount={price} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy Controls
            </CardTitle>
            <CardDescription>
              How your privacy settings affect what others can see
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Email Address:</span>
                    <div className="flex items-center space-x-2">
                      {canShowEmail() ? (
                        <>
                          <Eye className="h-4 w-4 text-green-500" />
                          <span className="font-mono">{testContactInfo.email}</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span className="text-muted-foreground">Hidden</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Phone Number:</span>
                    <div className="flex items-center space-x-2">
                      {canShowPhone() ? (
                        <>
                          <Eye className="h-4 w-4 text-green-500" />
                          <span className="font-mono">{testContactInfo.phone}</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-red-500" />
                          <span className="text-muted-foreground">Hidden</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Interaction Permissions</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Referral Requests:</span>
                    <Badge variant={canSendReferralRequest() ? "default" : "secondary"}>
                      {canSendReferralRequest() ? "Allowed" : "Blocked"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Premium Conversations:</span>
                    <Badge variant={canStartPremiumConversation() ? "default" : "secondary"}>
                      {canStartPremiumConversation() ? "Allowed" : "Blocked"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Data Sharing:</span>
                    <Badge variant={isDataSharingEnabled() ? "default" : "secondary"}>
                      {isDataSharingEnabled() ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Analytics Tracking:</span>
                    <Badge variant={isAnalyticsTrackingEnabled() ? "default" : "secondary"}>
                      {isAnalyticsTrackingEnabled() ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Test how your notification preferences work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Current Preferences</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Email Notifications:</span>
                    <Badge variant={settings.notifications.email_notifications ? "default" : "secondary"}>
                      {settings.notifications.email_notifications ? "On" : "Off"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push Notifications:</span>
                    <Badge variant={settings.notifications.push_notifications ? "default" : "secondary"}>
                      {settings.notifications.push_notifications ? "On" : "Off"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Referral Updates:</span>
                    <Badge variant={settings.notifications.referral_updates ? "default" : "secondary"}>
                      {settings.notifications.referral_updates ? "On" : "Off"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Frequency:</span>
                    <Badge variant="outline">{settings.notifications.notification_frequency}</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Test Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Send test notifications to see how your settings affect delivery
                </p>
                <Button 
                  onClick={testNotifications}
                  disabled={testingNotifications}
                  className="w-full"
                >
                  {testingNotifications ? (
                    <>
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Send Test Notifications
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language/Translation Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Language & Translation
            </CardTitle>
            <CardDescription>
              Sample translations in your selected language
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Navigation</h4>
                <div className="space-y-1 text-sm">
                  <div>{t("nav.dashboard")}</div>
                  <div>{t("nav.referrals")}</div>
                  <div>{t("nav.notifications")}</div>
                  <div>{t("nav.settings")}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Common Actions</h4>
                <div className="space-y-1 text-sm">
                  <div>{t("common.save")}</div>
                  <div>{t("common.cancel")}</div>
                  <div>{t("common.delete")}</div>
                  <div>{t("common.loading")}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Messages</h4>
                <div className="space-y-1 text-sm">
                  <div>{t("messages.success")}</div>
                  <div>{t("messages.error")}</div>
                  <div>{t("messages.warning")}</div>
                  <div>{t("messages.info")}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Links */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Your Settings</CardTitle>
            <CardDescription>
              Update your preferences to see changes reflected here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  All Settings
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/settings#notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/settings#privacy">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/settings#account">
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 