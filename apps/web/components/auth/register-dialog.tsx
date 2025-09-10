"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog"
import { RegisterForm } from "./register-form"
import Image from "next/image"

interface RegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function RegisterDialog({ open, onOpenChange, onSuccess, onLoginClick }: RegisterDialogProps) {
  const handleSuccess = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2">
            用户注册
          </DialogTitle>
        </DialogHeader>
        <RegisterForm onSuccess={handleSuccess} onLoginClick={onLoginClick} />
      </DialogContent>
    </Dialog>
  )
}