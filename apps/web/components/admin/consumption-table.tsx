"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"

interface ConsumptionRecord {
  id: number
  user_id: number
  username: string
  token_used: number
  points_used: string
  cost: string
  appname?: string
  question?: string
  response_data?: any[]
  chat_history?: any[]
  created_at: string
}

export function ConsumptionTable() {
  const [records, setRecords] = useState<ConsumptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchId, setSearchId] = useState('')
  const [searchUsername, setSearchUsername] = useState('')
  const [searchType, setSearchType] = useState<'id' | 'username'>('username')
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState<{[key: number]: boolean}>({})
  const [dialogOpen, setDialogOpen] = useState(false)
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

  // 防抖搜索值
  const debouncedSearchId = useDebounce(searchId, 300)
  const debouncedSearchUsername = useDebounce(searchUsername, 300)

  useEffect(() => {
    fetchConsumptionRecords()
  }, [currentPage])

  // 实时搜索效果
  useEffect(() => {
    setCurrentPage(1) // 重置到第一页
    fetchConsumptionRecords()
  }, [debouncedSearchId, debouncedSearchUsername, searchType])

  const fetchConsumptionRecords = async () => {
    try {
      setLoading(true)
      let url = '/api/consumption/all'
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      })
      
      if (searchType === 'id' && debouncedSearchId) {
        params.append('id', debouncedSearchId)
        url = `/api/consumption/all?${params}`
      } else if (searchType === 'username' && debouncedSearchUsername) {
        params.append('username', debouncedSearchUsername)
        url = `/api/consumption/all?${params}`
      } else {
        url = `/api/consumption/all?${params}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const data = result.data || result
          // 适配新的API返回格式
          if (data.records) {
            // 新格式：服务端分页
            setRecords(data.records)
            setTotalPages(Math.ceil((data.total || 0) / pageSize))
          } else {
            // 兼容旧格式
            setRecords(data || [])
            setTotalPages(Math.ceil((data.length || 0) / pageSize))
          }
        } else {
          console.error('API返回错误:', result.message)
          setRecords([])
        }
      }
    } catch (error) {
      console.error('获取消费记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecordDetail = async (recordId: number) => {
    try {
      setDetailLoading(prev => ({ ...prev, [recordId]: true }))
      const response = await fetch(`/api/consumption/detail/${recordId}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSelectedRecord(result.data)
          setDialogOpen(true)
        } else {
          console.error('获取详情失败:', result.message)
        }
      }
    } catch (error) {
      console.error('获取消费记录详情失败:', error)
    } finally {
      setDetailLoading(prev => ({ ...prev, [recordId]: false }))
    }
  }

  // 重置搜索
  const handleReset = () => {
    setSearchId('')
    setSearchUsername('')
    setCurrentPage(1)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>消费记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>消费记录</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="flex gap-2 mb-4">
          <Select value={searchType} onValueChange={(value: 'id' | 'username') => setSearchType(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="username">用户名</SelectItem>
              <SelectItem value="id">对话ID</SelectItem>
            </SelectContent>
          </Select>
          {searchType === 'username' ? (
            <Input
              placeholder="输入用户名实时搜索消费记录"
              value={searchUsername}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchUsername(e.target.value)}
              className="max-w-sm"
            />
          ) : (
            <Input
              placeholder="输入对话ID实时搜索消费记录"
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
                <TableHead className="text-left">对话ID</TableHead>
                <TableHead className="text-left">用户名</TableHead>
                <TableHead className="text-left">工作流名称</TableHead>
                <TableHead className="text-center">Token使用</TableHead>
                <TableHead className="text-center">积分消费</TableHead>
                <TableHead className="text-center">消费金额</TableHead>
                <TableHead className="text-left">时间</TableHead>
                <TableHead className="text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    {searchId || searchUsername ? '未找到相关消费记录' : '暂无消费记录'}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-left font-mono text-sm text-muted-foreground">{record.id}</TableCell>
                    <TableCell className="text-left font-medium">{record.username}</TableCell>
                    <TableCell className="text-left font-medium text-primary">
                      {record.appname || '未知工作流'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                        {(record.token_used || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">
                        {(parseFloat(record.points_used) || 0).toFixed(4)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        ¥{(parseFloat(record.cost) || 0).toFixed(4)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left text-sm text-muted-foreground">
                      {formatDate(record.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchRecordDetail(record.id)}
                        disabled={detailLoading[record.id]}
                      >
                        {detailLoading[record.id] ? '加载中...' : '详情'}
                      </Button>
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

    {/* 详情弹窗 */}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>消费记录详情</DialogTitle>
        </DialogHeader>
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">用户名</label>
                <div className="text-sm">{selectedRecord.username}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">工作流名称</label>
                <div className="text-sm">{selectedRecord.appname || '未知工作流'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Token使用</label>
                <div className="text-sm">{selectedRecord.token_used || 0}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">积分消费</label>
                <div className="text-sm">{(parseFloat(selectedRecord.points_used) || 0).toFixed(4)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">总费用</label>
                <div className="text-sm font-medium">¥{(parseFloat(selectedRecord.cost) || 0).toFixed(4)}</div>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground">创建时间</label>
                <div className="text-sm">{formatDate(selectedRecord.created_at)}</div>
              </div>
            </div>
            
            {selectedRecord.chat_history && selectedRecord.chat_history.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">聊天记录</label>
                <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-3">
                  {selectedRecord.chat_history.map((message: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {message.role === 'user' ? '用户' : 'AI助手'}
                      </div>
                      <div className="text-sm bg-muted p-2 rounded">
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}