import { NextRequest, NextResponse } from 'next/server';
import { getRechargeRecordsByUsername } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { success: false, message: '缺少username参数' },
        { status: 400 }
      );
    }

    // 获取该用户的充值记录
    const records = await getRechargeRecordsByUsername(username);
    
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