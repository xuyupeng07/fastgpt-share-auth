import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/db';
import { generateSecureToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('收到登录请求:', { username, password });
    const user = await authenticateUser(username, password);
    
    if (user) {
      // 检查用户状态，如果用户被禁用则拒绝登录
      if (user.status === 'inactive') {
        console.log(`用户 ${username} 登录失败：账户已被禁用`);
        return NextResponse.json(
          { success: false, message: '账户已被禁用，请联系管理员' },
          { status: 403 }
        );
      }
      
      console.log(`用户 ${username} 登录成功`);
      
      const token = generateSecureToken(
      user._id.toString(),
      user.username,
      undefined, // shareId
      ['read', 'chat'] // 默认权限
    );

      return NextResponse.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            status: user.status,
            is_admin: user.is_admin
          }
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