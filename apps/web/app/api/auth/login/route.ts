import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('收到登录请求:', { username, password });
    const user = await authenticateUser(username, password);
    
    if (user) {
      console.log(`用户 ${username} 登录成功`);
      return NextResponse.json({
        success: true,
        message: '登录成功',
        authToken: user.token,
        data: {
          uid: user.uid,
          username: user.username,
          balance: user.balance || 0,
          role: user.is_admin ? 'admin' : 'user',
          email: user.email || '',
          status: user.status || 'active',
          is_admin: user.is_admin
        }
      });
    } else {
      console.log(`用户 ${username} 登录失败`);
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}