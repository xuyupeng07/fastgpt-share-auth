"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

interface RechargeRecord {
  id: number
  token: string
  username?: string
  amount: number
  balance_before: number
  balance_after: number
  status: 'success' | 'pending' | 'failed'
  created_at: string
  remark?: string
}

interface User {
  username: string
  token: string
  balance: number
}

export function RechargeTable() {
  const [records, setRecords] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchToken, setSearchToken] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newRecharge, setNewRecharge] = useState({ token: '', amount: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const pageSize = 10

  useEffect(() => {
    fetchRechargeRecords()
    fetchUsers()
  }, [currentPage, searchToken])

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchRechargeRecords = async () => {
    try {
      setLoading(true)
      const url = searchToken ? `/api/recharge/records?token=${encodeURIComponent(searchToken)}` : '/api/recharge/records'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        const allRecords = data.data || []
        // 添加状态字段，默认为成功，并确保数值字段为数字类型
        const recordsWithStatus = allRecords.map((record: any) => ({
          ...record,
          status: 'success' as const,
          amount: parseFloat(record.amount) || 0,
          balance_before: parseFloat(record.balance_before) || 0,
          balance_after: parseFloat(record.balance_after) || 0
        }))
        
        // 分页处理
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedRecords = recordsWithStatus.slice(startIndex, endIndex)
        
        setRecords(paginatedRecords)
        setTotalPages(Math.ceil(allRecords.length / pageSize))
      } else {
        setRecords([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('获取充值记录失败:', error)
      setRecords([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = async () => {
    if (!newRecharge.token || !newRecharge.amount || newRecharge.token === 'loading' || newRecharge.token === 'no-users') {
      alert('请选择用户和充值金额')
      return
    }

    try {
      setIsAdding(true)
      const response = await fetch('/api/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: newRecharge.token,
          amount: parseFloat(newRecharge.amount)
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(`充值成功！新余额: ${(data.data.balance || 0).toFixed(2)}积分`)
        setNewRecharge({ token: '', amount: '' })
        fetchUsers() // 刷新用户列表以更新余额显示
        fetchRechargeRecords()
      } else {
        alert(`充值失败: ${data.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('充值失败:', error)
      alert('充值失败，请重试')
    } finally {
      setIsAdding(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchRechargeRecords()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success': return 'default'
      case 'pending': return 'secondary'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功'
      case 'pending': return '处理中'
      case 'failed': return '失败'
      default: return '未知'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>充值记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>充值记录</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add Recharge */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium mb-3">添加充值</h3>
          <div className="flex gap-2">
            <Select
              value={newRecharge.token}
              onValueChange={(value) => 
                setNewRecharge({ ...newRecharge, token: value })
              }
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="请选择用户" />
              </SelectTrigger>
              <SelectContent>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>加载中...</SelectItem>
                ) : users.length === 0 ? (
                  <SelectItem value="no-users" disabled>暂无用户</SelectItem>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.token} value={user.token}>
                      {user.username} (余额: {Math.round(parseFloat(user.balance?.toString() || '0'))}积分)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="充值金额（支持小数）"
              value={newRecharge.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setNewRecharge({ ...newRecharge, amount: e.target.value })
              }
              className="max-w-xs"
            />
            <Button onClick={handleRecharge} disabled={isAdding}>
              {isAdding ? '充值中...' : '确认充值'}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="输入Token搜索充值记录"
            value={searchToken}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchToken(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleSearch}>搜索</Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchToken('')
              setCurrentPage(1)
            }}
          >
            重置
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>充值金额</TableHead>
                <TableHead>充值前余额</TableHead>
                <TableHead>充值后余额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {searchToken ? '未找到相关充值记录' : '暂无充值记录'}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {record.token ? `${record.token.substring(0, 12)}...` : '-'}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      +¥{record.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ¥{record.balance_before.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-medium">
                      ¥{record.balance_after.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(record.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.remark || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              第 {currentPage} 页，共 {totalPages} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}