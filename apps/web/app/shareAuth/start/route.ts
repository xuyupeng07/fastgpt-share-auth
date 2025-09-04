import { NextRequest, NextResponse } from "next/server";
import { findUserByToken } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, question } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '缺少token参数' },
        { status: 400 }
      );
    }

    console.log('收到对话开始请求:', { token, question });

    // 验证用户token
    const user = await findUserByToken(token);
    if (!user) {
      console.log(`Token ${token} 无效`);
      return NextResponse.json(
        { success: false, message: 'Token无效' },
        { status: 401 }
      );
    }

    // 检查用户余额
    const balance = parseFloat(user.balance);
    if (balance <= 0) {
      console.log(`用户 ${user.username} 余额不足: ${balance}`);
      return NextResponse.json(
        { success: false, message: '余额不足，请先充值' },
        { status: 402 }
      );
    }

    // 简单的敏感词过滤
    const sensitiveWords = ['政治', '暴力', '色情', '赌博'];
    const hasSensitiveWord = sensitiveWords.some(word => question && question.includes(word));
    if (hasSensitiveWord) {
      console.log(`用户 ${user.username} 提问包含敏感词: ${question}`);
      return NextResponse.json(
        { success: false, message: '提问包含敏感词，请重新输入' },
        { status: 403 }
      );
    }

    console.log(`用户 ${user.username} 开始对话: ${question}, 当前余额: ${balance}`);

    return NextResponse.json({
      success: true,
      data: {
        uid: user.uid,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('对话开始API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}