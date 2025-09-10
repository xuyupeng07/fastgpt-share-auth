import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/db'
import { generateSecureToken } from '@/lib/jwt'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    // 验证必填字段
    if (!username || !email || !password) {
      return NextResponse.json({ error: '用户名、邮箱和密码为必填字段' }, { status: 400 })
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户（普通用户，非管理员）
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
      balance: 0,
      is_admin: false
    })

    // 生成JWT token
    const token = generateSecureToken(
      newUser.id.toString(),
      newUser.username,
      undefined, // shareId
      ['read', 'chat'] // 默认权限
    )

    return NextResponse.json({ 
      success: true,
      message: '注册成功',
      data: {
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          balance: newUser.balance,
          is_admin: newUser.is_admin,
          status: newUser.status,
          created_at: newUser.created_at
        }
      }
    })
  } catch (error: unknown) {
    console.error('用户注册失败:', error)
    
    // 处理重复用户名或邮箱错误
    const mongoError = error as { code?: number; keyPattern?: { username?: boolean } }
    if (mongoError.code === 11000) {
      const field = mongoError.keyPattern?.username ? '用户名' : '邮箱'
      return NextResponse.json({ error: `${field}已存在` }, { status: 400 })
    }
    
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}