import * as React from "react"
import { cn } from "@/lib/utils"

// 简化的Tooltip组件，用于兼容迁移文档中的用法
interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  className?: string
  anchorRef?: React.RefObject<HTMLElement | null>
  delayDuration?: number
}

const Tooltip = ({ 
  content, 
  children, 
  side = "top", 
  align = "center", 
  className,
  anchorRef,
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
      top: "bottom-full mb-3",
      bottom: "top-full mt-3",
      left: "right-full top-1/2 transform -translate-y-1/2 mr-3",
      right: "left-full top-1/2 transform -translate-y-1/2 ml-3"
    }
    return positions[side]
  }

  const getArrowClasses = () => {
    if (anchorRef && anchorRef.current && (side === 'top' || side === 'bottom')) {
      // 当有anchorRef时，计算尖刺相对于卡片中心的位置
      const triggerRect = children && (children as any).ref?.current?.getBoundingClientRect()
      const anchorRect = anchorRef.current.getBoundingClientRect()
      
      if (triggerRect && anchorRect) {
        const offset = (anchorRect.left + anchorRect.width / 2) - (triggerRect.left + triggerRect.width / 2)
        const arrows = {
          top: `top-full -translate-x-1/2 -mt-1 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white dark:border-t-black`,
          bottom: `bottom-full -translate-x-1/2 -mb-1 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white dark:border-b-black`
        }
        return arrows[side as 'top' | 'bottom']
      }
    }
    
    const arrows = {
      top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white dark:border-t-black",
      bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white dark:border-b-black",
      left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white dark:border-l-black",
      right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-white dark:border-r-black"
    }
    return arrows[side]
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
            "absolute z-[99999] px-4 py-3 text-sm rounded-lg shadow-2xl pointer-events-none",
            "bg-white dark:bg-black text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700",
            "w-max min-w-0 max-w-[320px]",
            "animate-in fade-in-0 zoom-in-95 duration-300 ease-out",
            "whitespace-pre-wrap break-words leading-relaxed",
            getPositionClasses(),
            className
          )}
          style={{ 
            zIndex: 99999,
            ...(side === 'top' || side === 'bottom') ? {
              left: '50%',
              transform: 'translateX(-50%)'
            } : {}
          }}
        >
          {content}
          {/* 尖刺箭头 */}
          <div 
            className={cn(
              "absolute w-0 h-0",
              getArrowClasses()
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