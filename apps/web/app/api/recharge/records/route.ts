import { NextRequest, NextResponse } from 'next/server'
import { getAllRechargeRecords, getRechargeRecordsByUsername } from '@/lib/db'
import { ObjectId } from 'mongodb'

interface RechargeRecord {
  id: ObjectId
  username: string
  amount: number
  points: number
  created_at: Date
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const username = searchParams.get('username')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    let records
    if (username) {
      // 获取特定用户的充值记录
      records = await getRechargeRecordsByUsername(username)
    } else {
      // 获取所有充值记录
      records = await getAllRechargeRecords()
    }
    
    // 类型断言以处理数据库查询结果
    const recordsArray = (records as unknown as RechargeRecord[]) || []
    let filteredRecords = recordsArray
    
    // 根据查询条件过滤记录
    if (id) {
      const recordId = parseInt(id)
      if (!isNaN(recordId)) {
        filteredRecords = recordsArray.filter((record: RechargeRecord) => record.id.toString() === recordId.toString())
      }
    } else if (username) {
      filteredRecords = recordsArray.filter((record: RechargeRecord) => 
        record.username && record.username.toLowerCase().includes(username.toLowerCase())
      )
    }
    
    // 实现分页
    const offset = (page - 1) * limit
    const paginatedRecords = filteredRecords.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        total: filteredRecords.length,
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