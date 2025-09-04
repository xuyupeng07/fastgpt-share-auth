import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, findUserByToken } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, token } = body;

    let user = null;

    // 如果提供了token，优先使用token验证
    if (token) {
      console.log('收到Token验证请求:', { token });
      user = await findUserByToken(token);
      if (user) {
        console.log(`Token ${token} 验证成功`);
        return NextResponse.json({
          success: true,
          authToken: user.token,
          data: {
            uid: user.uid,
            username: user.username
          }
        });
      } else {
        console.log(`Token ${token} 验证失败`);
        return NextResponse.json(
          { success: false, message: 'Token无效' },
          { status: 401 }
        );
      }
    }

    // 使用用户名密码验证
    if (username && password) {
      console.log('收到登录请求:', { username, password });
      user = await authenticateUser(username, password);
      if (user) {
        console.log(`用户 ${username} 登录成功`);
        return NextResponse.json({
          success: true,
          authToken: user.token,
          data: {
            uid: user.uid,
            username: user.username
          }
        });
      } else {
        console.log(`用户 ${username} 登录失败`);
        return NextResponse.json(
          { success: false, message: '用户名或密码错误' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: '请提供用户名密码或token' },
      { status: 400 }
    );
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    );
  }
}