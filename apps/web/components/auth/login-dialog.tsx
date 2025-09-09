"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { LoginForm } from "./login-form"
import Image from "next/image"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function LoginDialog({ open, onOpenChange, onSuccess }: LoginDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <LoginForm onSuccess={onSuccess || (() => onOpenChange(false))} />
      </DialogContent>
    </Dialog>
  )
}