'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { User, LogOut, RefreshCw, LogIn, Search, Github, Star } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import Image from 'next/image'
import { motion } from 'framer-motion'

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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo和标题 */}
          <motion.div 
            className="flex items-center gap-4 cursor-pointer group relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.1
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              window.open('https://fastgpt.cn/zh', '_blank')
            }}
          >
            {/* FastGPT图标 */}
            <motion.div
              className="relative"
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.34, 1.56, 0.64, 1],
                delay: 0.3
              }}
            >
              <Image
                src="/fastgpt.svg"
                alt="FastGPT"
                width={56}
                height={56}
                className="h-14 w-14 transition-all duration-300 group-hover:drop-shadow-lg"
              />
              {/* 光晕效果 */}
               <motion.div
                 className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/10 blur-lg opacity-0 group-hover:opacity-100"
                 initial={false}
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               />
            </motion.div>
            
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
            
            {/* 科技感装饰粒子效果 */}
             <motion.div
               className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-0 group-hover:opacity-60 shadow-lg shadow-blue-500/50"
               animate={{
                 scale: [0, 1, 0],
                 rotate: [0, 180, 360]
               }}
               transition={{
                 duration: 3,
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
             />
             <motion.div
               className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-60 shadow-lg shadow-indigo-500/50"
               animate={{
                 scale: [0, 1, 0],
                 rotate: [360, 180, 0]
               }}
               transition={{
                 duration: 3,
                 repeat: Infinity,
                 ease: "easeInOut",
                 delay: 1
               }}
             />
             <motion.div
               className="absolute top-1/2 -right-2 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-40"
               animate={{
                 x: [0, 10, 0],
                 opacity: [0, 1, 0]
               }}
               transition={{
                 duration: 2,
                 repeat: Infinity,
                 ease: "easeInOut",
                 delay: 0.5
               }}
             />
          </motion.div>
          


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
            {/* 用户信息 */}
            {userInfo && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      Welcome, {userInfo.username}
                    </span>
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
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent/50 rounded-lg transition-all duration-200 hover:scale-105 group"
            >
              <Github className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">{githubStars ? githubStars.toLocaleString() : '---'}</span>
              <Star className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
            </a>

            {/* 用户操作按钮 */}
            {userInfo ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/profile'}
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={onLogin}>
                  <LogIn className="h-4 w-4 mr-2" />
                  登录
                </Button>
                <ThemeToggle />
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