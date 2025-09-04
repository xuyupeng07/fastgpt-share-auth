"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

interface User {
  username: string
  token: string
  uid: string
  email?: string
  balance: number
}

export function TestUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTestUsers()
  }, [])

  const loadTestUsers = async () => {
    try {
      const response = await fetch("/api/users")
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("加载用户数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">测试用户</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">测试用户</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => {
          const password = user.username === "admin" ? "admin123" : "123456"
          return (
            <div
              key={user.uid}
              className="rounded-md border bg-muted/50 p-3 text-xs space-y-1"
            >
              <div className="font-medium">{user.username}</div>
              <div className="text-muted-foreground">密码: {password}</div>
              <div className="text-muted-foreground">Token: {user.token}</div>
              <div className="text-muted-foreground">UID: {user.uid}</div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}