import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/db";
import { validateToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, question, shareId } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token参数' }
      );
    }

    console.log('收到对话开始请求:', { token, question });

    // 验证JWT token (shareId可选)
    const validationResult = await validateToken(token, shareId);
    if (!validationResult.success || !validationResult.data) {
      return NextResponse.json(
        { success: false, message: validationResult.message || '身份验证失败，无效的token' },
        { status: 401 }
      );
    }
    
    // 从JWT token中获取用户信息
    const userId = typeof validationResult.data.userId === 'string' ? validationResult.data.userId : validationResult.data.userId.toString();
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 401 }
      );
    }

    // 检查用户余额，只有余额大于0时才能开始对话
    const balance = Number(user.balance);
    if (balance <= 0) {
      console.log(`用户 ${user.username} 余额不足: ${balance}`);
      return NextResponse.json(
        { success: false, message: '余额不足，请充值后再使用' }
      );
    }

    // 简单的敏感词过滤
    const sensitiveWords = ['政治', '暴力', '色情', '赌博'];
    const hasSensitiveWord = sensitiveWords.some(word => question && question.includes(word));
    if (hasSensitiveWord) {
      console.log(`用户 ${user.username} 提问包含敏感词: ${question}`);
      return NextResponse.json(
        { success: false, message: '内容包含敏感词，请重新输入' }
      );
    }

    console.log(`用户 ${user.username} 开始对话: ${question}, 当前余额: ${balance}`);

    return NextResponse.json({
      success: true,
      data: {
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('对话开始API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' }
    );
  }
}