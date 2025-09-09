import * as React from "react"
import { cn } from "@/lib/utils"

// 简化的Tooltip组件，用于兼容迁移文档中的用法
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  anchorRef?: React.RefObject<HTMLElement>
  delayDuration?: number
}

const Tooltip = ({ 
  content, 
  children, 
  side = "top", 
  align = "center", 
  className,
  delayDuration = 200
}: TooltipProps) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const [timeoutId, setTimeoutId] = React.useState<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId)
    const id = setTimeout(() => setIsVisible(true), delayDuration)
    setTimeoutId(id)
  }

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId)
    setIsVisible(false)
  }

  const getPositionClasses = () => {
    const positions = {
      top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
      left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
      right: "left-full top-1/2 transform -translate-y-1/2 ml-2"
    }
    return positions[side]
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
          className={cn(
            "absolute z-[9999] px-3 py-2 text-sm rounded-md shadow-2xl pointer-events-none",
            "bg-popover text-popover-foreground border border-border",
            "w-max min-w-0 max-w-[320px]",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            "whitespace-pre-wrap break-words leading-relaxed",
            getPositionClasses(),
            className
          )}
        >
          {content}
          <div 
            className={cn(
              "absolute w-2 h-2 bg-popover border-l border-t border-border transform rotate-45",
              side === "top" && "top-full left-1/2 -translate-x-1/2 -mt-1",
              side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 -mb-1",
              side === "left" && "left-full top-1/2 -translate-y-1/2 -ml-1",
              side === "right" && "right-full top-1/2 -translate-y-1/2 -mr-1"
            )}
          />
        </div>
      )}
    </div>
  )
}

// 为了兼容性，创建简单的别名组件
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
const TooltipTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
const TooltipContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent }