'use client'

import { useState, useEffect } from 'react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card'
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react'
import { useStats } from '@/contexts/stats-context'
import { toast } from 'sonner'

// 分类接口类型
interface Category {
  _id: string
  id: string
  name: string
  sort_order: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 表单数据类型
interface CategoryFormData {
  name: string
  sort_order: number
  status: 'active' | 'inactive'
}

export function CategoriesTable() {
  const { refreshStats } = useStats()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    sort_order: 0,
    status: 'active'
  })

  const [submitting, setSubmitting] = useState(false)

  // 加载分类列表
  const loadCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '获取分类列表失败')
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
      toast.error('获取分类列表失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }



  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      sort_order: 0,
      status: 'active'
    })
  }

  // 打开创建对话框
  const openCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  // 打开编辑对话框
  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      sort_order: category.sort_order,
      status: category.status
    })
    setIsEditDialogOpen(true)
  }

  // 打开删除对话框
  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  // 关闭对话框
  const closeDialogs = () => {
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    setIsDeleteDialogOpen(false)
    setSelectedCategory(null)
    resetForm()
  }

  // 提交表单
  const handleSubmit = async (isEdit: boolean = false) => {
    // 验证表单
    if (!formData.name.trim()) {
      toast.error('分类名称不能为空')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('authToken')
      const url = '/api/admin/categories'
      const method = isEdit ? 'PUT' : 'POST'
      const body = isEdit ? 
        { ...formData, id: selectedCategory?.id } : 
        formData

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(isEdit ? '分类更新成功' : '分类创建成功')
        closeDialogs()
        loadCategories()
        refreshStats()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || (isEdit ? '更新分类失败' : '创建分类失败'))
      }
    } catch (error) {
      console.error('提交表单失败:', error)
      toast.error(isEdit ? '更新分类失败，请稍后重试' : '创建分类失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 删除分类
  const handleDelete = async () => {
    if (!selectedCategory) return

    try {
      setSubmitting(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/admin/categories?id=${selectedCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('分类删除成功')
        closeDialogs()
        loadCategories()
        refreshStats()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || '删除分类失败')
      }
    } catch (error) {
      console.error('删除分类失败:', error)
      toast.error('删除分类失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  useEffect(() => {
    loadCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>分类管理</CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新增分类
          </Button>
        </div>
      </CardHeader>
      <CardContent>


        {/* 分类表格 */}
        <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-48">分类名称</TableHead>
              <TableHead className="w-24 text-center">排序</TableHead>
              <TableHead className="w-24 text-center">状态</TableHead>
              <TableHead className="w-44">创建时间</TableHead>
              <TableHead className="w-44">更新时间</TableHead>
              <TableHead className="w-32 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无分类数据
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="pl-6 font-medium">{category.name}</TableCell>
                  <TableCell className="text-center">{category.sort_order}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {category.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(category.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(category.updated_at)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(category)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>

      {/* 创建分类对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增分类</DialogTitle>
            <DialogDescription>
              创建新的工作流分类
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">分类名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入分类名称"
              />
            </div>
            <div>
              <Label htmlFor="sort_order">排序</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="排序数字，越小越靠前"
              />
            </div>
            <div>
              <Label htmlFor="status">状态</Label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs} disabled={submitting}>
              取消
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改分类信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">分类名称 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入分类名称"
              />
            </div>
            <div>
              <Label htmlFor="edit-sort_order">排序</Label>
              <Input
                id="edit-sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="排序数字，越小越靠前"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">状态</Label>
              <select
                id="edit-status"
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">启用</option>
                <option value="inactive">禁用</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs} disabled={submitting}>
              取消
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={submitting}>
              {submitting ? '更新中...' : '更新'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除分类 "{selectedCategory?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs} disabled={submitting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}