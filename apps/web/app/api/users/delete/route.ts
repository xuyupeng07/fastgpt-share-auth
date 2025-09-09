import { NextResponse } from "next/server"
import { getUserById, deleteUser } from '@/lib/db'

export async function DELETE(request: Request) {
  try {
    // 从请求体获取userId
    const body = await request.json();
    const { userId } = body;
    
    if (!userId || userId.toString().trim() === '') {
      return NextResponse.json(
        { success: false, error: '用户ID不能为空' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: '用户不存在，可能已被删除' 
      }, { status: 404 })
    }

    // 检查是否为管理员用户，防止删除管理员
    if (user.is_admin) {
      return NextResponse.json({ 
        success: false, 
        error: '不能删除管理员用户' 
      }, { status: 403 })
    }

    // 执行删除操作
    const success = await deleteUser(userId)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: '用户删除成功' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '用户删除失败，请稍后重试' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('删除用户API错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '服务器内部错误，请稍后重试' 
    }, { status: 500 })
  }
}