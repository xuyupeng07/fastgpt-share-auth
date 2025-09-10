// Cookie配置常量
const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'userInfo'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7天

// 客户端Cookie管理
export const ClientCookieManager = {
  // 设置cookie
  set: (key: string, value: string, maxAge: number = COOKIE_MAX_AGE) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
    }
  },

  // 获取cookie
  get: (key: string): string | null => {
    if (typeof document === 'undefined') return null
    
    const cookies = document.cookie.split(';')
     for (const cookie of cookies) {
       const [cookieKey, cookieValue] = cookie.trim().split('=')
       if (cookieKey === key && cookieValue) {
         return decodeURIComponent(cookieValue)
       }
     }
    return null
  },

  // 删除cookie
  remove: (key: string) => {
    if (typeof document !== 'undefined') {
      // 删除多种可能的cookie路径和域名配置
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; SameSite=Lax`
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
    }
  },

  // 获取cookie值，如果不存在返回null
  getValue: (key: string): string | null => {
    const value = ClientCookieManager.get(key)
    return value || null
  }
}

// 服务端Cookie管理 - 仅在服务端使用
export const createServerCookieManager = () => {
  // 动态导入next/headers，仅在服务端使用
  const getCookies = async () => {
    const { cookies } = await import('next/headers')
    return cookies()
  }

  return {
    // 获取cookie
    get: async (key: string): Promise<string | null> => {
      try {
        const cookieStore = await getCookies()
        const cookie = cookieStore.get(key)
        return cookie?.value || null
      } catch (error) {
        console.error('Error getting server cookie:', error)
        return null
      }
    },

    // 获取认证token
    getAuthToken: async (): Promise<string | null> => {
      try {
        const cookieStore = await getCookies()
        const cookie = cookieStore.get(AUTH_TOKEN_KEY)
        return cookie?.value || null
      } catch (error) {
        console.error('Error getting auth token:', error)
        return null
      }
    }
  }
}

/**
 * 用户认证状态管理
 */
export interface UserInfo {
  id: string
  username: string
  email: string
  balance: number
  is_admin: boolean
  status: string
}

export class AuthState {
  private static currentUser: UserInfo | null = null
  private static listeners: Array<(user: UserInfo | null) => void> = []

  /**
   * 设置当前用户信息
   * @param user 用户信息
   */
  static setUser(user: UserInfo | null): void {
    this.currentUser = user
    // 同时保存到localStorage以支持页面刷新后的状态恢复
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }
    this.notifyListeners()
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息或null
   */
  static getUser(): UserInfo | null {
    // 如果内存中没有用户信息，尝试从localStorage恢复
    if (!this.currentUser && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem(AUTH_USER_KEY)
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser)
        } catch (error) {
          console.error('Failed to parse stored user info:', error)
          localStorage.removeItem(AUTH_USER_KEY)
        }
      }
    }
    return this.currentUser
  }

  /**
   * 添加状态变化监听器
   * @param listener 监听器函数
   */
  static addListener(listener: (user: UserInfo | null) => void): void {
    this.listeners.push(listener)
  }

  /**
   * 移除状态变化监听器
   * @param listener 监听器函数
   */
  static removeListener(listener: (user: UserInfo | null) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * 通知所有监听器
   */
  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser))
  }

  /**
   * 清除用户状态
   */
  static clear(): void {
    this.currentUser = null
    // 清除localStorage中的用户信息和token
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userInfo')
    }
    this.notifyListeners()
  }
}

/**
 * 统一的认证操作工具
 */
export class AuthUtils {
  /**
   * 登录成功后的处理
   * @param token JWT token
   * @param user 用户信息
   */
  static handleLoginSuccess(token: string, user: UserInfo): void {
    // 设置cookie
    ClientCookieManager.set(AUTH_TOKEN_KEY, token)
    // 同时保存token到localStorage作为备份
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
    }
    // 设置用户状态（会自动保存到localStorage）
    AuthState.setUser(user)
  }

  /**
   * 退出登录处理
   */
  static handleLogout(): void {
    // 清除cookie
    ClientCookieManager.remove(AUTH_TOKEN_KEY)
    // 清除用户状态
    AuthState.clear()
  }

  /**
   * 检查并获取用户信息
   * @returns Promise<UserInfo | null>
   */
  static async getCurrentUser(): Promise<UserInfo | null> {
    const token = ClientCookieManager.get(AUTH_TOKEN_KEY)
    if (!token) {
      return null
    }

    try {
      const response = await fetch('/api/user/info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          AuthState.setUser(data.data)
          return data.data
        }
      }
      
      // token无效，清除本地状态
      this.handleLogout()
      return null
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }
}