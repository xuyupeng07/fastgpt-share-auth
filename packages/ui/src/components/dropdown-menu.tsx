"use client"

import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "../lib/utils.js"

const DropdownMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="relative inline-block text-left" ref={ref} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            return React.cloneElement(child as any, {
              onClick: () => setIsOpen(!isOpen)
            })
          }
          if (child.type === DropdownMenuContent) {
            return isOpen ? React.cloneElement(child as any, {
              onClose: () => setIsOpen(false)
            }) : null
          }
        }
        return child
      })}
    </div>
  )
})
DropdownMenu.displayName = "DropdownMenu"

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
  }
>(({ className, children, asChild = false, onClick, ...props }, ref) => {
  if (asChild) {
    const childElement = children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { [key: string]: any }>
    return React.cloneElement(childElement, {
      className: cn(childElement.props.className, className),
      'data-dropdown-trigger': 'true',
      onClick: (e: React.MouseEvent<any>) => {
        childElement.props.onClick?.(e)
        onClick?.(e)
      },
      ref
    })
  }
  
  return (
    <button
      ref={ref}
      data-dropdown-trigger="true"
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onClose?: () => void
    side?: "top" | "right" | "bottom" | "left" | "auto"
  }
>(({ className, children, onClose, side = "auto", ...props }, ref) => {
  const [actualSide, setActualSide] = React.useState<string>(side)
  
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref && 'current' in ref && ref.current && !ref.current.contains(event.target as Node)) {
        onClose?.()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, ref])
  
  React.useEffect(() => {
    if (side === "auto" && ref && 'current' in ref && ref.current) {
      // 查找触发按钮
      const triggerButton = ref.current.parentElement?.querySelector('[data-dropdown-trigger="true"]') as HTMLElement
      
      if (triggerButton) {
        const triggerRect = triggerButton.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        const menuHeight = 200 // 估算菜单高度
        const menuWidth = 150 // 估算菜单宽度
        
        // 检查向下显示是否有足够空间
        const spaceBelow = viewportHeight - triggerRect.bottom
        const spaceAbove = triggerRect.top
        const spaceRight = viewportWidth - triggerRect.right
        const spaceLeft = triggerRect.left
        
        // 智能选择显示方向
        if (spaceBelow >= menuHeight) {
          // 向下有足够空间
          setActualSide("bottom")
        } else if (spaceAbove >= menuHeight) {
          // 向上有足够空间
          setActualSide("top")
        } else if (spaceRight >= menuWidth) {
          // 向右有足够空间
          setActualSide("right")
        } else if (spaceLeft >= menuWidth) {
          // 向左有足够空间
          setActualSide("left")
        } else {
          // 默认向下，即使空间不够
          setActualSide("bottom")
        }
      } else {
        setActualSide("bottom")
      }
    } else {
      setActualSide(side)
    }
  }, [side, ref])
  
  const positionClasses = {
    top: "bottom-full mb-1 right-0 origin-bottom-right",
    right: "left-full ml-1 top-0 origin-top-left", 
    bottom: "top-full mt-1 right-0 origin-top-right",
    left: "right-full mr-1 top-0 origin-top-right",
    auto: "top-full mt-1 right-0 origin-top-right"
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute min-w-max rounded-lg bg-white shadow-xl border border-gray-200 focus:outline-none z-[99999] transform transition-all duration-200 ease-out",
        positionClasses[actualSide as keyof typeof positionClasses] || positionClasses.bottom,
        actualSide === "top" ? "animate-in slide-in-from-bottom-2" : "animate-in slide-in-from-top-2",
        className
      )}
      {...props}
    >
      <div className="py-0.5">
        {children}
      </div>
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer whitespace-nowrap",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
  }
>(({ className, children, checked, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && <Check className="h-4 w-4" />}
    </span>
    {children}
  </div>
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Circle className="h-2 w-2 fill-current" />
    </span>
    {children}
  </div>
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

const DropdownMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
DropdownMenuGroup.displayName = "DropdownMenuGroup"

const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </div>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuRadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
))
DropdownMenuRadioGroup.displayName = "DropdownMenuRadioGroup"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}