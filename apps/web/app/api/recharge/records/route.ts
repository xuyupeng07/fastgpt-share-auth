import { NextRequest, NextResponse } from 'next/server'
import { getRechargeRecordsWithPagination } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || ''
    const username = searchParams.get('username') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // 使用新的分页函数
    const { records, total } = await getRechargeRecordsWithPagination({
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
    })
  } catch (error) {
    console.error('获取充值记录API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}