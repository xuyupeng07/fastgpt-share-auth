"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { User, ArrowLeft, CreditCard, Activity, RefreshCw, Settings, Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tooltip } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { LoginDialog } from "@/components/auth/login-dialog"

interface UserInfo {
  id: string // 添加MongoDB的_id字段
  username: string
  balance: number
  role: string
  email: string
  status: string
  is_admin: boolean
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
  appname?: string
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
    
    // 监听全局余额更新事件
    const handleBalanceUpdate = () => {
      if (token) {
        refreshUserInfo(token)
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('balanceUpdated', handleBalanceUpdate)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('balanceUpdated', handleBalanceUpdate)
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* 头部导航 */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">个人中心</h1>
          <div className="flex items-center space-x-3">
            <Tooltip content="返回主页" side="bottom">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/'}
                className="hover:scale-105 transition-all duration-200"
              >
                <Home className="h-4 w-4" />
              </Button>
            </Tooltip>
            {userInfo.is_admin === true && (
              <Tooltip content="后台管理" side="bottom">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/admin'}
                  className="hover:scale-105 transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}
            <ThemeToggle />
          </div>
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
                          <TableHead className="text-left">对话ID</TableHead>
                          <TableHead className="text-left">工作流名称</TableHead>
                          <TableHead className="text-center">Token使用</TableHead>
                          <TableHead className="text-center">消费金额</TableHead>
                          <TableHead className="text-left">消费时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {consumptionRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-left font-mono text-sm text-muted-foreground">{record.id}</TableCell>
                            <TableCell className="text-left font-medium text-primary">
                              {record.appname || '未知工作流'}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                                {(record.token_used || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-semibold text-red-600 dark:text-red-400">
                                ¥{(parseFloat(record.cost?.toString() || '0')).toFixed(4)}
                              </span>
                            </TableCell>
                            <TableCell className="text-left text-sm text-muted-foreground">{formatDate(record.created_at)}</TableCell>
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
                          <TableHead className="text-left">订单ID</TableHead>
                          <TableHead className="text-center">充值金额</TableHead>
                          <TableHead className="text-center">充值后余额</TableHead>
                          <TableHead className="text-left">充值时间</TableHead>
                          <TableHead className="text-left">备注</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rechargeRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-left font-mono text-sm text-muted-foreground">{record.id}</TableCell>
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
                            <TableCell className="text-left text-sm text-muted-foreground">{formatDate(record.created_at)}</TableCell>
                            <TableCell className="text-left text-sm text-muted-foreground max-w-32 truncate" title={record.remark || '-'}>{record.remark || '-'}</TableCell>
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