"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { AlertMessage } from "@/components/ui/alert-message"
import { TestUsers } from "@/components/auth/test-users"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: "error" | "success" } | null>(null)

  const showAlert = (message: string, type: "error" | "success" = "error") => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
        showAlert("登录成功！正在跳转...", "success")
        // 存储token到localStorage
        localStorage.setItem("authToken", data.authToken)
        localStorage.setItem("userInfo", JSON.stringify(data.data))
        
        // 构建FastGPT分享链接并拼接token
        const fastgptBaseUrl = process.env.NEXT_PUBLIC_FASTGPT_SHARE_URL || 'https://cloud.fastgpt.io/chat/share?shareId=yzRbRsO1vdKbfUeOhWoIv8LY'
        const fastgptUrl = `${fastgptBaseUrl}&authToken=${data.authToken}`
        
        setTimeout(() => {
          window.location.href = fastgptUrl
        }, 1000)
      } else {
        showAlert(data.message || "登录失败")
      }
    } catch (error) {
      showAlert("网络错误，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {alert && (
        <AlertMessage message={alert.message} type={alert.type} />
      )}
      
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
      
      <TestUsers />
    </div>
  )
}