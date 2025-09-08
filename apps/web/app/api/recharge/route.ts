import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUserBalanceById, addRechargeRecord } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: '参数错误' },
        { status: 400 }
      )
    }

    const user = await getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '无效的用户ID' },
        { status: 401 }
      )
    }

    // 更新用户余额
    const currentBalance = Number(user.balance)
    const newBalance = currentBalance + parseFloat(amount)
    const success = await updateUserBalanceById(userId, newBalance)
    
    if (success) {
      // 添加充值记录
      const recordAdded = await addRechargeRecord(
        user._id.toString(),
        user.username,
        parseFloat(amount),
        currentBalance,
        newBalance,
        '管理员充值'
      )
      
      if (!recordAdded) {
        console.error(`用户 ${user.username} 充值记录保存失败`)
      }
      
      console.log(`用户 ${user.username} 充值成功，充值积分: ${amount}, 新余额: ${newBalance}`)
      
      return NextResponse.json({
        success: true,
        message: '充值成功',
        data: {
          balance: parseFloat(newBalance.toFixed(2)),
          rechargeAmount: parseFloat(amount)
        }
      })
    } else {
      return NextResponse.json(
        { success: false, message: '充值失败' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('充值API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}