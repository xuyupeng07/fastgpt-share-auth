"use client"

import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader } from "@workspace/ui/components/card"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
// AlertTriangle removed as it is not used
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"

function LoginContent() {
  const searchParams = useSearchParams()
  const isDisabled = searchParams.get('disabled') === 'true'

  useEffect(() => {
    if (isDisabled) {
      toast.error('您的账户已被禁用，请联系管理员获取帮助。')
    }
  }, [isDisabled])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        

        <Card>
          <CardHeader className="text-center">
            <div className="mb-4">
              <Image 
                src="/fastgpt-withtext.svg" 
                alt="FastGPT" 
                width={200} 
                height={60} 
                className="mx-auto"
              />
            </div>
            <CardDescription>
              欢迎回来，请登录您的账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}