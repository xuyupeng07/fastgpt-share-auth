"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { LogIn, Info } from "lucide-react"
import Image from "next/image"
import { Header } from "@/components/Header"
import { WorkflowCard } from "@/components/WorkflowCard"
import { PartnersCompact } from "@/components/Partners"
import { LoginDialog } from "@/components/auth/login-dialog"
import { Workflow } from "@/lib/types"
import { AuthUtils } from "@/lib/auth"

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

interface UserInfo {
  id: string
  username: string
  balance: number
  role: string
  email: string
  status: string
  is_admin: boolean
  avatar?: string
  disabled?: boolean
}

export default function HomePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  // links removed as it is not used
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [categories, setCategories] = useState<Category[]>([{ id: 'all', name: '全部', sort_order: 0 }])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('mostUsed')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // fetchLinks function removed as it is not used

  // 获取工作流数据（从MongoDB数据库）
  const fetchWorkflows = useCallback(async () => {
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
  }, [])

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

  // handleSearch function removed as it is not used

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
  const refreshUserInfo = useCallback(async (token: string) => {
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
        setShowLoginDialog(true)
        return
      } else if (response.status === 401) {
        // token无效，跳转到登录页
        localStorage.removeItem('authToken')
        localStorage.removeItem('userInfo')
        // 清除cookie
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setShowLoginDialog(true)
      }
    } catch (error) {
      console.error('获取最新用户信息失败:', error)
    }
  }, [])

  // 获取分类数据
  const fetchCategories = useCallback(async () => {
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
  }, [])

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
          
          // 监听全局余额更新事件
          const handleBalanceUpdate = () => {
            if (token) {
              refreshUserInfo(token)
            }
          }
          
          window.addEventListener('focus', handleFocus)
          window.addEventListener('balanceUpdated', handleBalanceUpdate)
          
          // 设置清理函数
          cleanup = () => {
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('balanceUpdated', handleBalanceUpdate)
          }
        }
        
        // fetchLinks call removed as function is not used
        
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
  }, [refreshUserInfo, fetchWorkflows, fetchCategories])

  // 动态加载FastGPT聊天机器人脚本
  useEffect(() => {
    const loadChatbot = () => {
      // 检查是否已经加载过
      if (document.getElementById('chatbot-iframe') || document.getElementById('fastgpt-chatbot-button')) {
        return
      }

      // 先创建配置script元素
      const configScript = document.createElement('script')
      configScript.id = 'chatbot-iframe'
      configScript.setAttribute('data-bot-src', 'https://cloud.fastgpt.io/chat/share?shareId=tmwK0bv7ew5luTjxVHylcbi3')
      configScript.setAttribute('data-default-open', 'false')
      configScript.setAttribute('data-drag', 'true')
      configScript.setAttribute('data-open-icon', 'data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTMyNzg1NjY0IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjQxMzIiIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDMyQzI0Ny4wNCAzMiAzMiAyMjQgMzIgNDY0QTQxMC4yNCA0MTAuMjQgMCAwIDAgMTcyLjQ4IDc2OEwxNjAgOTY1LjEyYTI1LjI4IDI1LjI4IDAgMCAwIDM5LjA0IDIyLjRsMTY4LTExMkE1MjguNjQgNTI4LjY0IDAgMCAwIDUxMiA4OTZjMjY0Ljk2IDAgNDgwLTE5MiA0ODAtNDMyUzc3Ni45NiAzMiA1MTIgMzJ6IG0yNDQuOCA0MTZsLTM2MS42IDMwMS43NmExMi40OCAxMi40OCAwIDAgMS0xOS44NC0xMi40OGw1OS4yLTIzMy45MmgtMTYwYTEyLjQ4IDEyLjQ4IDAgMCAxLTcuMzYtMjMuMzZsMzYxLjYtMzAxLjc2YTEyLjQ4IDEyLjQ4IDAgMCAxIDE5Ljg0IDEyLjQ4bC01OS4yIDIzMy45MmgxNjBhMTIuNDggMTIuNDggMCAwIDEgOCAyMi4wOHoiIGZpbGw9IiM0ZTgzZmQiIHAtaWQ9IjQxMzMiPjwvcGF0aD48L3N2Zz4=')
      configScript.setAttribute('data-close-icon', 'data:image/svg+xml;base64,PHN2ZyB0PSIxNjkwNTM1NDQxNTI2IiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjYzNjciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48cGF0aCBkPSJNNTEyIDEwMjRBNTEyIDUxMiAwIDEgMSA1MTIgMGE1MTIgNTEyIDAgMCAxIDAgMTAyNHpNMzA1Ljk1NjU3MSAzNzAuMzk1NDI5TDQ0Ny40ODggNTEyIDMwNS45NTY1NzEgNjUzLjYwNDU3MWE0NS41NjggNDUuNTY4IDAgMSAwIDY0LjQzODg1OCA2NC40Mzg4NThMNTEyIDU3Ni41MTJsMTQxLjYwNDU3MSAxNDEuNTMxNDI5YTQ1LjU2OCA0NS41NjggMCAwIDAgNjQuNDM4ODU4LTY0LjQzODg1OEw1NzYuNTEyIDUxMmwxNDEuNTMxNDI5LTE0MS42MDQ1NzFhNDUuNTY4IDQ1LjU2OCAwIDEgMC02NC40Mzg4NTgtNjQuNDM4ODU4TDUxMiA0NDcuNDg4IDM3MC4zOTU0MjkgMzA1Ljk1NjU3MWE0NS41NjggNDUuNTY4IDAgMCAwLTY0LjQzODg1OCA2NC40Mzg4NTh6IiBmaWxsPSIjNGU4M2ZkIiBwLWlkPSI2MzY4Ij48L3BhdGg+PC9zdmc+')
      document.head.appendChild(configScript)
      
      // 然后加载功能脚本
      const script = document.createElement('script')
      script.src = '/chatbot.js'
      
      script.onload = () => {
        console.log('FastGPT聊天机器人脚本已加载')
      }
      
      script.onerror = (e) => {
        console.error('FastGPT聊天机器人脚本加载失败:', e)
      }
      
      // 添加到head中
      document.head.appendChild(script)
    }

    // 确保DOM完全加载后再执行
    if (document.readyState === 'complete') {
      loadChatbot()
    } else {
      window.addEventListener('load', loadChatbot)
      return () => window.removeEventListener('load', loadChatbot)
    }
  }, [])

  // handleLinkClick function removed as it is not used

  const handleLogout = () => {
    AuthUtils.handleLogout()
    setUserInfo(null)
    setAuthToken(null)
  }

  const handleLogin = () => {
    setShowLoginDialog(true)
  }

  // 登录成功后的回调函数
  const handleLoginSuccess = async () => {
    const token = localStorage.getItem("authToken")
    const user = localStorage.getItem("userInfo")
    
    if (token && user) {
      setAuthToken(token)
      setUserInfo(JSON.parse(user))
      
      // 获取最新用户信息
      await refreshUserInfo(token)
    }
    
    setShowLoginDialog(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-slate-50/60 to-indigo-50/40 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/80">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-slate-50/60 to-indigo-50/40 dark:from-slate-900 dark:via-blue-950/30 dark:to-indigo-950/20">
      {/* Header组件 */}
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userInfo={userInfo}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefreshUserInfo={() => {
          const token = localStorage.getItem('authToken')
          if (token) {
            refreshUserInfo(token)
          }
        }}
      />
      
      <div className="container mx-auto px-4 py-8">


        {/* 主要内容区域 */}
        <div className="text-center mb-12">
          <div className="mb-8 relative">
            <Image 
              src="/headerImage.png" 
              alt="AI工作流智能体交易生态社区" 
              width={1200}
              height={600}
              className="w-full mx-auto rounded-lg shadow-lg"
            />
<div className="absolute bottom-2 left-14 md:bottom-4 md:left-22 lg:bottom-6 lg:left-48 flex gap-2 sm:gap-3 md:gap-4">
  <a 
    href="https://fastgpt.cn/zh" 
    target="_blank" 
    rel="noopener noreferrer"
    className="group relative flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
  >
    {/* 外层光环 - 呼吸效果 */}
    <div className="absolute -inset-0.5 sm:-inset-1 md:-inset-1.5 bg-gradient-to-r from-blue-400/30 via-white/20 to-orange-400/30 rounded-lg sm:rounded-xl md:rounded-2xl blur-sm sm:blur-md animate-pulse opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
    
    {/* 透明磨砂背景 */}
    <div className="absolute inset-0 backdrop-blur-xl sm:backdrop-blur-2xl rounded-lg sm:rounded-xl border border-white/20 group-hover:border-white/40 group-hover:bg-white/5 transition-all duration-300 overflow-hidden">
      {/* 金属扫光效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/40 group-hover:translate-x-full transition-all duration-800 -translate-x-full"></div>
    </div>
    
    {/* 内层高光 */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-lg sm:rounded-xl group-hover:from-white/20 transition-all duration-300"></div>
    
    {/* 文字 */}
    <span className="relative text-white group-hover:text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.05em] sm:tracking-[0.15em] transition-all duration-300 drop-shadow-lg">
      免费使用
    </span>
    
    {/* 底部微光 */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:via-white/80 transition-all duration-500"></div>
  </a>
  
  {/* 商业版咨询按钮 */}
  <a 
    href="https://fael3z0zfze.feishu.cn/share/base/form/shrcnjJWtKqjOI9NbQTzhNyzljc?prefill_S=C2&hide_S=1" 
    target="_blank" 
    rel="noopener noreferrer"
    className="group relative flex items-center justify-center px-2 py-1.5 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-3.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
  >
    {/* 外层光环 - 呼吸效果 */}
    <div className="absolute -inset-0.5 sm:-inset-1 md:-inset-1.5 bg-gradient-to-r from-purple-400/30 via-white/20 to-pink-400/30 rounded-lg sm:rounded-xl md:rounded-2xl blur-sm sm:blur-md animate-pulse opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
    
    {/* 透明磨砂背景 */}
    <div className="absolute inset-0 backdrop-blur-xl sm:backdrop-blur-2xl rounded-lg sm:rounded-xl border border-white/20 group-hover:border-white/40 group-hover:bg-white/5 transition-all duration-300 overflow-hidden">
      {/* 金属扫光效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/40 group-hover:translate-x-full transition-all duration-800 -translate-x-full"></div>
    </div>
    
    {/* 内层高光 */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-lg sm:rounded-xl group-hover:from-white/20 transition-all duration-300"></div>
    
    {/* 文字 */}
    <span className="relative text-white group-hover:text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold tracking-[0.05em] sm:tracking-[0.15em] transition-all duration-300 drop-shadow-lg">
      商业版咨询
    </span>
    
    {/* 底部微光 */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:via-white/80 transition-all duration-500"></div>
  </a>
</div>
          </div>
          {!userInfo && (
            <Alert variant="info" className="max-w-2xl mx-auto mb-8 shadow-lg border-2">
              <Info className="h-5 w-5" />
              <AlertDescription className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium mb-2">解锁完整功能体验</p>
                  <p className="text-sm opacity-90">登录后可享受个性化推荐、收藏工作流、查看使用记录等完整功能</p>
                </div>
                <Button 
                  onClick={handleLogin}
                  className="ml-4 shadow-md hover:shadow-lg transition-all duration-200"
                  size="sm"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  立即登录
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* 筛选区域 */}
        <div className="space-y-4 sm:space-y-6 mb-8">
          {/* 响应式筛选布局 */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            {/* 排序选项 */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
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
                onClick={() => setSortBy('latest')}
                className={`rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  sortBy === 'latest' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/70 hover:scale-105 hover:shadow-sm'
                }`}
              >
                最新
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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
      
      {/* 合作伙伴轮播图 */}
      <PartnersCompact />
      
      {/* 登录对话框 */}
       <LoginDialog 
         open={showLoginDialog} 
         onOpenChange={setShowLoginDialog}
         onSuccess={handleLoginSuccess}
       />
       
       {/* FastGPT聊天机器人脚本 - 使用useEffect动态加载 */}
       {typeof window !== 'undefined' && (
         <div id="chatbot-container" />
       )}
    </div>
  )
}