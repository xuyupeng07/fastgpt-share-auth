import { NextResponse } from 'next/server'
import { getConsumptionRecordsWithPagination } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id') || '';
    const username = searchParams.get('username') || '';
    
    // 使用新的分页函数
    const { records, total } = await getConsumptionRecordsWithPagination({
      page,
      limit,
      searchUserId: id,
      searchUsername: username
    });
    
    return NextResponse.json({
      success: true,
      data: {
        records: records,
        total: total,
        page: page,
        limit: limit
      }
    });
  } catch (error) {
    console.error('获取消费记录失败:', error);
    return NextResponse.json({
      success: false,
      message: '获取所有消费记录失败'
    }, { status: 500 });
  }
}