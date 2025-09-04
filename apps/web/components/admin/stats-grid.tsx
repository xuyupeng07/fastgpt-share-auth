"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface Stats {
  totalUsers: number
  totalBalance: number
  totalConsumption: number
  todayConsumption: number
}

export function StatsGrid() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBalance: 0,
    totalConsumption: 0,
    todayConsumption: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取用户数据来计算统计信息
        const usersResponse = await fetch('/api/users')
        const consumptionResponse = await fetch('/api/consumption/all')
        
        let totalUsers = 0
        let totalBalance = 0
        let totalConsumption = 0
        let todayConsumption = 0
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (usersData.success && usersData.users) {
            totalUsers = usersData.users.length
            totalBalance = usersData.users.reduce((sum: number, user: any) => {
              return sum + parseFloat(user.balance || 0)
            }, 0)
          }
        }
        
        if (consumptionResponse.ok) {
          const consumptionData = await consumptionResponse.json()
          if (consumptionData.success && consumptionData.data?.records) {
            const records = consumptionData.data.records
            totalConsumption = records.reduce((sum: number, record: any) => {
              return sum + parseFloat(record.cost || record.points_used || 0)
            }, 0)
            
            // 计算今日消费
            const today = new Date().toISOString().split('T')[0]
            todayConsumption = records
              .filter((record: any) => {
                const recordDate = new Date(record.created_at).toISOString().split('T')[0]
                return recordDate === today
              })
              .reduce((sum: number, record: any) => {
                return sum + parseFloat(record.cost || record.points_used || 0)
              }, 0)
          }
        }
        
        setStats({
          totalUsers,
          totalBalance,
          totalConsumption,
          todayConsumption
        })
      } catch (error) {
        console.error('获取统计数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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