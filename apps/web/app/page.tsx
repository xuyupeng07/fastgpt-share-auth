"use client"

import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

export default function LoginPage() {
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