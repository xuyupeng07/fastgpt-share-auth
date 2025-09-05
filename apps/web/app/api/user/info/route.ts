import { NextRequest, NextResponse } from 'next/server';
import { findUserByToken, getUserById } from '@/lib/db';
import { validateToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // 从URL参数或Authorization header获取token
    const token = searchParams.get('token') || 
                 request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token参数' },
        { status: 401 }
      );
    }

    // 首先尝试JWT token验证
    const jwtValidation = await validateToken(token);
    let user = null;
    
    if (jwtValidation.success && jwtValidation.data) {
      // JWT token验证成功，通过用户ID获取最新信息
      user = await getUserById(jwtValidation.data.userId);
    } else {
      // JWT验证失败，尝试明文token验证（向后兼容）
      user = await findUserByToken(token);
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    // 检查用户状态 - 如果用户被禁用，返回403状态码
    if (user.status === 'inactive') {
      return NextResponse.json(
        {
          error: 'Account disabled',
          message: '账户已被禁用，请联系管理员',
          code: 'ACCOUNT_DISABLED'
        },
        { status: 403 }
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