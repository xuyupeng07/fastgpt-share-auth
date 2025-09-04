"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { useStats } from "@/contexts/stats-context"

export function StatsGrid() {
  const { stats, updateStats } = useStats()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInitialStats = async () => {
      setLoading(true)
      await updateStats()
      setLoading(false)
    }
    
    fetchInitialStats()
  }, [updateStats])

  const statsCards = [
    {
      title: "总用户数",
      value: stats.totalUsers,
      suffix: "人",
      description: "系统注册用户总数"
    },
    {
      title: "总余额",
      value: stats.totalBalance,
      suffix: "元",
      description: "用户账户余额总和"
    },
    {
      title: "总消费",
      value: stats.totalConsumption,
      suffix: "元",
      description: "历史消费总金额"
    },
    {
      title: "今日消费",
      value: stats.todayConsumption,
      suffix: "元",
      description: "今日消费金额"
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">加载中...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">数据加载中</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              <span className="text-sm font-normal ml-1">{card.suffix}</span>
            </div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}