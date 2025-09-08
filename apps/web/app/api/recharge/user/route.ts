import { NextRequest, NextResponse } from 'next/server';
import { getRechargeRecordsByUsername, getUserById } from '@/lib/db';
import { validateToken } from '@/lib/jwt';

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

    // 验证用户身份
    let user = null;
    
    // 尝试JWT token验证
    const jwtValidation = await validateToken(token);
    if (jwtValidation.success && jwtValidation.data) {
      // JWT token验证成功，通过用户ID获取用户信息
      user = await getUserById(jwtValidation.data.userId);
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '无效的token' },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (user.status === 'inactive') {
      return NextResponse.json(
        { success: false, message: '账户已被禁用' },
        { status: 403 }
      );
    }
    
    // 获取该用户的充值记录（使用用户名）
    const records = await getRechargeRecordsByUsername(user.username);
    
    return NextResponse.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('获取用户充值记录失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}