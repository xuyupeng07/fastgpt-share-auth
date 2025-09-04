import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, findUserByToken } from "@/lib/db";
import { generateSecureToken, validateToken } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, token } = body;

    let user = null;

    // 如果提供了token，优先使用JWT token验证，失败则回退到明文token验证
    if (token && token.trim()) {
      // 首先尝试JWT token验证
      const jwtValidation = await validateToken(token);
      if (jwtValidation.success && jwtValidation.data) {
        console.log(`JWT Token验证成功: ${jwtValidation.data.username}`);
        return NextResponse.json({
          success: true,
          authToken: token, // 返回原JWT token
          data: {
            uid: jwtValidation.data.uid,
            username: jwtValidation.data.username
          }
        });
      }
      
      // JWT验证失败，尝试明文token验证
      user = await findUserByToken(token);
      if (user) {
        console.log(`明文token验证成功: ${user.username}`);
        
        // 为明文token用户生成新的JWT token
        const jwtToken = generateSecureToken(
          user.id,
          user.username,
          user.uid,
          undefined, // 没有特定的shareId
          ['read', 'chat'] // 默认权限
        );
        
        return NextResponse.json({
          success: true,
          authToken: jwtToken, // 返回新生成的JWT token
          data: {
            uid: user.uid,
            username: user.username
          }
        });
      }
      
      // 两种验证都失败，但不输出日志避免噪音
      return NextResponse.json(
        { success: false, message: '身份验证失败，无效的token' }
      );
    }

    // 使用用户名密码验证
    if (username && password) {
      console.log('收到登录请求:', { username, password });
      user = await authenticateUser(username, password);
      if (user) {
        console.log(`用户 ${username} 登录成功`);
        
        // 生成安全的JWT token
        const jwtToken = generateSecureToken(
          user.id,
          user.username,
          user.uid,
          undefined, // shareId可选
          ['read', 'chat'] // 默认权限
        );
        
        console.log(`为用户 ${username} 生成JWT token`);
        
        return NextResponse.json({
          success: true,
          authToken: jwtToken, // 返回JWT token
          data: {
            uid: user.uid,
            username: user.username
          }
        });
      } else {
        console.log(`用户 ${username} 登录失败`);
        return NextResponse.json(
          { success: false, message: '用户名或密码错误' }
        );
      }
    }

    return NextResponse.json(
      { success: false, message: '缺少认证参数' }
    );
  } catch (error) {
    console.error('登录API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器错误' }
    );
  }
}