import { formatDistanceToNow, parseISO, isValid, format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns"

/**
 * Safely parse a date string and return a valid Date object in local timezone
 */
export function safeParseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return isValid(dateString) ? dateString : new Date()
  }
  
  if (typeof dateString !== 'string') {
    console.error('Invalid date input:', dateString)
    return new Date()
  }
  
  try {
    // Backend sends UTC timestamps in ISO format
    // Ensure we have a proper UTC indicator for parseISO
    let utcDateString = dateString
    if (typeof dateString === 'string' && !dateString.endsWith('Z') && !dateString.includes('+')) {
      utcDateString = dateString + 'Z'
    }
    
    // Parse as ISO UTC and it will be correctly converted to local time
    const isoDate = parseISO(utcDateString)
    if (isValid(isoDate)) {
      return isoDate
    }
    
    // Fallback to native Date constructor
    const nativeDate = new Date(dateString)
    if (isValid(nativeDate)) {
      return nativeDate
    }
    
    // If all else fails, return current date
    console.error('Unable to parse date string:', dateString)
    return new Date()
    
  } catch (error) {
    console.error('Error parsing date:', dateString, error)
    return new Date()
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago") in user's local timezone
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = safeParseDate(dateString)
  // formatDistanceToNow automatically uses local time when comparing to now
  return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * Format a date as absolute time in user's local timezone
 */
export function formatAbsoluteTime(dateString: string | Date): string {
  const date = safeParseDate(dateString)
  return format(date, 'MMM d, yyyy h:mm a')
}

/**
 * Format a timestamp for presentable UI display
 * Shows smart contextual formatting based on recency
 */
export function formatPresentableTime(dateString: string | Date): string {
  const date = safeParseDate(dateString)
  
  if (isToday(date)) {
    return format(date, 'h:mm a')  // "2:30 PM"
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`  // "Yesterday 2:30 PM"
  } else if (isThisWeek(date)) {
    return format(date, 'EEE h:mm a')  // "Mon 2:30 PM"
  } else if (isThisYear(date)) {
    return format(date, 'MMM d, h:mm a')  // "Dec 5, 2:30 PM"
  } else {
    return format(date, 'MMM d, yyyy')  // "Dec 5, 2024"
  }
}

/**
 * Format a timestamp for compact UI display (like mobile or small screens)
 */
export function formatCompactTime(dateString: string | Date): string {
  const date = safeParseDate(dateString)
  
  if (isToday(date)) {
    return format(date, 'h:mm a')  // "2:30 PM"
  } else if (isYesterday(date)) {
    return 'Yesterday'
  } else if (isThisWeek(date)) {
    return format(date, 'EEE')  // "Mon"
  } else if (isThisYear(date)) {
    return format(date, 'MMM d')  // "Dec 5"
  } else {
    return format(date, 'MM/dd/yy')  // "12/05/24"
  }
}

/**
 * Check if a date string is valid
 */
export function isValidDateString(dateString: string | Date): boolean {
  const date = safeParseDate(dateString)
  return isValid(date)
} 