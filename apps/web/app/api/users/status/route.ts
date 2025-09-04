import { NextRequest, NextResponse } from 'next/server';
import { updateUserStatus } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const { userId, status } = await request.json();
    
    if (!userId || !status) {
      return NextResponse.json(
        { error: '用户ID和状态不能为空' },
        { status: 400 }
      );
    }
    
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      );
    }
    
    await updateUserStatus(userId, status);
    
    return NextResponse.json({
      success: true,
      message: '用户状态更新成功'
    });
    
  } catch (error) {
    console.error('更新用户状态失败:', error);
    return NextResponse.json(
      { error: '更新用户状态失败' },
      { status: 500 }
    );
  }
}