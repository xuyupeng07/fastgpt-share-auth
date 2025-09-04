import { NextRequest, NextResponse } from 'next/server';
import { getUserConsumptionRecords, getUserConsumptionRecordsByUsername, findUserByToken } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const username = searchParams.get('username');
    
    // 如果提供了username参数，直接根据用户名查询
    if (username) {
      const records = await getUserConsumptionRecordsByUsername(username);
      return NextResponse.json({
        success: true,
        data: records
      });
    }
    
    // 如果提供了token参数，先验证token然后根据用户名查询
    if (token) {
      const user = await findUserByToken(token);
      if (!user) {
        return NextResponse.json(
          { success: false, message: '无效的token' },
          { status: 401 }
        );
      }
      
      // 使用用户名查询消费记录，而不是token
      const records = await getUserConsumptionRecordsByUsername(user.username);
      return NextResponse.json({
        success: true,
        data: records
      });
    }
    
    return NextResponse.json(
      { success: false, message: '缺少token或username参数' },
      { status: 400 }
    );
  } catch (error) {
    console.error('获取用户消费记录失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}