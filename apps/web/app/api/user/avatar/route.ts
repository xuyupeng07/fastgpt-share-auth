import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserModel from '@/lib/models/User'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-here'

export async function POST(request: NextRequest) {
  try {
    // 获取Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未提供有效的认证令牌' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '无效的认证令牌' },
        { status: 401 }
      )
    }

    const { avatar } = await request.json()

    if (!avatar) {
      return NextResponse.json(
        { success: false, message: '头像数据不能为空' },
        { status: 400 }
      )
    }

    // 验证base64格式
    if (!avatar.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, message: '无效的图片格式' },
        { status: 400 }
      )
    }

    // 检查base64数据大小 (大约2MB限制)
    const base64Data = avatar.split(',')[1]
    const sizeInBytes = (base64Data.length * 3) / 4
    if (sizeInBytes > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: '图片大小不能超过2MB' },
        { status: 400 }
      )
    }

    // 连接数据库
    await connectDB()

    // 更新用户头像
    const user = await UserModel.findByIdAndUpdate(
      decoded.userId,
      { avatar },
      { new: true }
    )

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '头像更新成功',
      data: {
        avatar: user.avatar
      }
    })

  } catch (error) {
    console.error('头像上传错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // 获取Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: '未提供有效的认证令牌' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    let decoded: any

    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { success: false, message: '无效的认证令牌' },
        { status: 401 }
      )
    }

    // 连接数据库
    await connectDB()

    // 获取用户头像
    const user = await UserModel.findById(decoded.userId).select('avatar')

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        avatar: user.avatar || null
      }
    })

  } catch (error) {
    console.error('获取头像错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}