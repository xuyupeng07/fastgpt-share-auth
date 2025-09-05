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
      
      // 生成安全的JWT token
      const jwtToken = generateSecureToken(
        user.id,
        user.username,
        user.uid,
        undefined, // shareId可选
        ['read', 'chat'] // 默认权限
      );
      
      console.log(`为用户 ${username} 生成JWT token`);
      
      return NextResponse.json({
        success: true,
        message: '登录成功',
        authToken: jwtToken, // 返回JWT token而不是明文token
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