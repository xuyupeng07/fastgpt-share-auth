"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { LoginForm } from "./login-form"
import { RegisterDialog } from "./register-dialog"
import Image from "next/image"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LoginDialog({ open, onOpenChange, onSuccess }: LoginDialogProps) {
  const [showRegister, setShowRegister] = useState(false)

  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  const handleRegisterClick = () => {
    setShowRegister(true)
  }

  const handleLoginClick = () => {
    setShowRegister(false)
  }

  const handleDialogChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (!isOpen) {
      // 当对话框关闭时，重置为登录状态
      setShowRegister(false)
    }
  }

  if (showRegister) {
    return (
      <RegisterDialog 
        open={open} 
        onOpenChange={handleDialogChange}
        onSuccess={handleSuccess}
        onLoginClick={handleLoginClick}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="sr-only">登录</DialogTitle>
          <div className="mb-4">
            <Image 
              src="/fastgpt-withtext.svg" 
              alt="FastGPT" 
              width={200} 
              height={60} 
              className="mx-auto"
            />
          </div>
          <DialogDescription>
            欢迎回来，请登录您的账户
          </DialogDescription>
        </DialogHeader>
        <LoginForm onSuccess={handleSuccess} onRegisterClick={handleRegisterClick} />
      </DialogContent>
    </Dialog>
  )
}