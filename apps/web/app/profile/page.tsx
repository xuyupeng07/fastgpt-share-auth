"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { User, ArrowLeft, Calendar, CreditCard, Activity, Eye, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"

interface UserInfo {
  uid: string
  username: string
  balance: number
  role: string
  email: string
  status: string
  is_admin: number
}

interface ConsumptionRecord {
  id: number
  user_id: number
  username: string
  token_used: number
  points_used: number
  cost: number
  created_at: string
  response_data?: string
  chat_history?: any[]
}

interface RechargeRecord {
  id: number
  user_id: number
  username: string
  amount: number
  balance_before: number
  balance_after: number
  remark: string
  created_at: string
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([])
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<ConsumptionRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState<{[key: number]: boolean}>({})

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("authToken")
    const user = localStorage.getItem("userInfo")
    
    if (!token || !user) {
      // 未登录，跳转到登录页
      window.location.href = "/login"
      return
    }
    
    const userInfo = JSON.parse(user)
    
    // 检查是否为管理员，如果是则重定向到admin后台
    if (userInfo.is_admin === 1) {
      window.location.href = "/admin"
      return
    }
    
    setAuthToken(token)
    setUserInfo(userInfo)
    
    // 加载用户数据
    loadUserData(token)
    
    // 监听页面焦点事件，当页面重新获得焦点时刷新用户信息
    const handleFocus = () => {
      if (token) {
        refreshUserInfo(token)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // 获取最新用户信息
  const refreshUserInfo = async (token: string) => {
    try {
      const response = await fetch(`/api/user/info?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserInfo(data.data)
          // 同时更新本地存储
          localStorage.setItem('userInfo', JSON.stringify(data.data))
        }
      }
    } catch (error) {
      console.error('获取最新用户信息失败:', error)
    }
  }

  const loadUserData = async (token: string) => {
    try {
      setLoading(true)
      
      // 获取最新用户信息（包括余额）
      await refreshUserInfo(token)
      
      // 获取消费记录 - 使用token参数，但后端会根据用户名查询
      const consumptionResponse = await fetch(`/api/consumption/user?token=${token}`)
      if (consumptionResponse.ok) {
        const consumptionData = await consumptionResponse.json()
        setConsumptionRecords(consumptionData.data || [])
      }
      
      // 获取充值记录
      const rechargeResponse = await fetch(`/api/recharge/user?token=${token}`)
      if (rechargeResponse.ok) {
        const rechargeData = await rechargeResponse.json()
        setRechargeRecords(rechargeData.data || [])
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecordDetail = async (recordId: number) => {
    setDetailLoading(prev => ({ ...prev, [recordId]: true }))
    try {
      const response = await fetch(`/api/consumption/detail/${recordId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSelectedRecord(data.data)
        } else {
          console.error('获取详情失败:', data.message)
        }
      }
    } catch (error) {
      console.error('获取消费详情失败:', error)
    } finally {
      setDetailLoading(prev => ({ ...prev, [recordId]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default">正常</Badge>
    ) : (
      <Badge variant="destructive">禁用</Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="secondary">管理员</Badge>
    ) : (
      <Badge variant="outline">普通用户</Badge>
    )
  }

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部导航 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/select-link'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-2xl font-bold">个人中心</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>用户信息</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => authToken && refreshUserInfo(authToken)}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新余额
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">用户名</p>
                <p className="font-medium">{userInfo.username}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">用户ID</p>
                <p className="font-medium">{userInfo.uid}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">当前余额</p>
                <p className="font-medium text-lg text-primary">{parseFloat(userInfo.balance?.toString() || '0').toFixed(2)} 积分</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">账户状态</p>
                <div className="flex space-x-2">
                  {getStatusBadge(userInfo.status)}
                  {getRoleBadge(userInfo.role)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 记录查看 */}
        <Card>
          <CardHeader>
            <CardTitle>账户记录</CardTitle>
            <CardDescription>查看您的消费记录和充值记录</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="consumption" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="consumption" className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>消费记录</span>
                </TabsTrigger>
                <TabsTrigger value="recharge" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>充值记录</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="consumption" className="mt-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">加载中...</p>
                  </div>
                ) : consumptionRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">暂无消费记录</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>消费时间</TableHead>
                          <TableHead>Token使用量</TableHead>
                          <TableHead>积分消耗</TableHead>
                          <TableHead>费用</TableHead>
                          <TableHead>操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consumptionRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.created_at)}</TableCell>
                            <TableCell>{record.token_used}</TableCell>
                            <TableCell>{record.points_used}</TableCell>
                            <TableCell>{parseFloat(record.cost?.toString() || '0').toFixed(4)}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={detailLoading[record.id]}
                                    onClick={() => fetchRecordDetail(record.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {detailLoading[record.id] ? "加载中..." : "详情"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>消费详情</DialogTitle>
                                    <DialogDescription>
                                      消费记录 #{record.id} 的详细信息
                                    </DialogDescription>
                                  </DialogHeader>
                                  {selectedRecord && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-muted-foreground">消费时间</p>
                                          <p className="font-medium">{formatDate(selectedRecord.created_at)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">Token使用量</p>
                                          <p className="font-medium">{selectedRecord.token_used}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">积分消耗</p>
                                          <p className="font-medium">{selectedRecord.points_used}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-muted-foreground">费用</p>
                                          <p className="font-medium">{parseFloat(selectedRecord.cost?.toString() || '0').toFixed(4)}</p>
                                        </div>
                                      </div>
                                      {selectedRecord.chat_history && selectedRecord.chat_history.length > 0 && (
                                        <div>
                                          <p className="text-sm text-muted-foreground mb-2">聊天记录</p>
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
                                      {selectedRecord.response_data && (
                                        <div>
                                          <p className="text-sm text-muted-foreground mb-2">响应数据</p>
                                          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                                            {JSON.stringify(JSON.parse(selectedRecord.response_data), null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="recharge" className="mt-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">加载中...</p>
                  </div>
                ) : rechargeRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">暂无充值记录</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>充值时间</TableHead>
                          <TableHead>充值金额</TableHead>
                          <TableHead>充值前余额</TableHead>
                          <TableHead>充值后余额</TableHead>
                          <TableHead>备注</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rechargeRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{formatDate(record.created_at)}</TableCell>
                            <TableCell className="text-green-600 font-medium">+{record.amount}</TableCell>
                            <TableCell>{parseFloat(record.balance_before?.toString() || '0').toFixed(2)}</TableCell>
                            <TableCell>{parseFloat(record.balance_after?.toString() || '0').toFixed(2)}</TableCell>
                            <TableCell>{record.remark || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}