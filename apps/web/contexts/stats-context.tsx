"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Stats {
  totalUsers: number
  totalBalance: number
  totalConsumption: number
  todayConsumption: number
}

interface StatsContextType {
  stats: Stats
  updateStats: () => Promise<void>
  refreshStats: () => void
}

const StatsContext = createContext<StatsContextType | undefined>(undefined)

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalBalance: 0,
    totalConsumption: 0,
    todayConsumption: 0
  })

  const updateStats = useCallback(async () => {
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
    }
  }, [])

  const refreshStats = useCallback(() => {
    updateStats()
  }, [updateStats])

  return (
    <StatsContext.Provider value={{ stats, updateStats, refreshStats }}>
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const context = useContext(StatsContext)
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider')
  }
  return context
}