import { NextResponse } from "next/server"
import { getUsersWithPagination, getUserById, deleteUser } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId') || '';
    const searchUsername = searchParams.get('searchUsername') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // 使用新的分页函数
    const { users, total } = await getUsersWithPagination({
      page,
      limit,
      searchId,
      searchUsername
    });
    
    // 确保每个用户都有id字段
    const usersWithId = users.map(user => ({
      ...user,
      id: user._id.toString() // 添加MongoDB的_id字段作为id
    }));
    
    return NextResponse.json({
      success: true,
      users: usersWithId,
      total: total
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取用户列表失败'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    // 验证用户ID格式
    if (!userId || userId.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: '无效的用户ID' 
      }, { status: 400 })
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