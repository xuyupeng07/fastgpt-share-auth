"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { AdminTabs } from "@/components/admin/admin-tabs"
import { StatsGrid } from "@/components/admin/stats-grid"
import { ThemeToggle } from "@/components/theme-toggle"
import { StatsProvider } from "@/contexts/stats-context"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { AccessDenied, AdminAuthLoading } from "@/components/admin/access-denied"
import { Button } from "@workspace/ui/components/button"
import { LogOut, User } from "lucide-react"

export default function AdminPage() {
  const { isLoading, isAuthenticated, isAdmin, user, error, logout } = useAdminAuth()

  // 加载中状态
  if (isLoading) {
    return <AdminAuthLoading />
  }

  // 未登录或权限不足
  if (!isAuthenticated || !isAdmin) {
    return (
      <AccessDenied 
        title={!isAuthenticated ? "请先登录" : "权限不足"}
        message={error || "您需要管理员权限才能访问此页面"}
        showLoginButton={!isAuthenticated}
        showHomeButton={true}
      />
    )
  }

  // 管理员权限验证通过，显示后台管理界面
  return (
    <StatsProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">FastGPT 后台管理</h1>
            
            <div className="flex items-center gap-4">
              {/* 用户信息 */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4" />
                <span>管理员: {user?.username}</span>
              </div>
              
              {/* 主题切换 */}
              <ThemeToggle />
              
              {/* 退出登录 */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                退出
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Stats Grid */}
          <StatsGrid />
          
          {/* Admin Tabs */}
          <div className="mt-8">
            <AdminTabs />
          </div>
        </main>
      </div>
    </StatsProvider>
  )
}