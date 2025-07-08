import { format, parseISO, isValid } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

// Currency formatting
export function formatCurrency(
  amount: number, 
  currency: string = "USD", 
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    // Fallback to USD if currency is not supported
    return new Intl.NumberFormat("en-US", {
      style: 'currency',
      currency: "USD",
    }).format(amount)
  }
}

// Date formatting with user preferences
export function formatDate(
  date: Date | string,
  dateFormat: string = "MM/dd/yyyy",
  timezone: string = "UTC"
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return "Invalid date"
    }

    // Convert format string to date-fns format
    const formatMap: Record<string, string> = {
      "MM/dd/yyyy": "MM/dd/yyyy",
      "dd/MM/yyyy": "dd/MM/yyyy", 
      "yyyy-MM-dd": "yyyy-MM-dd",
      "MMM dd, yyyy": "MMM dd, yyyy",
      "dd MMM yyyy": "dd MMM yyyy"
    }

    const formatString = formatMap[dateFormat] || "MM/dd/yyyy"
    
    // Format in user's timezone
    return formatInTimeZone(dateObj, timezone, formatString)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

// Time formatting with user preferences
export function formatTime(
  date: Date | string,
  timeFormat: "12h" | "24h" = "12h",
  timezone: string = "UTC"
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return "Invalid time"
    }

    const formatString = timeFormat === "12h" ? "h:mm a" : "HH:mm"
    
    // Format in user's timezone
    return formatInTimeZone(dateObj, timezone, formatString)
  } catch (error) {
    console.error("Error formatting time:", error)
    return "Invalid time"
  }
}

// Combined date and time formatting
export function formatDateTime(
  date: Date | string,
  dateFormat: string = "MM/dd/yyyy",
  timeFormat: "12h" | "24h" = "12h",
  timezone: string = "UTC"
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return "Invalid date"
    }

    const dateFormatMap: Record<string, string> = {
      "MM/dd/yyyy": "MM/dd/yyyy",
      "dd/MM/yyyy": "dd/MM/yyyy",
      "yyyy-MM-dd": "yyyy-MM-dd"
    }

    const dateFormatString = dateFormatMap[dateFormat] || "MM/dd/yyyy"
    const timeFormatString = timeFormat === "12h" ? "h:mm a" : "HH:mm"
    
    const fullFormat = `${dateFormatString} ${timeFormatString}`
    
    // Format in user's timezone
    return formatInTimeZone(dateObj, timezone, fullFormat)
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return "Invalid date"
  }
}

// Relative time formatting (e.g., "2 hours ago")
export function formatRelativeTime(
  date: Date | string,
  timezone: string = "UTC"
): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    
    if (!isValid(dateObj)) {
      return "Invalid date"
    }

    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    // For older dates, show formatted date
    return formatDate(dateObj, "MMM dd, yyyy", timezone)
  } catch (error) {
    console.error("Error formatting relative time:", error)
    return "Unknown"
  }
}

// Number formatting with locale
export function formatNumber(
  number: number,
  locale: string = "en-US"
): string {
  try {
    return new Intl.NumberFormat(locale).format(number)
  } catch (error) {
    return number.toString()
  }
}

// Phone number formatting (basic)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format as US phone number if 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  // Format as international if 11+ digits
  if (cleaned.length >= 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone // Return original if can't format
} 