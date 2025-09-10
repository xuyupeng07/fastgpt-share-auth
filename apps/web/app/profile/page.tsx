"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { User, ArrowLeft, CreditCard, Activity, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { LoginDialog } from "@/components/auth/login-dialog"

interface UserInfo {
  id: string // 添加MongoDB的_id字段
  username: string
  balance: number
  role: string
  email: string
  status: string
  is_admin: number
  disabled?: boolean
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
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [rechargeRecords, setRechargeRecords] = useState<RechargeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecord, setSelectedRecord] = useState<ConsumptionRecord | null>(null)
  const [detailLoading, setDetailLoading] = useState<{[key: number]: boolean}>({})

  // 获取最新用户信息
  const refreshUserInfo = useCallback(async (token: string): Promise<UserInfo | null> => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUserInfo(data.data)
          // 同时更新本地存储
          localStorage.setItem('userInfo', JSON.stringify(data.data))
          
          // 如果用户被禁用，显示提示信息
          if (data.data.disabled || data.data.status === 'inactive') {
            console.log('用户账户已被禁用')
          }
          
          return data.data
        }
      } else if (response.status === 403) {
        // 用户账户被禁用，立即清除登录态并重定向到登录页
        console.log('Account disabled, logging out and redirecting to login')
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        sessionStorage.clear()
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setShowLoginDialog(true)
        return null
      } else if (response.status === 401) {
        // token无效，跳转到登录页
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        sessionStorage.clear()
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setShowLoginDialog(true)
        return null
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error)
      return null
    } finally {
      setLoading(false)
    }
    return null
  }, [])

  const loadUserData = useCallback(async (token: string, currentUserInfo?: UserInfo) => {
    try {
      setLoading(true)
      
      // 获取最新用户信息（包括余额）
      const updatedUserInfo = await refreshUserInfo(token)
      const userToUse = updatedUserInfo || currentUserInfo
      
      // 确保有用户信息后再获取记录
      if (userToUse?.username) {
        // 获取消费记录 - 使用username参数
        const consumptionResponse = await fetch(`/api/consumption/user?username=${userToUse.username}`)
        if (consumptionResponse.ok) {
          const consumptionData = await consumptionResponse.json()
          setConsumptionRecords(consumptionData.data || [])
        } else {
          console.error('获取消费记录失败:', consumptionResponse.status)
        }
        
        // 获取充值记录 - 使用username参数
        const rechargeResponse = await fetch(`/api/recharge/user?username=${userToUse.username}`)
        if (rechargeResponse.ok) {
          const rechargeData = await rechargeResponse.json()
          setRechargeRecords(rechargeData.data || [])
        } else {
          console.error('获取充值记录失败:', rechargeResponse.status)
        }
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [refreshUserInfo])

  const fetchRecordDetail = useCallback(async (recordId: number) => {
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
  }, [])

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

  // 在所有函数定义后添加useEffect
  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("authToken")
    const user = localStorage.getItem("userInfo")
    
    if (!token || !user) {
      // 未登录，打开登录对话框
      setShowLoginDialog(true)
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
    loadUserData(token, userInfo)
    
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
  }, [loadUserData, refreshUserInfo])

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
      <div className="w-full mx-auto space-y-6 px-4">
        {/* 头部导航 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-2xl font-bold">个人中心</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* 禁用用户警告 */}
        {(userInfo.disabled || userInfo.status === 'inactive') && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-destructive">
                <div className="w-4 h-4 rounded-full bg-destructive"></div>
                <p className="font-medium">账户已被禁用</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                您的账户已被管理员禁用，无法使用相关功能。如有疑问，请联系管理员。
              </p>
            </CardContent>
          </Card>
        )}

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
                disabled={loading || userInfo.disabled || userInfo.status === 'inactive'}
                title={userInfo.disabled || userInfo.status === 'inactive' ? '账户已被禁用' : '刷新余额'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新余额
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 简约紧凑布局 */}
            <div className="space-y-3">
              {/* 用户信息网格 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">用户名</p>
                  </div>
                  <p className="font-semibold">{userInfo.username}</p>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">当前余额</p>
                  </div>
                  <p className="font-bold text-lg">{parseFloat(userInfo.balance?.toString() || '0').toFixed(2)} 积分</p>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">账户状态</p>
                  </div>
                  {getStatusBadge(userInfo.status)}
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">用户角色</p>
                  </div>
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
                          <TableHead className="pl-6 w-32">用户名</TableHead>
                          <TableHead className="w-32 text-center">Token使用</TableHead>
                          <TableHead className="w-32 text-center">积分消费</TableHead>
                          <TableHead className="w-32 text-center">消费金额</TableHead>
                          <TableHead className="w-44">消费时间</TableHead>
                          <TableHead className="w-24 text-center">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consumptionRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="pl-6 font-medium">{record.username}</TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                {(record.token_used || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono text-orange-600 dark:text-orange-400 font-semibold">
                                {(parseFloat(record.points_used?.toString() || '0')).toFixed(4)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                ¥{parseFloat(record.cost?.toString() || '0').toFixed(4)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(record.created_at)}</TableCell>
                            <TableCell className="text-center">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={detailLoading[record.id]}
                                    onClick={() => fetchRecordDetail(record.id)}
                                  >
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
                          <TableHead className="pl-6 w-32">用户名</TableHead>
                          <TableHead className="w-32 text-center">充值金额</TableHead>
                          <TableHead className="w-32 text-center">充值后余额</TableHead>
                          <TableHead className="w-44">充值时间</TableHead>
                          <TableHead className="w-32">备注</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rechargeRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="pl-6 font-medium">{record.username}</TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                +¥{parseFloat(record.amount?.toString() || '0').toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                ¥{parseFloat(record.balance_after?.toString() || '0').toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{formatDate(record.created_at)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-32 truncate" title={record.remark || '-'}>{record.remark || '-'}</TableCell>
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
      
      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog}
        onSuccess={() => {
          setShowLoginDialog(false)
          window.location.reload()
        }}
      />
    </div>
  )
}