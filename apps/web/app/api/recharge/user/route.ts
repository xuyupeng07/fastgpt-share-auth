import { NextRequest, NextResponse } from 'next/server';
import { getRechargeRecordsByToken } from '@/lib/db';

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
    
    const records = await getRechargeRecordsByToken(token);
    
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