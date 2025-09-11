"use client"

import { useEffect } from "react"
// Card components removed as they are not used
import { AdminTabs } from "@/components/admin/admin-tabs"
import { StatsGrid } from "@/components/admin/stats-grid"
import { StatsProvider } from "@/contexts/stats-context"
import { UserDropdown } from "@/components/UserDropdown"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { AccessDenied, AdminAuthLoading } from "@/components/admin/access-denied"
import { Button } from "@workspace/ui/components/button"
import { LogOut, User, Home, Settings } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"

export default function AdminPage() {
  const { isLoading, isAuthenticated, isAdmin, user, error, logout } = useAdminAuth()

  // 监听全局余额更新事件，触发统计数据刷新
  useEffect(() => {
    const handleBalanceUpdate = () => {
      // 触发统计数据更新事件
      window.dispatchEvent(new CustomEvent('refreshStats'))
    }

    window.addEventListener('balanceUpdated', handleBalanceUpdate)

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate)
    }
  }, [])

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
              {user && (
                <UserDropdown 
                  userInfo={user} 
                  onLogout={logout}
                  onAvatarUpdate={() => {
                    // 管理员页面不需要头像更新功能，但保持接口一致性
                  }}
                  hideMenuItems={['admin']}
                  showHomeButton={true}
                />
              )}
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