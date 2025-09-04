import { NextRequest, NextResponse } from 'next/server'
import { getConsumptionRecordDetail } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, message: '缺少记录ID参数' },
        { status: 400 }
      )
    }

    const recordId = parseInt(id)
    if (isNaN(recordId)) {
      return NextResponse.json(
        { success: false, message: '无效的记录ID' },
        { status: 400 }
      )
    }

    const record = await getConsumptionRecordDetail(recordId)
    
    if (!record) {
      return NextResponse.json(
        { success: false, message: '记录不存在' },
        { status: 404 }
      )
    }

    // 解析聊天历史
    let chatHistory = []
    if (record.response_data) {
      try {
        let responseData
        // 如果已经是对象，直接使用；如果是字符串，则解析
        if (typeof record.response_data === 'object') {
          responseData = record.response_data
        } else {
          responseData = JSON.parse(record.response_data)
        }
        
        if (Array.isArray(responseData)) {
          // 查找包含聊天历史的节点
          for (const item of responseData) {
            if (item.historyPreview && Array.isArray(item.historyPreview)) {
              // 转换新格式的聊天记录为标准格式
              chatHistory = item.historyPreview.map(msg => ({
                role: msg.obj === 'Human' ? 'user' : 'assistant',
                content: msg.value
              }))
              break
            }
          }
        }
      } catch (parseError) {
        console.error('解析聊天历史失败:', parseError)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        username: record.username,
        token_used: record.token_used,
        points_used: record.points_used,
        cost: record.cost,
        chat_history: chatHistory,
        created_at: record.created_at
      }
    })
  } catch (error) {
    console.error('消费记录详情API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}