"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Key, Mail, Shield, ShieldOff, UserCheck, UserX } from "lucide-react"
import { useStats } from "@/contexts/stats-context"

interface User {
  id: string // MongoDB的_id字段
  username: string
  email: string
  balance: string | number
  status: 'active' | 'inactive'
  is_admin: boolean
  created_at: string
}

export function UsersTable() {
  const { refreshStats } = useStats()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10
  
  // 对话框状态
  const [editPasswordDialog, setEditPasswordDialog] = useState(false)
  const [editEmailDialog, setEditEmailDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')


  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setTotalPages(Math.ceil((data.total || data.users?.length || 0) / pageSize))
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      const response = await fetch('/api/users/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, status: newStatus }),
      })
      
      if (response.ok) {
         // 更新本地状态
         setUsers(users.map(user => 
           user.id === userId ? { ...user, status: newStatus } : user
         ))
         // 触发统计数据热更新
         refreshStats()
       } else {
        const errorData = await response.json()
        console.error('更新用户状态失败:', errorData.error)
        alert('更新用户状态失败: ' + errorData.error)
      }
    } catch (error) {
      console.error('更新用户状态失败:', error)
      alert('更新用户状态失败，请稍后重试')
    }
  }

  // 修改密码
  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword || !confirmPassword) {
      alert('请填写完整信息')
      return
    }
    
    if (newPassword !== confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }
    
    if (newPassword.length < 6) {
      alert('密码长度至少6位')
      return
    }
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })
      
      if (response.ok) {
        alert('密码修改成功')
        setEditPasswordDialog(false)
        setNewPassword('')
        setConfirmPassword('')
        setSelectedUser(null)
      } else {
        const errorData = await response.json()
        alert('修改密码失败: ' + errorData.error)
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      alert('修改密码失败，请稍后重试')
    }
  }

  // 修改邮箱
  const handleEmailChange = async () => {
    if (!selectedUser || !newEmail) {
      alert('请填写邮箱地址')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      alert('请输入有效的邮箱地址')
      return
    }
    
    try {
      const response = await fetch('/api/users/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id, email: newEmail }),
      })
      
      if (response.ok) {
        alert('邮箱修改成功')
        setUsers(users.map(user => 
          user.id === selectedUser.id ? { ...user, email: newEmail } : user
        ))
        setEditEmailDialog(false)
        setNewEmail('')
        setSelectedUser(null)
      } else {
        const errorData = await response.json()
        alert('修改邮箱失败: ' + errorData.error)
      }
    } catch (error) {
      console.error('修改邮箱失败:', error)
      alert('修改邮箱失败，请稍后重试')
    }
  }

  // 设置管理员权限
  const handleAdminChange = async (userId: string, isAdmin: boolean) => {
    try {
      const response = await fetch('/api/users/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, is_admin: isAdmin }),
      })
      
      if (response.ok) {
        // 更新本地状态
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_admin: isAdmin } : user
        ))
        // 触发统计数据热更新
        refreshStats()
      } else {
        const errorData = await response.json()
        console.error('更新管理员权限失败:', errorData.error)
        alert('更新管理员权限失败: ' + errorData.error)
      }
    } catch (error) {
      console.error('更新管理员权限失败:', error)
      alert('更新管理员权限失败，请稍后重试')
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      return
    }
    
    try {
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      
      if (response.ok) {
        alert('用户删除成功')
        setUsers(users.filter(user => user.id !== userId))
        refreshStats()
      } else {
        const errorData = await response.json()
        alert('删除用户失败: ' + errorData.error)
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除用户失败，请稍后重试')
    }
  }

  // 打开修改密码对话框
  const openPasswordDialog = (user: User) => {
    setSelectedUser(user)
    setNewPassword('')
    setConfirmPassword('')
    setEditPasswordDialog(true)
  }

  // 打开修改邮箱对话框
  const openEmailDialog = (user: User) => {
    setSelectedUser(user)
    setNewEmail(user.email || '')
    setEditEmailDialog(true)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }





  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
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
        <CardTitle>用户管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6 w-60">ID</TableHead>
                <TableHead className="w-32">用户名</TableHead>
                <TableHead className="w-48">邮箱</TableHead>
                <TableHead className="w-28 text-center">余额</TableHead>
                <TableHead className="w-20 text-center">状态</TableHead>
                <TableHead className="w-24 text-center">管理员</TableHead>
                <TableHead className="w-44">创建时间</TableHead>
                <TableHead className="w-20 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    暂无用户数据
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow 
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="pl-6 font-mono text-xs text-gray-500 max-w-56 truncate" title={user.id.toString()}>{user.id.toString()}</TableCell>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="text-gray-600">{user.email}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-green-600">
                        ¥{(parseFloat(String(user.balance)) || 0).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? '正常' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                        {user.is_admin ? '是' : '否'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-6 w-6 p-0 transition-all duration-200 hover:bg-gray-100 hover:scale-110 hover:bg-blue-50 rounded-md"
                          >
                            <span className="sr-only">操作菜单</span>
                            <MoreHorizontal className="h-3.5 w-3.5 transition-colors hover:text-blue-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          side="auto" 
                          className="bg-white border border-gray-200 shadow-xl rounded-lg"
                        >
                          <DropdownMenuItem 
                            onClick={() => openPasswordDialog(user)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Key className="h-4 w-4" />
                            修改密码
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openEmailDialog(user)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Mail className="h-4 w-4" />
                            修改邮箱
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAdminChange(user.id, !user.is_admin)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-purple-50 hover:text-purple-700"
                          >
                            {user.is_admin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            {user.is_admin ? '取消管理员' : '设为管理员'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                            className="cursor-pointer flex items-center gap-2 hover:bg-yellow-50 hover:text-yellow-700"
                          >
                            <Edit className="h-4 w-4" />
                            {user.status === 'active' ? '禁用用户' : '启用用户'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user.id)}
                            className="cursor-pointer flex items-center gap-2 hover:bg-red-50 hover:text-red-700 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            删除用户
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* 修改密码对话框 */}
      <Dialog open={editPasswordDialog} onOpenChange={setEditPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改用户密码</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.username} 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                新密码
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
                placeholder="请输入新密码"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-password" className="text-right">
                确认密码
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="col-span-3"
                placeholder="请再次输入新密码"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPasswordDialog(false)}>
              取消
            </Button>
            <Button onClick={handlePasswordChange}>
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改邮箱对话框 */}
      <Dialog open={editEmailDialog} onOpenChange={setEditEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改用户邮箱</DialogTitle>
            <DialogDescription>
              为用户 {selectedUser?.username} 设置新邮箱
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-email" className="text-right">
                当前邮箱
              </Label>
              <Input
                id="current-email"
                value={selectedUser?.email || ''}
                disabled
                className="col-span-3 bg-gray-50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-email" className="text-right">
                新邮箱
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="col-span-3"
                placeholder="请输入新邮箱地址"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEmailChange}>
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}