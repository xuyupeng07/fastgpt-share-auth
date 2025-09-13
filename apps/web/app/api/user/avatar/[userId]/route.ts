import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import UserModel from '@/lib/models/User'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params

    if (!userId) {
      return new NextResponse('用户ID不能为空', { status: 400 })
    }

    // 连接数据库
    await connectDB()

    // 获取用户头像
    const user = await UserModel.findById(userId).select('avatar')

    if (!user || !user.avatar) {
      // 返回默认头像
      return NextResponse.redirect(new URL('/fastgpt.svg', request.url))
    }

    // 解析base64数据
    const base64Data = user.avatar
    
    if (!base64Data.startsWith('data:image/')) {
      return new NextResponse('无效的图片格式', { status: 400 })
    }

    // 提取MIME类型和base64数据
    const parts = base64Data.split(',')
    if (parts.length !== 2) {
      return new NextResponse('无效的base64格式', { status: 400 })
    }
    
    const [header, data] = parts as [string, string]
    const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/png'
    
    // 将base64转换为Buffer
    const buffer = Buffer.from(data, 'base64')

    // 返回图片
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=300', // 5分钟缓存，允许头像更新
        'Content-Length': buffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('获取用户头像错误:', error)
    // 返回默认头像
    return NextResponse.redirect(new URL('/fastgpt.svg', request.url))
  }
}