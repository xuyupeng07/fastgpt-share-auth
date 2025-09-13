// 存储配置常量
const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'userInfo'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7天

// 存储类型枚举
enum StorageType {
  COOKIE = 'cookie',
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  MEMORY = 'memory'
}

// 内存存储实现（作为最后的降级方案）
class MemoryStorage {
  private static instance: MemoryStorage
  private storage: Map<string, string> = new Map()

  static getInstance(): MemoryStorage {
    if (!MemoryStorage.instance) {
      MemoryStorage.instance = new MemoryStorage()
    }
    return MemoryStorage.instance
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value)
  }

  getItem(key: string): string | null {
    return this.storage.get(key) || null
  }

  removeItem(key: string): void {
    this.storage.delete(key)
  }

  clear(): void {
    this.storage.clear()
  }
}

// 存储可用性检测
class StorageDetector {
  private static cookieSupported: boolean | null = null
  private static localStorageSupported: boolean | null = null
  private static sessionStorageSupported: boolean | null = null

  static isCookieSupported(): boolean {
    if (this.cookieSupported !== null) return this.cookieSupported
    
    if (typeof document === 'undefined') {
      this.cookieSupported = false
      return false
    }

    try {
      // 测试cookie是否可用
      const testKey = '__cookie_test__'
      const testValue = 'test'
      document.cookie = `${testKey}=${testValue}; path=/; SameSite=Lax`
      const supported = document.cookie.includes(`${testKey}=${testValue}`)
      // 清理测试cookie
      document.cookie = `${testKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
      this.cookieSupported = supported
      return supported
    } catch {
      this.cookieSupported = false
      return false
    }
  }

  static isLocalStorageSupported(): boolean {
    if (this.localStorageSupported !== null) return this.localStorageSupported
    
    if (typeof window === 'undefined') {
      this.localStorageSupported = false
      return false
    }

    try {
      const testKey = '__localStorage_test__'
      const testValue = 'test'
      localStorage.setItem(testKey, testValue)
      const supported = localStorage.getItem(testKey) === testValue
      localStorage.removeItem(testKey)
      this.localStorageSupported = supported
      return supported
    } catch {
      this.localStorageSupported = false
      return false
    }
  }

  static isSessionStorageSupported(): boolean {
    if (this.sessionStorageSupported !== null) return this.sessionStorageSupported
    
    if (typeof window === 'undefined') {
      this.sessionStorageSupported = false
      return false
    }

    try {
      const testKey = '__sessionStorage_test__'
      const testValue = 'test'
      sessionStorage.setItem(testKey, testValue)
      const supported = sessionStorage.getItem(testKey) === testValue
      sessionStorage.removeItem(testKey)
      this.sessionStorageSupported = supported
      return supported
    } catch {
      this.sessionStorageSupported = false
      return false
    }
  }

  static getAvailableStorageTypes(): StorageType[] {
    const available: StorageType[] = []
    
    // 优先级顺序：localStorage > cookie > sessionStorage > memory
    if (this.isLocalStorageSupported()) {
      available.push(StorageType.LOCAL_STORAGE)
    }
    if (this.isCookieSupported()) {
      available.push(StorageType.COOKIE)
    }
    if (this.isSessionStorageSupported()) {
      available.push(StorageType.SESSION_STORAGE)
    }
    // 内存存储总是可用的
    available.push(StorageType.MEMORY)
    
    return available
  }
}

// 统一存储管理器
export class UnifiedStorageManager {
  private static instance: UnifiedStorageManager
  private availableStorageTypes: StorageType[]
  private memoryStorage = MemoryStorage.getInstance()

  private constructor() {
    this.availableStorageTypes = StorageDetector.getAvailableStorageTypes()
    console.log('可用存储类型:', this.availableStorageTypes)
  }

  static getInstance(): UnifiedStorageManager {
    if (!UnifiedStorageManager.instance) {
      UnifiedStorageManager.instance = new UnifiedStorageManager()
    }
    return UnifiedStorageManager.instance
  }

  // 设置值到最佳可用存储
  set(key: string, value: string, maxAge: number = COOKIE_MAX_AGE): boolean {
    for (const storageType of this.availableStorageTypes) {
      try {
        switch (storageType) {
          case StorageType.LOCAL_STORAGE:
            if (typeof localStorage !== 'undefined') {
              // localStorage不支持过期时间，我们存储一个包含过期时间的对象
              const expiry = Date.now() + (maxAge * 1000)
              localStorage.setItem(key, JSON.stringify({ value, expiry }))
              return true
            }
            break
          case StorageType.COOKIE:
            if (typeof document !== 'undefined') {
              document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
              return true
            }
            break
          case StorageType.SESSION_STORAGE:
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(key, value)
              return true
            }
            break
          case StorageType.MEMORY:
            this.memoryStorage.setItem(key, value)
            return true
        }
      } catch (error) {
        console.warn(`存储到 ${storageType} 失败:`, error)
        continue
      }
    }
    return false
  }

  // 从所有可用存储中获取值
  get(key: string): string | null {
    for (const storageType of this.availableStorageTypes) {
      try {
        let value: string | null = null
        
        switch (storageType) {
          case StorageType.LOCAL_STORAGE:
            if (typeof localStorage !== 'undefined') {
              const stored = localStorage.getItem(key)
              if (stored) {
                try {
                  const parsed = JSON.parse(stored)
                  // 检查是否过期
                  if (parsed.expiry && Date.now() > parsed.expiry) {
                    localStorage.removeItem(key)
                    continue
                  }
                  value = parsed.value || stored // 兼容旧格式
                } catch {
                  value = stored // 如果不是JSON格式，直接使用
                }
              }
            }
            break
          case StorageType.COOKIE:
            if (typeof document !== 'undefined') {
              const cookies = document.cookie.split(';')
              for (const cookie of cookies) {
                const [cookieKey, cookieValue] = cookie.trim().split('=')
                if (cookieKey === key && cookieValue) {
                  value = decodeURIComponent(cookieValue)
                  break
                }
              }
            }
            break
          case StorageType.SESSION_STORAGE:
            if (typeof sessionStorage !== 'undefined') {
              value = sessionStorage.getItem(key)
            }
            break
          case StorageType.MEMORY:
            value = this.memoryStorage.getItem(key)
            break
        }
        
        if (value) {
          return value
        }
      } catch (error) {
        console.warn(`从 ${storageType} 读取失败:`, error)
        continue
      }
    }
    return null
  }

  // 从所有存储中删除值
  remove(key: string): void {
    for (const storageType of this.availableStorageTypes) {
      try {
        switch (storageType) {
          case StorageType.LOCAL_STORAGE:
            if (typeof localStorage !== 'undefined') {
              localStorage.removeItem(key)
            }
            break
          case StorageType.COOKIE:
            if (typeof document !== 'undefined') {
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
              document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; SameSite=Lax`
              document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`
            }
            break
          case StorageType.SESSION_STORAGE:
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.removeItem(key)
            }
            break
          case StorageType.MEMORY:
            this.memoryStorage.removeItem(key)
            break
        }
      } catch (error) {
        console.warn(`从 ${storageType} 删除失败:`, error)
      }
    }
  }

  // 获取当前使用的存储类型信息
  getStorageInfo(): { available: StorageType[], primary: StorageType } {
    return {
      available: this.availableStorageTypes,
      primary: this.availableStorageTypes[0] || StorageType.MEMORY
    }
  }
}

// 兼容性包装器 - 保持向后兼容
export const ClientCookieManager = {
  set: (key: string, value: string, maxAge: number = COOKIE_MAX_AGE) => {
    const storage = UnifiedStorageManager.getInstance()
    return storage.set(key, value, maxAge)
  },

  get: (key: string): string | null => {
    const storage = UnifiedStorageManager.getInstance()
    return storage.get(key)
  },

  remove: (key: string) => {
    const storage = UnifiedStorageManager.getInstance()
    storage.remove(key)
  },

  getValue: (key: string): string | null => {
    const storage = UnifiedStorageManager.getInstance()
    return storage.get(key)
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
  private static storageManager = UnifiedStorageManager.getInstance()

  /**
   * 登录成功后的处理
   * @param token JWT token
   * @param user 用户信息
   */
  static handleLoginSuccess(token: string, user: UserInfo): void {
    // 使用统一存储管理器设置token
    const success = this.storageManager.set(AUTH_TOKEN_KEY, token)
    if (!success) {
      console.warn('Token存储失败，可能影响登录状态持久化')
    }
    
    // 设置用户状态（会自动保存到可用存储）
    AuthState.setUser(user)
    
    // 记录存储状态
    const storageInfo = this.storageManager.getStorageInfo()
    console.log(`登录成功，使用存储类型: ${storageInfo.primary}，可用存储: ${storageInfo.available.join(', ')}`)
  }

  /**
   * 退出登录处理
   */
  static handleLogout(): void {
    // 使用统一存储管理器清除token
    this.storageManager.remove(AUTH_TOKEN_KEY)
    // 清除用户状态
    AuthState.clear()
    console.log('已清除所有登录状态')
  }

  /**
   * 获取当前存储的token
   * @returns string | null
   */
  static getToken(): string | null {
    return this.storageManager.get(AUTH_TOKEN_KEY)
  }

  /**
   * 检查并获取用户信息
   * @returns Promise<UserInfo | null>
   */
  static async getCurrentUser(): Promise<UserInfo | null> {
    const token = this.getToken()
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

  /**
   * 获取存储状态信息
   * @returns 存储状态信息
   */
  static getStorageInfo(): { available: string[], primary: string, hasToken: boolean } {
    const info = this.storageManager.getStorageInfo()
    const hasToken = !!this.getToken()
    return {
      available: info.available,
      primary: info.primary,
      hasToken
    }
  }

  /**
   * 检查登录状态是否有效
   * @returns Promise<boolean>
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return !!user
  }

  /**
   * 刷新token（如果支持）
   * @returns Promise<boolean> 是否刷新成功
   */
  static async refreshToken(): Promise<boolean> {
    const currentToken = this.getToken()
    if (!currentToken) {
      return false
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.token) {
          // 更新token
          this.storageManager.set(AUTH_TOKEN_KEY, data.data.token)
          return true
        }
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
    }

    return false
  }
}