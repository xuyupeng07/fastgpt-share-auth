import { NextResponse } from "next/server"
import { getAllUsers } from '@/lib/db'

export async function GET() {
  try {
    const records = await getAllUsers();
    const recordsArray = Array.isArray(records) ? records : [];
    
    // 确保每个用户都有id字段
    const usersWithId = recordsArray.map(user => ({
      ...user,
      id: user._id.toString() // 添加MongoDB的_id字段作为id
    }));
    
    return NextResponse.json({
      success: true,
      users: usersWithId
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取用户列表失败'
    }, { status: 500 });
  }
}