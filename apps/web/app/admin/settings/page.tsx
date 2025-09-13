"use client"

import { useState, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Textarea } from "@workspace/ui/components/textarea"
import { Separator } from "@workspace/ui/components/separator"
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react"
import { useAdminAuth } from "@/hooks/useAdminAuth"
import { AccessDenied, AdminAuthLoading } from "@/components/admin/access-denied"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserDropdown } from "@/components/UserDropdown"
import { toast, Toaster } from "sonner"
import { AuthUtils } from "@/lib/auth"

interface SensitiveWord {
  id?: number
  word: string
  category: string
  created_at?: string
}

export default function AdminSettingsPage() {
  const { isLoading, isAuthenticated, isAdmin, user, error, logout } = useAdminAuth()
  const [sensitiveWords, setSensitiveWords] = useState<SensitiveWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [newCategory, setNewCategory] = useState('默认')
  const [isLoadingWords, setIsLoadingWords] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 获取敏感词列表
  const fetchSensitiveWords = async () => {
    try {
      setIsLoadingWords(true)
      const token = AuthUtils.getToken()
      if (!token) {
        toast.error('请先登录')
        return
      }
      
      const response = await fetch('/api/admin/sensitive-words', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setSensitiveWords(data.data || [])
      } else {
        toast.error(data.error || '获取敏感词失败')
      }
    } catch (error) {
      console.error('获取敏感词失败:', error)
      toast.error('获取敏感词失败')
    } finally {
      setIsLoadingWords(false)
    }
  }



  // 添加敏感词（支持单个和批量）
  const addWords = async () => {
    // 从输入框获取词汇，支持换行分隔的批量输入
    const inputText = newWord.trim()
    if (!inputText) {
      toast.error('请输入敏感词')
      return
    }

    const words = inputText.split('\n').map(word => word.trim()).filter(word => word)
    if (words.length === 0) {
      toast.error('请输入有效的敏感词')
      return
    }

    try {
      setIsSaving(true)
      const token = AuthUtils.getToken()
      if (!token) {
        toast.error('请先登录')
        return
      }

      // 逐个添加敏感词
      let successCount = 0
      let duplicateCount = 0
      let errorCount = 0
      const duplicateWords: string[] = []
      
      for (const word of words) {
        try {
          const response = await fetch('/api/admin/sensitive-words', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              word: word,
              category: newCategory.trim() || '默认'
            })
          })
          
          const data = await response.json()
          if (data.success) {
            successCount++
          } else if (data.error && data.error.includes('已存在')) {
            duplicateCount++
            duplicateWords.push(word)
          } else {
            errorCount++
          }
        } catch {
          errorCount++
        }
      }
      
      // 构建提示信息
      const messages = []
      if (successCount > 0) {
        messages.push(`成功添加 ${successCount} 个敏感词`)
      }
      if (duplicateCount > 0) {
        messages.push(`${duplicateCount} 个敏感词已存在`)
      }
      if (errorCount > 0) {
        messages.push(`${errorCount} 个添加失败`)
      }
      
      if (successCount > 0 || duplicateCount > 0) {
        toast.success(messages.join('，'))
        setNewWord('')
        setNewCategory('默认')
        fetchSensitiveWords()
      } else {
        toast.error('添加敏感词失败')
      }
    } catch (error) {
      console.error('添加敏感词失败:', error)
      toast.error('添加敏感词失败')
    } finally {
      setIsSaving(false)
    }
  }

  // Removed unused handleEditWord function

  // 删除敏感词
  const deleteSensitiveWord = async (id: number) => {
    try {
      const token = AuthUtils.getToken()
      if (!token) {
        toast.error('请先登录')
        return
      }
      
      const response = await fetch(`/api/admin/sensitive-words?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('敏感词删除成功')
        fetchSensitiveWords()
      } else {
        toast.error(data.error || '删除敏感词失败')
      }
    } catch (error) {
      console.error('删除敏感词失败:', error)
      toast.error('删除敏感词失败')
    }
  }

  // 清空所有敏感词
  const clearAllWords = async () => {
    const confirmClear = () => new Promise((resolve, reject) => {
      toast('确定要清空所有敏感词吗？此操作不可恢复！', {
        action: {
          label: '确认清空',
          onClick: () => resolve(true)
        },
        cancel: {
          label: '取消',
          onClick: () => reject(new Error('用户取消操作'))
        },
        duration: 10000
      })
    })

    try {
      await confirmClear()
      
      const token = AuthUtils.getToken()
      if (!token) {
        toast.error('请先登录')
        return
      }

      // 逐个删除所有敏感词
      let successCount = 0
      let errorCount = 0
      
      for (const word of sensitiveWords) {
        if (word.id) {
          try {
            const response = await fetch(`/api/admin/sensitive-words?id=${word.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            
            const data = await response.json()
            if (data.success) {
              successCount++
            } else {
              errorCount++
            }
          } catch {
            errorCount++
          }
        }
      }
      
      if (successCount > 0) {
        toast.success(`成功清空 ${successCount} 个敏感词${errorCount > 0 ? `，${errorCount} 个失败` : ''}`)
        fetchSensitiveWords()
      } else {
        toast.error('清空失败')
      }
    } catch (cancelError: unknown) {
      // 用户取消操作，不显示错误信息
      if (cancelError instanceof Error && cancelError.message !== '用户取消操作') {
        console.error('清空敏感词失败:', cancelError)
        toast.error('清空敏感词失败')
      }
    }
  }

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchSensitiveWords()
    }
  }, [isAuthenticated, isAdmin])

  // 加载中状态
  if (isLoading) {
    return <AdminAuthLoading />
  }

  // 未登录或权限不足
  if (!isAuthenticated || !isAdmin) {
    return (
      <AccessDenied 
        title={!isAuthenticated ? "请先登录" : "权限不足"}
        message={error || "您需要管理员权限才能访问此页面"}
        showLoginButton={!isAuthenticated}
        showHomeButton={true}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">系统设置</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <UserDropdown 
                 userInfo={user} 
                 onLogout={logout}
                 onAvatarUpdate={() => {
                   // 系统设置页面不需要头像更新功能，但保持接口一致性
                 }}
                 hideMenuItems={['settings']}
                 showHomeButton={true}
                 showBackToAdmin={true}
               />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 敏感词管理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                敏感词管理
                <Badge variant="secondary">{sensitiveWords.length} 个词汇</Badge>
              </CardTitle>
              <CardDescription>
                管理系统的敏感词过滤规则，用于内容审核和安全检测
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 添加敏感词 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">添加敏感词</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="分类（可选）"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <Textarea
                    placeholder="输入敏感词，支持单个添加或换行分隔批量导入多个敏感词"
                    value={newWord}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewWord(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {newWord.split('\n').filter(word => word.trim()).length} 个词汇待添加
                    </span>
                    <Button 
                      onClick={addWords}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      添加敏感词
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 敏感词列表 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">当前敏感词列表</h3>
                  {sensitiveWords.length > 0 && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={clearAllWords}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      清空全部
                    </Button>
                  )}
                </div>
                
                {isLoadingWords ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">加载中...</p>
                  </div>
                ) : sensitiveWords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无敏感词，请添加敏感词进行管理
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {sensitiveWords.map((word) => (
                      <div 
                        key={word.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{word.word}</span>
                          <Badge variant="outline" className="text-xs">
                            {word.category}
                          </Badge>
                          {word.created_at && (
                            <span className="text-xs text-gray-500">
                              {new Date(word.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => word.id && deleteSensitiveWord(word.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}