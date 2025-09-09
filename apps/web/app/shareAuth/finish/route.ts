import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { updateUserBalanceById, addConsumptionRecord, getUserById } from "@/lib/db";
import { validateToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, responseData } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token参数' }
      );
    }

    console.log('收到对话结束上报:', { token });

    // 验证JWT token
    const jwtValidation = await validateToken(token);
    
    if (!jwtValidation.success || !jwtValidation.data) {
      return NextResponse.json(
        { success: false, message: '身份验证失败，无效的token' }
      );
    }
    
    // JWT token验证成功，通过用户ID获取用户信息
    const user = await getUserById(jwtValidation.data.userId.toString());
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    // 计算总消耗（支持FastGPT格式）
    let totalPoints = 0;
    let totalTokens = 0;
    
    if (responseData) {
      if (Array.isArray(responseData)) {
        // 数组格式
        totalPoints = responseData.reduce((sum, item) => sum + (item.totalPoints || 0), 0);
        totalTokens = responseData.reduce((sum, item) => {
          const inputTokens = item.inputTokens || 0;
          const outputTokens = item.outputTokens || 0;
          const tokens = item.tokens || 0;
          return sum + inputTokens + outputTokens + tokens;
        }, 0);
      } else if (responseData.usage) {
        // FastGPT格式：{usage: {totalTokens: xxx, totalPoints: xxx}}
        totalTokens = responseData.usage.totalTokens || 0;
        totalPoints = responseData.usage.totalPoints || 0;
      } else {
        // 直接对象格式
        totalTokens = responseData.totalTokens || responseData.tokens || 0;
        totalPoints = responseData.totalPoints || responseData.points || 0;
      }
    }
    
    // 支持直接从body传入的格式
    if (body.totalTokens) totalTokens = body.totalTokens;
    if (body.totalPoints) totalPoints = body.totalPoints;
    
    // 计算费用 - 消耗积分直接等于总费用
    const cost = totalPoints;

    // 移除余额检查，允许余额扣成负数
    const currentBalance = user.balance;
    console.log(`用户 ${user.username} 当前余额: ${currentBalance}, 本次消费: ${cost}`);

    console.log(`用户 ${user.username} 对话结束 - 消耗积分: ${totalPoints}, 消耗Token: ${totalTokens}, 总费用: ${cost.toFixed(4)}积分`);

    try {
      // 使用MongoDB事务处理余额扣除和消费记录
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // 扣除用户余额
          await updateUserBalanceById(user!._id.toString(), user!.balance - cost, session);
          
          // 记录消费记录
          await addConsumptionRecord(
            user!._id.toString(),
            user!.username,
            totalTokens,
            totalPoints,
            cost,
            responseData,
            session,
            token
          );
        });
        
        await session.endSession();
        
        // 获取更新后的用户信息
        const updatedUser = await getUserById(user!._id.toString());
        const newBalance = updatedUser?.balance || 0;
        
        console.log(`用户 ${user!.username} 余额扣除成功，剩余余额: ${newBalance}`);
        
        return NextResponse.json({
          success: true,
          message: '上报成功',
          data: {
            cost: cost,
            balance: newBalance,
            tokens: totalTokens,
            points: totalPoints
          }
        });
        
      } catch (error) {
        await session.endSession();
        throw error;
      }
      
    } catch (error) {
      console.error('处理消费记录失败:', error);
      return NextResponse.json(
        { success: false, message: '处理消费记录失败' }
      );
    }
  } catch (error) {
    console.error('对话结束API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' }
    );
  }
}