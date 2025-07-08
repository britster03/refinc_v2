import { cn } from "@/lib/utils"

interface NotificationIndicatorProps {
  count?: number
  className?: string
}

export function NotificationIndicator({ count, className }: NotificationIndicatorProps) {
  if (!count || count <= 0) return null

  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground",
        className,
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}
