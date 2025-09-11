import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';
import { validateToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // 从Authorization header或cookie获取JWT token
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('authToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少认证token' },
        { status: 401 }
      );
    }

    // JWT token验证
    const jwtValidation = await validateToken(token);
    
    if (!jwtValidation.success || !jwtValidation.data) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    // JWT token验证成功，通过用户ID获取最新信息
    const user = await getUserById(jwtValidation.data.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
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
        id: user._id.toString(), // 使用MongoDB的_id字段作为用户ID
        username: user.username,
        balance: Number(user.balance),
        role: user.is_admin ? 'admin' : 'user',
        email: user.email,
        status: user.status,
        is_admin: user.is_admin,
        avatar: user.avatar || null // 包含头像数据
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