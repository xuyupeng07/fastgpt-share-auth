import { NextRequest, NextResponse } from 'next/server';
import { findUserByToken } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token参数' },
        { status: 400 }
      );
    }

    // 验证token并获取最新用户信息
    const user = await findUserByToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    // 返回用户的最新信息
    return NextResponse.json({
      success: true,
      data: {
        uid: user.uid,
        username: user.username,
        balance: parseFloat(user.balance),
        role: user.is_admin === 1 ? 'admin' : 'user',
        email: user.email,
        status: user.status,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}