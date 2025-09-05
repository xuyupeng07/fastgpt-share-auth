"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { ExternalLink, User, LogOut, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

interface LinkConfig {
  id: number
  url: string
  name: string
  description?: string
}

export default function SelectLinkPage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkConfig[]>([])

  // 获取工作流链接配置
  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/workflows')
      const result = await response.json()
      
      if (result.success) {
        // 只显示启用且有no_login_url的工作流
        const enabledWorkflows = result.data
          .filter((workflow: any) => workflow.status === 'active' && workflow.no_login_url)
          .map((workflow: any) => ({
            id: workflow.id,
            name: workflow.name,
            url: workflow.no_login_url,
            description: workflow.description
          }))
        setLinks(enabledWorkflows)
      } else {
        console.error('获取工作流配置失败:', result.message)
      }
    } catch (error) {
      console.error('获取工作流配置失败:', error)
    }
  }

  // 获取最新用户信息
  const refreshUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/user/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserInfo(data.data)
          // 同时更新本地存储
          localStorage.setItem('userInfo', JSON.stringify(data.data))
        }
      } else if (response.status === 403) {
        // 用户账户被禁用，立即清除登录态并重定向到登录页
        console.log('Account disabled, logging out and redirecting to login')
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        sessionStorage.clear()
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        window.location.href = '/login?disabled=true'
        return
      } else if (response.status === 401) {
        // token无效，跳转到登录页
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('获取最新用户信息失败:', error)
    }
  }

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("authToken")
    const user = localStorage.getItem("userInfo")
    
    if (!token || !user) {
      // 未登录，跳转到登录页
      window.location.href = "/login"
      return
    }
    
    setAuthToken(token)
    setUserInfo(JSON.parse(user))
    
    // 获取最新用户信息
    refreshUserInfo(token)
    
    // 从API获取链接配置
    fetchLinks()
    
    // 监听页面焦点事件，当页面重新获得焦点时刷新用户信息
    const handleFocus = () => {
      if (token) {
        refreshUserInfo(token)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleLinkClick = (url: string) => {
    if (authToken) {
      const fastgptUrl = `${url}&authToken=${authToken}`
      window.open(fastgptUrl, '_blank')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userInfo")
    // 清除cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    window.location.href = "/login"
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="flex justify-between items-center bg-card rounded-lg p-6 shadow-sm border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {userInfo.username}
                </h1>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => authToken && refreshUserInfo(authToken)}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-lg font-medium text-muted-foreground">
                积分余额: {parseFloat(userInfo.balance || '0').toFixed(2)} Credits
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = '/profile'}
            >
              <User className="h-4 w-4 mr-2" />
              个人中心
            </Button>
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>

        {/* 链接选择卡片 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            选择您的FastGPT助手
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
            选择一个助手开始您的AI对话之旅
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {links.map((link, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-muted rounded-lg">
                    <Image 
                      src="/fastgpt.svg" 
                      alt="FastGPT" 
                      width={80} 
                      height={80} 
                      className="group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-foreground">
                    {link.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                     {link.description || 'AI智能助手，随时为您提供帮助'}
                   </p>
                </div>
                <Button 
                  className="w-20" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLinkClick(link.url)
                  }}
                >
                  Try
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}