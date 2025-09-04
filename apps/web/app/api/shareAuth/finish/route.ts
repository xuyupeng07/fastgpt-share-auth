import { NextRequest, NextResponse } from "next/server";
import { findUserByToken, updateUserBalance, addConsumptionRecord } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, responseData } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token参数' },
        { status: 400 }
      );
    }

    console.log('收到对话结束上报:', { token });

    // 验证用户token
    const user = await findUserByToken(token);
    if (!user) {
      console.log(`Token ${token} 无效`);
      return NextResponse.json(
        { success: false, message: 'Token无效' },
        { status: 401 }
      );
    }

    // 解析消费数据
    const usage = responseData?.usage || {};
    const totalTokens = usage.totalTokens || 0;
    const totalPoints = usage.totalPoints || 0;
    
    // 计算费用（如果没有提供totalPoints，按token计算：1000 tokens = 0.5积分）
    let cost = totalPoints;
    if (cost === 0 && totalTokens > 0) {
      cost = (totalTokens / 1000) * 0.5;
    }

    // 检查用户余额
    const currentBalance = parseFloat(user.balance);
    if (currentBalance < cost) {
      console.log(`用户 ${user.username} 余额不足: ${currentBalance} < ${cost}`);
      return NextResponse.json(
        { success: false, message: '余额不足' },
        { status: 402 }
      );
    }

    // 扣除余额
    const newBalance = currentBalance - cost;
    const balanceUpdated = await updateUserBalance(token, newBalance);
    
    if (!balanceUpdated) {
      console.log(`用户 ${user.username} 余额更新失败`);
      return NextResponse.json(
        { success: false, message: '余额更新失败' },
        { status: 500 }
      );
    }

    // 添加消费记录
    const recordAdded = await addConsumptionRecord(
      user.id,
      user.username,
      totalTokens,
      totalPoints,
      cost,
      responseData
    );

    if (!recordAdded) {
      console.log(`用户 ${user.username} 消费记录添加失败`);
      // 这里可以考虑回滚余额，但为了简化暂时不处理
    }

    console.log(`用户 ${user.username} 对话结束 - 消耗积分: ${totalPoints}, 消耗Token: ${totalTokens}, 总费用: ${cost.toFixed(4)}积分`);
    console.log(`用户 ${user.username} 余额扣除成功，剩余余额: ${newBalance.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      message: '上报成功',
      data: {
        cost: cost,
        balance: newBalance.toFixed(2),
        tokens: totalTokens,
        points: totalPoints
      }
    });
  } catch (error) {
    console.error('对话结束API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}