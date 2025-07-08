"use client"

import { useState, useEffect } from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Bell, 
  Shield, 
  User, 
  Palette, 
  Download, 
  Trash2, 
  Key, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Globe,
  Clock,
  DollarSign,
  Languages,
  Eye,
  UserCheck,
  MessageSquare,
  Settings
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth"
import { 
  settingsAPI, 
  UserSettings, 
  NotificationSettings, 
  PrivacySettings, 
  AccountPreferences,
  PasswordChangeData,
  SettingsAPI 
} from "@/lib/api/settings"

export default function SettingsPage() {
  const { 
    settings, 
    loading, 
    updateNotificationSettings,
    updatePrivacySettings,
    updateAccountPreferences
  } = useSettings()
  const [saving, setSaving] = useState("")
  const [userRole, setUserRole] = useState<"candidate" | "employee">("candidate")

  // Password change state
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: "",
    new_password: ""
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Account deletion state
  const [deletionData, setDeletionData] = useState({
    password: "",
    confirmation: ""
  })
  const [showDeletionDialog, setShowDeletionDialog] = useState(false)

  // Data export state
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      const session = authClient.getSession()
      if (session?.user) {
        setUserRole(session.user.role as "candidate" | "employee")
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  // Wrapper functions to handle saving state
  const handleUpdateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setSaving("notifications")
      await updateNotificationSettings(newSettings)
    } finally {
      setSaving("")
    }
  }

  const handleUpdatePrivacySettings = async (newSettings: Partial<PrivacySettings>) => {
    try {
      setSaving("privacy")
      await updatePrivacySettings(newSettings)
    } finally {
      setSaving("")
    }
  }

  const handleUpdateAccountPreferences = async (newPreferences: Partial<AccountPreferences>) => {
    try {
      setSaving("preferences")
      await updateAccountPreferences(newPreferences)
    } finally {
      setSaving("")
    }
  }

  const handlePasswordChange = async () => {
    const errors = SettingsAPI.validatePassword(passwordData.new_password)
    setPasswordErrors(errors)
    
    if (errors.length > 0) return

    try {
      setSaving("password")
      await settingsAPI.changePassword(passwordData)
      
      setPasswordData({ current_password: "", new_password: "" })
      setShowPasswordDialog(false)
      toast.success('Password changed successfully')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setSaving("")
    }
  }

  const handleAccountDeletion = async () => {
    if (deletionData.confirmation !== "DELETE") {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    try {
      setSaving("deletion")
      await settingsAPI.deleteAccount(deletionData)
      
      // Logout and redirect
      authClient.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete account')
    } finally {
      setSaving("")
    }
  }

  const handleDataExport = async () => {
    try {
      setExporting(true)
      const exportData = await settingsAPI.exportUserData()
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `referralinc-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role={userRole}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading settings...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!settings) {
    return (
      <DashboardLayout role={userRole}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load settings. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role={userRole}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and privacy settings</p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="security">
              <Key className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure when and how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.email_notifications}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ email_notifications: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive browser push notifications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.push_notifications}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ push_notifications: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Referral Updates</Label>
                      <div className="text-sm text-muted-foreground">
                        Get notified when referral status changes
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.referral_updates}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ referral_updates: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Message Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        New messages and conversation requests
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.message_notifications}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ message_notifications: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">System Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Important system updates and maintenance
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.system_notifications}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ system_notifications: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Weekly Digest</Label>
                      <div className="text-sm text-muted-foreground">
                        Weekly summary of your activity
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.weekly_digest}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ weekly_digest: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Marketing Emails</Label>
                      <div className="text-sm text-muted-foreground">
                        Product updates and marketing communications
                      </div>
                    </div>
                    <Switch
                      checked={settings.notifications.marketing_emails}
                      onCheckedChange={(checked) => 
                        handleUpdateNotificationSettings({ marketing_emails: checked })
                      }
                      disabled={saving === "notifications"}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="notification-frequency">Notification Frequency</Label>
                    <Select
                      value={settings.notifications.notification_frequency}
                      onValueChange={(value: "instant" | "hourly" | "daily" | "weekly") =>
                        handleUpdateNotificationSettings({ notification_frequency: value })
                      }
                      disabled={saving === "notifications"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground">
                      How often you want to receive non-urgent notifications
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your information and how it's used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-visibility">Profile Visibility</Label>
                    <Select
                      value={settings.privacy.profile_visibility}
                      onValueChange={(value: "public" | "private" | "connections") =>
                        handleUpdatePrivacySettings({ profile_visibility: value })
                      }
                      disabled={saving === "privacy"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can view</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                        <SelectItem value="private">Private - Hidden from search</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Show Email Address</Label>
                      <div className="text-sm text-muted-foreground">
                        Display your email address on your profile
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.show_email}
                      onCheckedChange={(checked) => 
                        handleUpdatePrivacySettings({ show_email: checked })
                      }
                      disabled={saving === "privacy"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow Referral Requests</Label>
                      <div className="text-sm text-muted-foreground">
                        {userRole === "employee" 
                          ? "Allow candidates to send you referral requests"
                          : "Allow employees to see your referral interests"
                        }
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.allow_referral_requests}
                      onCheckedChange={(checked) => 
                        handleUpdatePrivacySettings({ allow_referral_requests: checked })
                      }
                      disabled={saving === "privacy"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow Premium Conversations</Label>
                      <div className="text-sm text-muted-foreground">
                        {userRole === "employee" 
                          ? "Allow candidates to book paid conversations with you"
                          : "Show availability for premium conversations"
                        }
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.allow_premium_conversations}
                      onCheckedChange={(checked) => 
                        handleUpdatePrivacySettings({ allow_premium_conversations: checked })
                      }
                      disabled={saving === "privacy"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Data Sharing</Label>
                      <div className="text-sm text-muted-foreground">
                        Allow anonymous data sharing for platform improvements
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.data_sharing}
                      onCheckedChange={(checked) => 
                        handleUpdatePrivacySettings({ data_sharing: checked })
                      }
                      disabled={saving === "privacy"}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Analytics Tracking</Label>
                      <div className="text-sm text-muted-foreground">
                        Help us improve the platform with usage analytics
                      </div>
                    </div>
                    <Switch
                      checked={settings.privacy.analytics_tracking}
                      onCheckedChange={(checked) => 
                        handleUpdatePrivacySettings({ analytics_tracking: checked })
                      }
                      disabled={saving === "privacy"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Appearance & Language
                </CardTitle>
                <CardDescription>
                  Customize how the platform looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.preferences.theme}
                      onValueChange={(value: "light" | "dark" | "system") =>
                        handleUpdateAccountPreferences({ theme: value })
                      }
                      disabled={saving === "preferences"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.preferences.language}
                      onValueChange={(value) =>
                        handleUpdateAccountPreferences({ language: value })
                      }
                      disabled={saving === "preferences"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SettingsAPI.getAvailableLanguages().map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.preferences.timezone}
                      onValueChange={(value) =>
                        handleUpdateAccountPreferences({ timezone: value })
                      }
                      disabled={saving === "preferences"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SettingsAPI.getAvailableTimezones().map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={settings.preferences.currency}
                      onValueChange={(value) =>
                        handleUpdateAccountPreferences({ currency: value })
                      }
                      disabled={saving === "preferences"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SettingsAPI.getAvailableCurrencies().map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Select
                      value={settings.preferences.date_format}
                      onValueChange={(value) =>
                        handleUpdateAccountPreferences({ date_format: value })
                      }
                      disabled={saving === "preferences"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
                        <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
                        <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-format">Time Format</Label>
                    <Select
                      value={settings.preferences.time_format}
                      onValueChange={(value: "12h" | "24h") =>
                        handleUpdateAccountPreferences({ time_format: value })
                      }
                      disabled={saving === "preferences"}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Data Export
                </CardTitle>
                <CardDescription>
                  Download a copy of all your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm">Export all your data including profile, referrals, conversations, and settings.</p>
                    <p className="text-xs text-muted-foreground">Data will be exported as a JSON file.</p>
                  </div>
                  <Button 
                    onClick={handleDataExport}
                    disabled={exporting}
                    variant="outline"
                  >
                    {exporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  Password & Security
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base">Password</Label>
                    <div className="text-sm text-muted-foreground">
                      Change your account password
                    </div>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                          />
                          {passwordErrors.length > 0 && (
                            <div className="space-y-1">
                              {passwordErrors.map((error, index) => (
                                <p key={index} className="text-xs text-red-500">{error}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowPasswordDialog(false)}
                          disabled={saving === "password"}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handlePasswordChange}
                          disabled={saving === "password" || !passwordData.current_password || !passwordData.new_password}
                        >
                          {saving === "password" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            'Change Password'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator />

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Danger Zone</strong>
                    <br />
                    The following actions cannot be undone. Please proceed with caution.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base text-red-600">Delete Account</Label>
                    <div className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </div>
                  </div>
                  <Dialog open={showDeletionDialog} onOpenChange={setShowDeletionDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="delete-password">Password</Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deletionData.password}
                            onChange={(e) => setDeletionData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Enter your password"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delete-confirmation">Type "DELETE" to confirm</Label>
                          <Input
                            id="delete-confirmation"
                            value={deletionData.confirmation}
                            onChange={(e) => setDeletionData(prev => ({ ...prev, confirmation: e.target.value }))}
                            placeholder="DELETE"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowDeletionDialog(false)}
                          disabled={saving === "deletion"}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleAccountDeletion}
                          disabled={saving === "deletion" || !deletionData.password || deletionData.confirmation !== "DELETE"}
                        >
                          {saving === "deletion" ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 