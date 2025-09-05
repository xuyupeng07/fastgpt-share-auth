import { NextRequest, NextResponse } from 'next/server'
import { getUserConsumptionRecords } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少Token参数' },
        { status: 400 }
      )
    }

    const records = await getUserConsumptionRecords(token)
    const recordsArray = Array.isArray(records) ? records : []
    
    return NextResponse.json({
      success: true,
      records: recordsArray,
      total: recordsArray.length
    })
  } catch (error) {
    console.error('消费记录API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}