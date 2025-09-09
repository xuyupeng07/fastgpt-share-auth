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

interface Category {
  id: string
  name: string
  sort_order: number
}

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [links, setLinks] = useState<LinkConfig[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: '全部', sort_order: 0 }])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
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

  const handleLike = (workflowId: string, newLikeCount: number) => {
    console.log('点赞工作流:', workflowId)
    // 更新本地工作流数据中的点赞数
    setWorkflows(prevWorkflows => 
      prevWorkflows.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, likeCount: newLikeCount }
          : workflow
      )
    )
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
          workflow.description.toLowerCase().includes(query)
      )
    }

    // 分类过滤
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(workflow => workflow.category_name === selectedCategory)
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

  // 获取分类数据
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await fetch('/api/categories')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const allCategories = [
            { id: 'all', name: '全部', sort_order: 0 },
            ...result.data.sort((a: Category, b: Category) => a.sort_order - b.sort_order)
          ]
          setCategories(allCategories)
        } else {
          console.error('获取分类失败:', result.message)
        }
      }
    } catch (error) {
      console.error('获取分类失败:', error)
    } finally {
      setCategoriesLoading(false)
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
        
        // 获取分类数据
        await fetchCategories()
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
          <div className="mb-8 relative">
            <img 
              src="/headerImage.png" 
              alt="AI工作流智能体交易生态社区" 
              className="w-full mx-auto rounded-lg shadow-lg"
            />
<div className="absolute bottom-2 left-14 md:bottom-4 md:left-22 lg:bottom-6 lg:left-48">
  <a 
    href="https://fastgpt.cn/zh" 
    target="_blank" 
    rel="noopener noreferrer"
    className="group relative flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
  >
    {/* 外层光环 - 呼吸效果 */}
    <div className="absolute -inset-0.5 sm:-inset-1 md:-inset-1.5 bg-gradient-to-r from-blue-400/30 via-white/20 to-purple-400/30 rounded-lg sm:rounded-xl md:rounded-2xl blur-sm sm:blur-md animate-pulse opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
    
    {/* 透明磨砂背景 */}
    <div className="absolute inset-0 backdrop-blur-xl sm:backdrop-blur-2xl rounded-lg sm:rounded-xl border border-white/20 group-hover:border-white/40 group-hover:bg-white/5 transition-all duration-300 overflow-hidden">
      {/* 金属扫光效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/40 group-hover:translate-x-full transition-all duration-800 -translate-x-full"></div>
    </div>
    
    {/* 内层高光 */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-lg sm:rounded-xl group-hover:from-white/20 transition-all duration-300"></div>
    
    {/* 文字 */}
    <span className="relative text-white group-hover:text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.1em] sm:tracking-[0.15em] transition-all duration-300 drop-shadow-lg">
      免费使用
    </span>
    
    {/* 底部微光 */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:via-white/80 transition-all duration-500"></div>
  </a>
</div>
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
        <div className="space-y-4 sm:space-y-6 mb-8">
          {/* 响应式筛选布局 */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* 排序选项 */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
              <button
                onClick={() => setSortBy('latest')}
                className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  sortBy === 'latest' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/70 hover:scale-105 hover:shadow-sm'
                }`}
              >
                最新
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  sortBy === 'popular' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/70 hover:scale-105 hover:shadow-sm'
                }`}
              >
                最受欢迎
              </button>
              <button
                onClick={() => setSortBy('mostUsed')}
                className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  sortBy === 'mostUsed' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/70 hover:scale-105 hover:shadow-sm'
                }`}
              >
                使用最多
              </button>
            </div>

            {/* 分类筛选 - 响应式滚动 */}
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 lg:pb-0 lg:flex-wrap lg:justify-end scrollbar-hide">
              {!categoriesLoading && categories.map((category) => {
                const count = category.name === '全部' 
                  ? workflows.length 
                  : workflows.filter(w => w.category_name === category.name).length
                
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.name ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category.name 
                        ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90' 
                        : 'border-border hover:border-border/80 hover:bg-muted'
                    }`}
                  >
                    {category.name} ({count})
                  </Button>
                )
              })}
            </div>
          </div>

          {/* 搜索结果提示 */}
          {searchQuery && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                找到 {filteredAndSortedWorkflows.length} 个相关工作流
              </p>
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