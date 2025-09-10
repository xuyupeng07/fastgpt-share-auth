import { NextResponse } from 'next/server'
import { getAllConsumptionRecords } from '@/lib/db'
import { ObjectId } from 'mongodb'

interface ConsumptionRecord {
  id: ObjectId
  username: string
  token_used: number
  points_used: number
  cost: number
  created_at: Date
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    
    const records = await getAllConsumptionRecords();
    // 强制类型断言以处理数据库查询结果
    const recordsArray: ConsumptionRecord[] = records as unknown as ConsumptionRecord[];
    let filteredRecords: ConsumptionRecord[] = recordsArray || [];
    
    // 根据查询条件过滤记录
    if (id) {
      const recordId = parseInt(id);
      if (!isNaN(recordId)) {
        filteredRecords = filteredRecords.filter((record: ConsumptionRecord) => record.id.toString() === recordId.toString());
      }
    } else if (username) {
      filteredRecords = filteredRecords.filter((record: ConsumptionRecord) => 
        record.username && record.username.toLowerCase().includes(username.toLowerCase())
      );
    }
    
    // 实现分页
    const offset = (page - 1) * limit;
    const paginatedRecords = filteredRecords.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: filteredRecords.length,
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