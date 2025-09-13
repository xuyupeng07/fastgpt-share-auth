"use client"

import { useState, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"
import { AuthUtils } from "@/lib/auth"

interface LoginFormProps {
  onSuccess?: () => void
  onRegisterClick?: () => void
}

export function LoginForm({ onSuccess, onRegisterClick }: LoginFormProps = {}) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const showAlert = useCallback((message: string, type: "error" | "success" = "error") => {
    if (type === "success") {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username) {
      showAlert("请输入用户名")
      return
    }
    
    if (!password) {
      showAlert("请输入密码")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        showAlert("登录成功！", "success")
        
        // 使用统一的认证工具处理登录成功
        AuthUtils.handleLoginSuccess(data.data.token, data.data.user)
        
        // 立即调用成功回调
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.href = '/'
        }
      } else {
        showAlert(data.message || "登录失败")
      }
    } catch (error) {
      showAlert("网络错误，请重试")
    } finally {
      setIsLoading(false)
    }
  }, [username, password, onSuccess, showAlert])

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "登录中..." : "登录"}
        </Button>
      </form>
      
      {/* 注册区域 */}
      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">或</span>
          </div>
        </div>
        <div className="mt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={onRegisterClick}
          >
            注册新账户
          </Button>
        </div>
      </div>

    </div>
  )
}