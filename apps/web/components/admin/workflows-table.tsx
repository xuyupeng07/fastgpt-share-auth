'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@workspace/ui/components/dialog';
import { Plus, Edit, Trash2, ExternalLink, Check, X } from 'lucide-react';

// 工作流接口类型定义
interface Workflow {
  id: number;
  name: string;
  description: string;
  no_login_url: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// 表单数据类型
interface WorkflowFormData {
  name: string;
  description: string;
  no_login_url: string;
  status: 'active' | 'inactive';
}

export default function WorkflowsTable() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    no_login_url: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  // 加载工作流列表
  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      const result = await response.json();
      
      if (result.success) {
        setWorkflows(result.data);
      } else {
        showMessage('加载工作流列表失败', 'error');
      }
    } catch (error) {
      console.error('加载工作流列表失败:', error);
      showMessage('加载工作流列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 显示消息
  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      no_login_url: '',
      status: 'active'
    });
    setEditingWorkflow(null);
  };

  // 打开创建对话框
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description,
      no_login_url: workflow.no_login_url,
      status: workflow.status
    });
    setIsDialogOpen(true);
  };

  // 关闭对话框
  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.no_login_url.trim()) {
      showMessage('请填写所有必填字段', 'error');
      return;
    }

    // 验证URL格式
    try {
      new URL(formData.no_login_url);
    } catch {
      showMessage('请输入有效的URL格式', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/workflows';
      const method = editingWorkflow ? 'PUT' : 'POST';
      const body = editingWorkflow 
        ? { ...formData, id: editingWorkflow.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage(result.message, 'success');
        closeDialog();
        loadWorkflows();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('提交失败:', error);
      showMessage('操作失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 删除工作流
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个工作流吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        showMessage(result.message, 'success');
        loadWorkflows();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      console.error('删除失败:', error);
      showMessage('删除失败，请重试', 'error');
    }
  };

  // 测试链接
  const testLink = (url: string) => {
    window.open(url, '_blank');
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>工作流管理</CardTitle>
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
        <div className="flex justify-between items-center">
          <CardTitle>工作流管理</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新增工作流
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingWorkflow ? '编辑工作流' : '新增工作流'}
              </DialogTitle>
              <DialogDescription>
                {editingWorkflow ? '修改工作流信息' : '创建新的工作流配置'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  工作流名称 *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="请输入工作流名称"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  工作流描述 *
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="请输入工作流描述"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="no_login_url" className="text-right">
                  免登录链接 *
                </Label>
                <Input
                  id="no_login_url"
                  value={formData.no_login_url}
                  onChange={(e) => setFormData({ ...formData, no_login_url: e.target.value })}
                  className="col-span-3"
                  placeholder="https://example.com/workflow"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  状态
                </Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">启用</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? '提交中...' : (editingWorkflow ? '更新' : '创建')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-md flex items-center gap-2 mb-4 ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {messageType === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {message}
          </div>
        )}

        {/* 工作流表格 */}
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">工作流名称</TableHead>
              <TableHead className="w-48">描述</TableHead>
              <TableHead className="w-48">免登录链接</TableHead>
              <TableHead className="w-20 text-center">状态</TableHead>
              <TableHead className="w-40">创建时间</TableHead>
              <TableHead className="w-32 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无工作流数据
                </TableCell>
              </TableRow>
            ) : (
              workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium text-gray-900">{workflow.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-gray-600" title={workflow.description}>
                    {workflow.description}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <a 
                      href={workflow.no_login_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                      title={workflow.no_login_url}
                    >
                      {workflow.no_login_url}
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      workflow.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(workflow.created_at)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testLink(workflow.no_login_url)}
                        title="测试链接"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(workflow)}
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(workflow.id)}
                        title="删除"
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
    </Card>
  );
}