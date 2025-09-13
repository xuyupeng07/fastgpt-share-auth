"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthUtils } from '@/lib/auth'

interface UserInfo {
  id: string
  username: string
  balance: number
  role: string
  email: string
  status: string
  is_admin: boolean
}

interface AdminAuthState {
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  user: UserInfo | null
  error: string | null
}

export function useAdminAuth() {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
    user: null,
    error: null
  })
  
  const router = useRouter()

  const checkAdminAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }))
      
      // 使用AuthUtils获取token
      const token = AuthUtils.getToken()
      
      if (!token) {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
          user: null,
          error: '未登录，请先登录'
        })
        router.push('/login')
        return
      }

      // 验证token并获取用户信息
      const response = await fetch('/api/user/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const user = data.data
          
          // 检查用户状态
          if (user.status === 'inactive') {
            setAuthState({
              isLoading: false,
              isAuthenticated: false,
              isAdmin: false,
              user: null,
              error: '账户已被禁用，请联系管理员'
            })
            // 清除登录状态
            AuthUtils.handleLogout()
            router.push('/login?disabled=true')
            return
          }
          
          // 检查管理员权限
          const isAdmin = user.is_admin === true || user.role === 'admin'
          
          if (!isAdmin) {
            setAuthState({
              isLoading: false,
              isAuthenticated: true,
              isAdmin: false,
              user,
              error: '权限不足，需要管理员权限才能访问此页面'
            })
            return
          }
          
          // 管理员权限验证成功
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
            isAdmin: true,
            user,
            error: null
          })
        } else {
          throw new Error(data.message || '获取用户信息失败')
        }
      } else if (response.status === 401) {
        // token无效
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
          user: null,
          error: 'token已过期，请重新登录'
        })
        AuthUtils.handleLogout()
        router.push('/login')
      } else if (response.status === 403) {
        // 账户被禁用
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
          user: null,
          error: '账户已被禁用，请联系管理员'
        })
        AuthUtils.handleLogout()
        router.push('/login?disabled=true')
      } else {
        throw new Error('验证失败')
      }
    } catch (error) {
      console.error('管理员权限验证失败:', error)
      setAuthState({
        isLoading: false,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
        error: error instanceof Error ? error.message : '权限验证失败'
      })
    }
  }, [router])

  useEffect(() => {
    checkAdminAuth()
  }, [checkAdminAuth])

  const logout = useCallback(() => {
    AuthUtils.handleLogout()
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
      error: null
    })
    router.push('/login')
  }, [router])

  return {
    ...authState,
    logout,
    refetch: checkAdminAuth
  }
}