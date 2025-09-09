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

    // MongoDB ObjectId 验证
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, message: '无效的记录ID格式' },
        { status: 400 }
      )
    }

    const record = await getConsumptionRecordDetail(id)
    
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
          // 首先尝试从historyPreview中获取完整对话历史
          for (const item of responseData) {
            if (item.historyPreview && Array.isArray(item.historyPreview)) {
              chatHistory = item.historyPreview
                .filter((msg: { obj: string; value: string }) => msg.obj !== 'System')
                .map((msg: { obj: string; value: string }) => ({
                  role: msg.obj === 'Human' ? 'user' : 'assistant',
                  content: msg.value
                }))
              break
            }
            if (item.history && Array.isArray(item.history)) {
              chatHistory = item.history
                .filter((msg: { obj: string; value: string }) => msg.obj !== 'System')
                .map((msg: { obj: string; value: string }) => ({
                  role: msg.obj === 'Human' ? 'user' : 'assistant',
                  content: msg.value
                }))
              break
            }
            if (item.messages && Array.isArray(item.messages)) {
              chatHistory = item.messages.map((msg: { role: string; content: string }) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
              }))
              break
            }
          }
          
          // 如果没有找到完整的对话历史，则构建基于节点的对话流程
          if (chatHistory.length === 0) {
            const tempHistory = []
            
            // 查找包含用户查询的节点（通常在最后一个节点）
            let userQuery = null
            for (let i = responseData.length - 1; i >= 0; i--) {
              const item = responseData[i]
              if (item.query && item.query.includes('用户的问题：')) {
                // 提取用户的实际问题
                const match = item.query.match(/用户的问题：([^\n]+)/)
                if (match) {
                  userQuery = match[1].trim()
                  break
                }
              }
            }
            
            // 如果没有找到用户问题，尝试其他方式
            if (!userQuery) {
              const queryNode = responseData.find(item => item.query && !item.query.includes('任务：'))
              if (queryNode) {
                userQuery = queryNode.query
              }
            }
            
            if (userQuery) {
              tempHistory.push({
                role: 'user',
                content: userQuery
              })
            }
            
            // 查找最终的AI回复（通常在最后一个有textOutput的节点）
            let finalResponse = null
            for (let i = responseData.length - 1; i >= 0; i--) {
              const item = responseData[i]
              if (item.textOutput && item.textOutput.trim() && !item.textOutput.includes('任务：')) {
                finalResponse = item.textOutput.trim()
                break
              }
            }
            
            if (finalResponse) {
              tempHistory.push({
                role: 'assistant',
                content: finalResponse
              })
            }
            
            if (tempHistory.length > 0) {
              chatHistory = tempHistory
            }
          }
        }
        // 处理单个对象的情况
        else if (responseData && typeof responseData === 'object') {
          if (responseData.historyPreview && Array.isArray(responseData.historyPreview)) {
            chatHistory = responseData.historyPreview.map((msg: { obj: string; value: string }) => ({
              role: msg.obj === 'Human' ? 'user' : 'assistant',
              content: msg.value
            }))
          }
          else if (responseData.history && Array.isArray(responseData.history)) {
            chatHistory = responseData.history.map((msg: { obj: string; value: string }) => ({
              role: msg.obj === 'Human' ? 'user' : 'assistant',
              content: msg.value
            }))
          }
          else if (responseData.messages && Array.isArray(responseData.messages)) {
            chatHistory = responseData.messages.map((msg: { role: string; content: string }) => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          }
          // 处理单个对象包含query和textOutput的情况
          else if (responseData.query || responseData.textOutput) {
            if (responseData.query) {
              chatHistory.push({
                role: 'user',
                content: responseData.query
              })
            }
            if (responseData.textOutput) {
              chatHistory.push({
                role: 'assistant',
                content: responseData.textOutput
              })
            }
          }
        }
        
        // 如果以上方法都没有找到聊天记录，尝试解析纯文本格式
        if (chatHistory.length === 0 && record.response_data) {
          try {
            let textData = typeof record.response_data === 'string' ? record.response_data : JSON.stringify(record.response_data)
            
            // 尝试从文本中提取聊天记录
            const chatPattern = /(用户|AI助手)\s*([\s\S]*?)(?=(?:用户|AI助手)|$)/g
            let match
            const tempHistory = []
            
            while ((match = chatPattern.exec(textData)) !== null) {
               const role = match[1]?.trim()
               const content = match[2]?.trim()
              
              if (content) {
                tempHistory.push({
                  role: role === '用户' ? 'user' : 'assistant',
                  content: content
                })
              }
            }
            
            if (tempHistory.length > 0) {
              chatHistory = tempHistory
            }
          } catch (textParseError) {
            console.error('解析纯文本聊天记录失败:', textParseError)
          }
        }
      } catch (parseError) {
        console.error('解析聊天历史失败:', parseError)
        console.error('原始数据:', record.response_data)
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