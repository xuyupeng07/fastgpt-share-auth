'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { LogIn, Search } from 'lucide-react'

import { Tooltip } from './ui/tooltip'
import { UserDropdown } from './UserDropdown'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface UserInfo {
  id: string
  username: string
  balance: number
  is_admin?: boolean
  avatar?: string
}

interface HeaderProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  userInfo: UserInfo | null
  onLogin: () => void
  onLogout: () => void
  onRefreshUserInfo?: () => void
}

export function Header({ 
  searchQuery, 
  onSearchChange, 
  userInfo, 
  onLogin, 
  onLogout,
  onRefreshUserInfo
}: HeaderProps) {
  const [githubStars, setGithubStars] = useState<string>('25.7k')
  // 获取GitHub星数
  useEffect(() => {
    const fetchGithubStars = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/labring/FastGPT')
        const data = await response.json()
        const stars = data?.stargazers_count
        if (stars && typeof stars === 'number') {
          const formattedStars = stars >= 1000 
            ? `${(stars / 1000).toFixed(1)}k` 
            : stars.toString()
          setGithubStars(formattedStars)
        } else {
          setGithubStars('25.7k')
        }
      } catch (error) {
        console.error('获取GitHub星数失败:', error)
        setGithubStars('25.7k')
      }
    }

    fetchGithubStars()
  }, [])



  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo和标题 - 左对齐 */}
          <div 
            className="flex items-center gap-4 cursor-pointer group relative"
            onClick={() => {
              window.open('https://fastgpt.cn/zh', '_blank')
            }}
          >
            {/* FastGPT图标 */}
            <div className="relative">
              <Image
                src="/fastgpt.svg"
                alt="FastGPT"
                width={56}
                height={56}
                className="h-14 w-14 transition-all duration-300 group-hover:drop-shadow-lg"
              />
              {/* 光晕效果 */}
               <div
                 className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
               />
            </div>
            
            {/* FastGPT文字 */}
            <motion.div
              className="flex items-center relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.5
              }}
            >
              {/* Fast 逐字出现 */}
              {['F', 'a', 's', 't'].map((letter, index) => (
                <motion.span
                  key={`fast-${index}`}
                  className="text-4xl font-bold text-black dark:text-white tracking-tighter"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6,
                    delay: 0.7 + index * 0.1,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  {letter}
                </motion.span>
              ))}
              
              {/* GPT 逐字出现 */}
              {['G', 'P', 'T'].map((letter, index) => (
                <motion.span
                  key={`gpt-${index}`}
                  className="text-4xl font-bold text-black dark:text-white tracking-tighter"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6,
                    delay: 1.1 + index * 0.1,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>
            

          </div>
          


          {/* 搜索栏 */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索工作流..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>

          {/* 右侧按钮组 */}
          <div className="flex items-center gap-3">
            {/* GitHub星数 */}
            <a
              href="https://github.com/labring/FastGPT"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-3 px-2 py-2 text-base transition-all duration-200 hover:scale-110 group"
            >
              <svg className="h-7 w-7 text-foreground group-hover:text-primary transition-colors fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">{githubStars}</span>
            </a>

            {/* 用户信息和操作 */}
            {userInfo ? (
              <div className="flex items-center gap-3">
                <UserDropdown 
                  userInfo={userInfo} 
                  onLogout={onLogout}
                  onAvatarUpdate={(avatar) => {
                    // 更新本地用户信息
                    if (onRefreshUserInfo) {
                      onRefreshUserInfo()
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Tooltip content="登录解锁完整功能" side="bottom">
                  <Button size="sm" onClick={onLogin} className="hover:scale-105 transition-all duration-200">
                    <LogIn className="h-4 w-4 mr-2" />
                    登录
                  </Button>
                </Tooltip>
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