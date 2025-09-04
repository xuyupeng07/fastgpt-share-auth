import { NextRequest, NextResponse } from 'next/server'
import { getAllRechargeRecords, getRechargeRecordsByToken } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    let records
    if (token) {
      // 获取特定用户的充值记录
      records = await getRechargeRecordsByToken(token)
    } else {
      // 获取所有充值记录
      records = await getAllRechargeRecords()
    }
    
    return NextResponse.json({
      success: true,
      data: records
    })
  } catch (error) {
    console.error('获取充值记录API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}