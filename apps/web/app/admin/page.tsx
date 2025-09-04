"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { AdminTabs } from "@/components/admin/admin-tabs"
import { StatsGrid } from "@/components/admin/stats-grid"
import { ThemeToggle } from "@/components/theme-toggle"
import { StatsProvider } from "@/contexts/stats-context"

export default function AdminPage() {
  return (
    <StatsProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">FastGPT 后台管理</h1>
            <ThemeToggle />
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