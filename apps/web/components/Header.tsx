'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { User, LogOut, RefreshCw, LogIn } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import Image from 'next/image'

interface UserInfo {
  username: string
  balance: string
}

interface HeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  userInfo: UserInfo | null
  onLogin: () => void
  onLogout: () => void
  onRefreshUserInfo: () => void
}

export function Header({ 
  searchQuery, 
  onSearchChange, 
  userInfo, 
  onLogin, 
  onLogout, 
  onRefreshUserInfo 
}: HeaderProps) {
  const [githubStars, setGithubStars] = useState<number | null>(null)

  // 获取GitHub星数
  useEffect(() => {
    const fetchGithubStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/labring/FastGPT')
        const data = await response.json()
        setGithubStars(data.stargazers_count)
      } catch (error) {
        console.error('获取GitHub星数失败:', error)
      }
    }

    fetchGithubStars()
  }, [])



  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo和标题 */}
          <div className="flex items-center gap-3">
            <img
              src="/fastgpt.svg"
              alt="FastGPT"
              className="h-8 w-8"
            />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">FastGPT</h1>
              <p className="text-xs text-gray-500 hidden sm:block">工作流分享平台</p>
            </div>
          </div>

          {/* 搜索栏 */}
          <div className="flex-1 max-w-md mx-4">
            <Input
              type="text"
              placeholder="搜索工作流..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* 右侧按钮组 */}
          <div className="flex items-center gap-3">
            {/* 用户信息 */}
            {userInfo && (
              <div className="hidden md:flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Image 
                    src="/fastgpt.svg" 
                    alt="FastGPT" 
                    width={20} 
                    height={20} 
                  />
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      Welcome, {userInfo.username}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onRefreshUserInfo}
                      className="h-6 w-6 p-0"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    积分余额: {parseFloat(userInfo.balance || '0').toFixed(2)} Credits
                  </div>
                </div>
              </div>
            )}

            {/* GitHub星数 */}
            <a
              href="https://github.com/labring/FastGPT"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>{githubStars ? githubStars.toLocaleString() : '---'}</span>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </a>

            {/* 用户操作按钮 */}
            {userInfo ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/profile'}
                >
                  <User className="h-4 w-4 mr-2" />
                  个人中心
                </Button>
                <ThemeToggle />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  退出登录
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Button size="sm" onClick={onLogin}>
                  <LogIn className="h-4 w-4 mr-2" />
                  登录
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 搜索功能已移到主页面 */}
      </div>
    </header>
  )
}

export default Header