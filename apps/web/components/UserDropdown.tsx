'use client'

import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { User, LogOut, Settings, Upload, Camera, Sun, Moon, Home } from 'lucide-react'
import { Tooltip } from './ui/tooltip'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

interface UserInfo {
  id: string
  username: string
  balance: number
  is_admin?: boolean
  avatar?: string
}

interface UserDropdownProps {
  userInfo: UserInfo
  onLogout: () => void
  onAvatarUpdate?: (avatar: string) => void
  hideMenuItems?: ('profile' | 'admin')[]
  showHomeButton?: boolean
}

export function UserDropdown({ userInfo, onLogout, onAvatarUpdate, hideMenuItems = [], showHomeButton = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [avatarKey, setAvatarKey] = useState(Date.now()) // 用于强制刷新头像
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { theme, setTheme } = useTheme()

  // 避免水合不匹配
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 处理头像上传
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小 (限制为2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB')
      return
    }

    setIsUploading(true)

    try {
      // 将图片转换为base64
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        
        // 获取cookie中的authToken
        const getAuthToken = () => {
          return document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1] || null
        }
        
        const authToken = getAuthToken()
        if (!authToken) {
          toast.error('请先登录')
          setIsUploading(false)
          return
        }
        
        // 上传到服务器
        const response = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ avatar: base64 })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            onAvatarUpdate?.(base64)
            setAvatarKey(Date.now()) // 强制刷新头像显示
            toast.success('头像更新成功')
          } else {
            toast.error('头像更新失败: ' + result.message)
          }
        } else {
          toast.error('头像更新失败')
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('头像上传失败:', error)
      toast.error('头像上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative">
      {/* 用户信息区域 */}
      <div 
        className="flex items-center gap-3 cursor-pointer rounded-lg p-2 transition-all duration-200 hover:scale-105"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* 用户头像 */}
        <div className="relative group">
          <div 
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-all duration-200 cursor-pointer"
            onClick={handleAvatarClick}
          >
            <Image
              src={`/api/user/avatar/${userInfo.id}?t=${avatarKey}`}
              alt="用户头像"
              width={40}
              height={40}
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                // 回退到默认头像
                (e.target as HTMLImageElement).src = '/fastgpt.svg'
              }}
              unoptimized={true}
            />
          </div>
          
          {/* 头像上传提示 */}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <Camera className="h-4 w-4 text-white" />
          </div>
          
          {/* 上传中状态 */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* 用户信息文字 */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-sm">
              Welcome, {userInfo.username}
            </span>
          </div>
          <div className="text-xs font-medium text-primary">
            积分余额: {(userInfo.balance || 0).toFixed(2)} Credits
          </div>
        </div>
      </div>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="p-2 space-y-1">
              {/* 回到首页 */}
              {showHomeButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-muted"
                  onClick={() => {
                    window.location.href = '/'
                    setIsOpen(false)
                  }}
                >
                  <Home className="h-4 w-4 mr-2" />
                  回到首页
                </Button>
              )}

              {/* 个人中心 */}
              {!hideMenuItems.includes('profile') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-muted"
                  onClick={() => {
                    window.location.href = '/profile'
                    setIsOpen(false)
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  个人中心
                </Button>
              )}

              {/* 后台管理 (仅管理员可见) */}
              {userInfo.is_admin && !hideMenuItems.includes('admin') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-muted"
                  onClick={() => {
                    window.location.href = '/admin'
                    setIsOpen(false)
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  后台管理
                </Button>
              )}

              {/* 主题切换 */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-muted"
                  onClick={() => {
                    setTheme(theme === "light" ? "dark" : "light")
                    setIsOpen(false)
                  }}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4 mr-2" />
                      黑暗模式
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 mr-2" />
                      白天模式
                    </>
                  )}
                </Button>
              )}

              {/* 分割线 */}
              <div className="h-px bg-border my-1" />

              {/* 退出登录 */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onLogout()
                  setIsOpen(false)
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
    </div>
  )
}

export default UserDropdown