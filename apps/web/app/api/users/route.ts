import { NextResponse } from "next/server"
import { getAllUsers, getUserById, deleteUser } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('searchId');
    const searchUsername = searchParams.get('searchUsername');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const records = await getAllUsers();
    const recordsArray = Array.isArray(records) ? records : [];
    
    // 确保每个用户都有id字段
    let usersWithId = recordsArray.map(user => ({
      ...user,
      id: user._id.toString() // 添加MongoDB的_id字段作为id
    }));
    
    // 应用搜索过滤
    if (searchId) {
      usersWithId = usersWithId.filter(user => 
        user.id.toString().includes(searchId)
      );
    } else if (searchUsername) {
      usersWithId = usersWithId.filter(user => 
        user.username && user.username.toLowerCase().includes(searchUsername.toLowerCase())
      );
    }
    
    // 计算总数
    const total = usersWithId.length;
    
    // 应用分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = usersWithId.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      users: paginatedUsers,
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