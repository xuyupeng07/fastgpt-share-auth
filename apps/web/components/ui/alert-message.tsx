"use client"

import { cn } from "@workspace/ui/lib/utils"

interface AlertMessageProps {
  message: string
  type: "error" | "success"
  className?: string
}

export function AlertMessage({ message, type, className }: AlertMessageProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        {
          "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200":
            type === "error",
          "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200":
            type === "success",
        },
        className
      )}
    >
      {message}
    </div>
  )
}