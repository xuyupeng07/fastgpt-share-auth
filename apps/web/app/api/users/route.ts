import { NextResponse } from "next/server"
import { getAllUsers } from '@/lib/db'

export async function GET() {
  try {
    const records = await getAllUsers();
    const recordsArray = Array.isArray(records) ? records : [];
    return NextResponse.json({
      success: true,
      users: recordsArray
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取用户列表失败'
    }, { status: 500 });
  }
}