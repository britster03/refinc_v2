import { cn } from "@/lib/utils"
import { formatPresentableTime, formatCompactTime, formatAbsoluteTime } from "@/lib/utils/date"

interface TimestampProps {
  date: string | Date
  variant?: "default" | "compact" | "muted"
  className?: string
  showTooltip?: boolean
}

export function Timestamp({ 
  date, 
  variant = "default", 
  className,
  showTooltip = true 
}: TimestampProps) {
  const displayTime = variant === "compact" ? formatCompactTime(date) : formatPresentableTime(date)
  const tooltipTime = showTooltip ? formatAbsoluteTime(date) : undefined
  
  return (
    <time 
      dateTime={typeof date === 'string' ? date : date.toISOString()}
      title={tooltipTime}
      className={cn(
        "inline-block",
        {
          "text-sm text-foreground": variant === "default",
          "text-xs text-muted-foreground": variant === "compact",
          "text-xs text-muted-foreground": variant === "muted",
        },
        className
      )}
    >
      {displayTime}
    </time>
  )
} 