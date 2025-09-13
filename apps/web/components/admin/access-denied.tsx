"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { AlertTriangle, Home, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"

interface AccessDeniedProps {
  title?: string
  message?: string
  showLoginButton?: boolean
  showHomeButton?: boolean
}

export function AccessDenied({
  title = "访问被拒绝",
  message = "您没有权限访问此页面",
  showLoginButton = true,
  showHomeButton = true
}: AccessDeniedProps) {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/login')
  }

  const handleHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-medium">
              {message}
            </p>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>此页面需要管理员权限才能访问。</p>
            <p>如果您是管理员，请确保已正确登录。</p>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            {showLoginButton && (
              <Button 
                onClick={handleLogin}
                className="w-full"
                variant="default"
              >
                <LogIn className="w-4 h-4 mr-2" />
                重新登录
              </Button>
            )}
            
            {showHomeButton && (
              <Button 
                onClick={handleHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 加载状态组件
export function AdminAuthLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">验证管理员权限中...</p>
      </div>
    </div>
  )
}