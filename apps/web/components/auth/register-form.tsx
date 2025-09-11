"use client"

import { useState, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { toast } from "sonner"
import { AuthUtils } from "@/lib/auth"

interface RegisterFormProps {
  onSuccess?: () => void
  onLoginClick?: () => void
}

export function RegisterForm({ onSuccess, onLoginClick }: RegisterFormProps = {}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 表单验证
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('请填写所有必填字段')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      toast.error('密码长度至少6位')
      return
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 注册成功，自动登录
        AuthUtils.handleLoginSuccess(data.data.token, data.data.user)
        toast.success('注册成功！正在为您自动登录...')
        
        // 延迟一下让用户看到成功消息，然后调用成功回调
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        toast.error(data.error || data.message || '注册失败，请稍后重试')
      }
    } catch (error) {
      console.error('注册失败:', error)
      toast.error('注册失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [formData, onSuccess])

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  return (
    <div className="space-y-4">

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">
            用户名 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={handleInputChange('username')}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">
            邮箱 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="请输入邮箱地址"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">
            密码 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="请输入密码（至少6位）"
            value={formData.password}
            onChange={handleInputChange('password')}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            确认密码 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            value={formData.confirmPassword}
            onChange={handleInputChange('confirmPassword')}
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "注册中..." : "注册"}
        </Button>
      </form>
      
      {/* 登录区域 */}
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
            onClick={onLoginClick}
          >
            已有账户？立即登录
          </Button>
        </div>
      </div>
    </div>
  )
}