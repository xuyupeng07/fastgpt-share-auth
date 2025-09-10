import { getUserById } from '@/lib/db'
import deleteUser from '@/lib/db'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = id;
    
    // 验证用户ID格式
    if (!userId || userId.trim() === '') {
      return Response.json({ 
        success: false, 
        error: '无效的用户ID' 
      }, { status: 400 })
    }

    // 检查用户是否存在
    const user = await getUserById(userId)
    if (!user) {
      return Response.json({ 
        success: false, 
        error: '用户不存在，可能已被删除' 
      }, { status: 404 })
    }

    // 检查是否为管理员用户，防止删除管理员
    if (user.is_admin) {
      return Response.json({ 
        success: false, 
        error: '不能删除管理员用户' 
      }, { status: 403 })
    }

    // 执行删除操作
    const success = await deleteUser()
    
    if (success) {
      return Response.json({ 
        success: true, 
        message: '用户删除成功' 
      })
    } else {
      return Response.json({ 
        success: false, 
        error: '用户删除失败，请稍后重试' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('删除用户API错误:', error)
    return Response.json({ 
      success: false, 
      error: '服务器内部错误，请稍后重试' 
    }, { status: 500 })
  }
}