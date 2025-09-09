import { NextResponse } from "next/server"
import { getUserById, updateUserAdmin } from '@/lib/db'

export async function PUT(request: Request) {
  try {
    const { userId, is_admin } = await request.json()
    
    // 验证参数
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: '用户ID不能为空' 
      }, { status: 400 })
    }
    
    if (typeof is_admin !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: '管理员状态必须为布尔值' 
      }, { status: 400 })
    }

    // 检查用户是否存在
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '用户不存在' 
      }, { status: 404 })
    }

    // 更新用户管理员状态
    const success = await updateUserAdmin(userId, is_admin)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: `用户${is_admin ? '设置为' : '取消'}管理员权限成功` 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '更新管理员权限失败，请稍后重试' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('更新管理员权限API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误，请稍后重试' 
    }, { status: 500 })
  }
}