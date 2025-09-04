import { NextResponse } from 'next/server'
import { getAllConsumptionRecords } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const records = await getAllConsumptionRecords();
    const recordsArray = Array.isArray(records) ? records : [];
    
    // 实现分页
    const offset = (page - 1) * limit;
    const paginatedRecords = recordsArray.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: recordsArray.length,
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