import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserById } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { validateToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('authToken')?.value
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const jwtValidation = await validateToken(token)
    if (!jwtValidation.success || !jwtValidation.data) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    // 获取用户信息并检查管理员权限
    const user = await getUserById(jwtValidation.data.userId)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (!user.is_admin) {
      return NextResponse.json({ error: '权限不足，需要管理员权限' }, { status: 403 })
    }

    const { username, email, password, balance = 0, is_admin = false } = await request.json()

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

    // 创建用户
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
      balance: Number(balance),
      is_admin: Boolean(is_admin)
    })

    return NextResponse.json({ 
      message: '用户创建成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        balance: newUser.balance,
        is_admin: newUser.is_admin,
        status: newUser.status,
        created_at: newUser.created_at
      }
    })
  } catch (error: any) {
    console.error('创建用户失败:', error)
    
    // 处理重复用户名或邮箱错误
    if (error.code === 11000) {
      const field = error.keyPattern?.username ? '用户名' : '邮箱'
      return NextResponse.json({ error: `${field}已存在` }, { status: 400 })
    }
    
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
  }
}