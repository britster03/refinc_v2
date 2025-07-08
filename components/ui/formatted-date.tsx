"use client"

import React from "react"
import { useSettings } from "@/lib/contexts/settings-context"
import { formatDate, formatTime, formatDateTime, formatRelativeTime } from "@/lib/utils/formatting"

interface FormattedDateProps {
  date: Date | string
  variant?: "date" | "time" | "datetime" | "relative"
  className?: string
}

export function FormattedDate({ date, variant = "date", className }: FormattedDateProps) {
  // Use a try-catch to handle cases where SettingsProvider might not be available
  let timezone = "UTC"
  let dateFormat = "MM/dd/yyyy"
  let timeFormat: "12h" | "24h" = "12h"
  
  try {
    const settings = useSettings()
    timezone = settings.timezone
    dateFormat = settings.dateFormat
    timeFormat = settings.timeFormat
  } catch (error) {
    // Use default values if settings context is not available
    console.warn("SettingsProvider not available, using default date/time formats")
  }

  const getFormattedValue = () => {
    switch (variant) {
      case "date":
        return formatDate(date, dateFormat, timezone)
      case "time":
        return formatTime(date, timeFormat, timezone)
      case "datetime":
        return formatDateTime(date, dateFormat, timeFormat, timezone)
      case "relative":
        return formatRelativeTime(date, timezone)
      default:
        return formatDate(date, dateFormat, timezone)
    }
  }

  return (
    <span className={className} title={formatDateTime(date, dateFormat, timeFormat, timezone)} suppressHydrationWarning>
      {getFormattedValue()}
    </span>
  )
}

interface FormattedCurrencyProps {
  amount: number
  className?: string
}

export function FormattedCurrency({ amount, className }: FormattedCurrencyProps) {
  // Use a try-catch to handle cases where SettingsProvider might not be available
  let currency = "USD"
  let language = "en-US"
  
  try {
    const settings = useSettings()
    currency = settings.currency
    language = settings.language
  } catch (error) {
    // Use default values if settings context is not available
    console.warn("SettingsProvider not available, using default currency/language")
  }
  
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch (error) {
      // Fallback to USD
      return new Intl.NumberFormat("en-US", {
        style: 'currency',
        currency: "USD",
      }).format(amount)
    }
  }

  return (
    <span className={className} suppressHydrationWarning>
      {formatCurrency(amount)}
    </span>
  )
} 