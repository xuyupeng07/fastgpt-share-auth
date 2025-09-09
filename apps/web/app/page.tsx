"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ExternalLink, LogIn } from "lucide-react"
import { Header } from "@/components/Header"
import { WorkflowGrid } from "@/components/WorkflowGrid"
import { WorkflowCard } from "@/components/WorkflowCard"
import { Workflow } from "@/lib/types"

interface LinkConfig {
  id: number
  url: string
  name: string
  description?: string
}

type SortOption = 'latest' | 'popular' | 'mostUsed'

const categories = [
  '全部',
  '客服助手',
  '办公助手', 
  '编程助手',
  '学习助手',
  '生活助手',
  '创作助手',
  '其他'
]

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkConfig[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('latest')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [isLoading, setIsLoading] = useState(true)

  // 获取工作流链接配置
  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/workflows')
      const result = await response.json()
      
      if (result.success) {
        // 只显示启用且有no_login_url的工作流
        const enabledWorkflows = result.data
          .filter((workflow: any) => workflow.status === 'active' && workflow.no_login_url)
          .map((workflow: any) => ({
            id: workflow.id,
            name: workflow.name,
            url: workflow.no_login_url,
            description: workflow.description
          }))
        setLinks(enabledWorkflows)
      } else {
        console.error('获取工作流配置失败:', result.message)
      }
    } catch (error) {
      console.error('获取工作流配置失败:', error)
    }
  }

  // 获取工作流数据（从MongoDB数据库）
  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/cards')
      const result = await response.json()
      
      if (result.success) {
        setWorkflows(result.data)
      } else {
        console.error('获取工作流数据失败:', result.message)
        // 如果API失败，设置空数组
        setWorkflows([])
      }
    } catch (error) {
      console.error('获取工作流数据失败:', error)
      // 如果请求失败，设置空数组
      setWorkflows([])
    }
  }

  // 工作流操作处理函数
  const handleTryWorkflow = (workflow: Workflow) => {
    console.log('尝试工作流:', workflow.name)
  }

  const handleLike = (workflowId: string) => {
    console.log('点赞工作流:', workflowId)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // 过滤和排序工作流
  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        workflow =>
          workflow.name.toLowerCase().includes(query) ||
          workflow.description.toLowerCase().includes(query) ||
          workflow.author.name.toLowerCase().includes(query)
      )
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(workflow => workflow.category === selectedCategory)
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.likeCount || 0) - (a.likeCount || 0)
        case 'mostUsed':
          return (b.usageCount || 0) - (a.usageCount || 0)
        case 'latest':
        default:
          return b.id.localeCompare(a.id) // 简单的按ID排序，实际项目中应该用创建时间
      }
    })

    return sorted
  }, [workflows, searchQuery, selectedCategory, sortBy])

  // 获取最新用户信息
  const refreshUserInfo = async (token: string) => {
    try {
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
        }
      } else if (response.status === 403) {
        // 用户账户被禁用，立即清除登录态并重定向到登录页
        console.log('Account disabled, logging out and redirecting to login')
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        sessionStorage.clear()
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        window.location.href = '/login?disabled=true'
        return
      } else if (response.status === 401) {
        // token无效，跳转到登录页
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('获取最新用户信息失败:', error)
    }
  }

  useEffect(() => {
    let cleanup: (() => void) | null = null
    
    const initializePage = async () => {
      try {
        // 检查登录状态
        const token = localStorage.getItem("authToken")
        const user = localStorage.getItem("userInfo")
        
        if (token && user) {
          setAuthToken(token)
          setUserInfo(JSON.parse(user))
          
          // 获取最新用户信息
          await refreshUserInfo(token)
          
          // 监听页面焦点事件，当页面重新获得焦点时刷新用户信息
          const handleFocus = () => {
            if (token) {
              refreshUserInfo(token)
            }
          }
          
          window.addEventListener('focus', handleFocus)
          
          // 设置清理函数
          cleanup = () => {
            window.removeEventListener('focus', handleFocus)
          }
        }
        
        // 获取工作流链接配置（无论是否登录都显示）
        await fetchLinks()
        
        // 获取工作流数据
        await fetchWorkflows()
      } catch (error) {
        console.error('页面初始化失败:', error)
      } finally {
        // 无论如何都要设置加载完成
        setIsLoading(false)
      }
    }
    
    initializePage()
    
    // 返回清理函数
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  const handleLinkClick = (url: string) => {
    if (authToken) {
      const fastgptUrl = `${url}&authToken=${authToken}`
      window.open(fastgptUrl, '_blank')
    } else {
      // 未登录时跳转到登录页
      window.location.href = '/login'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userInfo")
    // 清除cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUserInfo(null)
    setAuthToken(null)
  }

  const handleLogin = () => {
    window.location.href = '/login'
  }

  if (isLoading) {
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
      {/* Header组件 */}
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userInfo={userInfo}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefreshUserInfo={() => authToken && refreshUserInfo(authToken)}
      />
      
      <div className="container mx-auto px-4 py-8">


        {/* 主要内容区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            AI工作流智能体交易生态社区
          </h1>
          <p className="text-muted-foreground text-xl max-w-4xl mx-auto leading-relaxed mb-6">
            为AI开发者、企业和爱好者提供共享、交易和使用AI工作流及智能体的优质环境。通过积分体系，创作者可以获得收益，使用者可以获得高质量解决方案。
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">💡 知识共享</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">💰 创作变现</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">🚀 技术创新</span>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">🤝 生态共建</span>
          </div>
          {!userInfo && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 max-w-2xl mx-auto mb-8">
              <p className="text-orange-600 dark:text-orange-400 text-sm">
                💡 提示：需要登录后才能使用完整功能
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogin}
                className="mt-2"
              >
                <LogIn className="h-4 w-4 mr-2" />
                立即登录
              </Button>
            </div>
          )}
        </div>
        
        {/* 筛选区域 */}
        <div className="space-y-6 mb-8">

          {/* 排序按钮 */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === 'latest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('latest')}
            >
              最新
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popular')}
            >
              最受欢迎
            </Button>
            <Button
              variant={sortBy === 'mostUsed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('mostUsed')}
            >
              使用最多
            </Button>
          </div>

          {/* 分类筛选 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* 搜索结果提示 */}
          {searchQuery && (
            <div className="text-sm text-gray-600">
              找到 {filteredAndSortedWorkflows.length} 个相关工作流
            </div>
          )}
        </div>
        
        {/* 工作流网格 */}
        {filteredAndSortedWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onTryWorkflow={handleTryWorkflow}
                onLike={handleLike}
                authToken={authToken}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.881-6.08 2.33" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">没有找到工作流</h3>
            <p className="text-gray-500">尝试调整搜索条件或分类筛选</p>
          </div>
        )}
      </div>
    </div>
  )
}