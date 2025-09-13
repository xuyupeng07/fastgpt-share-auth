"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { useStats } from "@/contexts/stats-context"
import { toast } from "sonner"
import { AuthUtils } from "@/lib/auth"

interface RechargeRecord {
  id: number
  username?: string
  amount: number
  balance_before: number
  balance_after: number
  status: 'success' | 'pending' | 'failed'
  created_at: string
  remark?: string
}

interface User {
  id: string
  username: string
  balance: number
}

interface ApiRechargeRecord {
  id: number;
  username?: string;
  amount: string | number;
  balance_before: string | number;
  balance_after: string | number;
  created_at: string;
  remark?: string;
  [key: string]: unknown;
}

export function RechargeTable() {
  const { refreshStats } = useStats()
  const [records, setRecords] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchId, setSearchId] = useState('')
  const [searchUsername, setSearchUsername] = useState('')
  const [searchType, setSearchType] = useState<'id' | 'username'>('username')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [newRecharge, setNewRecharge] = useState({ userId: '', amount: '' })
  const [isAdding, setIsAdding] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const pageSize = 10

  // 防抖hook
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value)
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value)
      }, delay)
      
      return () => {
        clearTimeout(handler)
      }
    }, [value, delay])
    
    return debouncedValue
  }

  // 防抖后的搜索值
  const debouncedSearchId = useDebounce(searchId, 300)
  const debouncedSearchUsername = useDebounce(searchUsername, 300)

  const fetchUsers = useCallback(async () => {
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
  }, [])

  const fetchRechargeRecords = useCallback(async () => {
    try {
      setLoading(true)
      let url = '/api/recharge/records'
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })
      
      if (searchType === 'id' && debouncedSearchId) {
        params.append('id', debouncedSearchId)
        url = `/api/recharge/records?${params}`
      } else if (searchType === 'username' && debouncedSearchUsername) {
        params.append('username', debouncedSearchUsername)
        url = `/api/recharge/records?${params}`
      } else {
        url = `/api/recharge/records?${params}`
      }
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        // 适配新的API返回格式
        if (data.data.records) {
          // 新格式：服务端分页
          const recordsWithStatus = data.data.records.map((record: ApiRechargeRecord) => ({
            ...record,
            status: 'success' as const,
            amount: parseFloat(String(record.amount)) || 0,
            balance_before: parseFloat(String(record.balance_before)) || 0,
            balance_after: parseFloat(String(record.balance_after)) || 0
          }))
          setRecords(recordsWithStatus)
          setTotalPages(Math.ceil((data.data.total || 0) / pageSize))
        } else {
          // 兼容旧格式：客户端分页
          const allRecords = data.data || []
          const recordsWithStatus = allRecords.map((record: ApiRechargeRecord) => ({
            ...record,
            status: 'success' as const,
            amount: parseFloat(String(record.amount)) || 0,
            balance_before: parseFloat(String(record.balance_before)) || 0,
            balance_after: parseFloat(String(record.balance_after)) || 0
          }))
          
          // 分页处理
          const startIndex = (currentPage - 1) * pageSize
          const endIndex = startIndex + pageSize
          const paginatedRecords = recordsWithStatus.slice(startIndex, endIndex)
          
          setRecords(paginatedRecords)
          setTotalPages(Math.ceil(allRecords.length / pageSize))
        }
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
  }, [currentPage, pageSize, debouncedSearchId, debouncedSearchUsername, searchType])

  useEffect(() => {
    fetchRechargeRecords()
    fetchUsers()
  }, [currentPage, debouncedSearchId, debouncedSearchUsername, searchType])

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchId, debouncedSearchUsername, searchType])

  const handleRecharge = async () => {
    if (!newRecharge.userId || !newRecharge.amount || newRecharge.userId === 'loading' || newRecharge.userId === 'no-users') {
      toast.error('请选择用户和充值金额')
      return
    }

    try {
      setIsAdding(true)
      const token = AuthUtils.getToken()
      if (!token) {
        toast.error('未登录，请先登录')
        setIsAdding(false)
        return
      }

      const response = await fetch('/api/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: newRecharge.userId,
          amount: parseFloat(newRecharge.amount)
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`充值成功！新余额: ${(data.data.balance || 0).toFixed(2)}积分`)
        setNewRecharge({ userId: '', amount: '' })
        fetchUsers() // 刷新用户列表以更新余额显示
        fetchRechargeRecords()
        // 触发统计数据热更新
        refreshStats()
        // 触发全局统计数据刷新事件
        window.dispatchEvent(new CustomEvent('refreshStats'))
      } else {
        toast.error(`充值失败: ${data.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('充值失败:', error)
      toast.error('充值失败，请重试')
    } finally {
      setIsAdding(false)
    }
  }

  const handleReset = () => {
    setSearchId('')
    setSearchUsername('')
    setCurrentPage(1)
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
              value={newRecharge.userId}
              onValueChange={(value) => 
                setNewRecharge({ ...newRecharge, userId: value })
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
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} (余额: {parseFloat(user.balance?.toString() || '0').toFixed(2)}积分)
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
          <Select value={searchType} onValueChange={(value: 'id' | 'username') => setSearchType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="username">用户名</SelectItem>
              <SelectItem value="id">订单ID</SelectItem>
            </SelectContent>
          </Select>
          {searchType === 'username' ? (
            <Input
              placeholder="输入用户名实时搜索充值记录"
              value={searchUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUsername(e.target.value)}
              className="max-w-sm"
            />
          ) : (
            <Input
              placeholder="输入订单ID实时搜索充值记录"
              value={searchId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchId(e.target.value)}
              className="max-w-sm"
            />
          )}
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            重置
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">订单ID</TableHead>
                <TableHead className="text-left">用户名</TableHead>
                <TableHead className="text-center">充值金额</TableHead>
                <TableHead className="text-center">充值前余额</TableHead>
                <TableHead className="text-center">充值后余额</TableHead>
                <TableHead className="text-left">状态</TableHead>
                <TableHead className="text-left">时间</TableHead>
                <TableHead className="text-center">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      <span className="text-sm text-muted-foreground">加载中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchId || searchUsername ? '未找到相关充值记录' : '暂无充值记录'}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-left font-mono text-sm text-muted-foreground">{record.id}</TableCell>
                    <TableCell className="text-left font-medium">
                      {record.username || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        +¥{record.amount.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-muted-foreground">
                        ¥{record.balance_before.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        ¥{record.balance_after.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left text-sm text-muted-foreground">
                      {formatDate(record.created_at)}
                    </TableCell>
                    <TableCell className="text-left text-sm text-muted-foreground max-w-32 truncate" title={record.remark || '-'}>
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