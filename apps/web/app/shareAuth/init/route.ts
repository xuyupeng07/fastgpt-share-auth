import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, getWorkflowByNoLoginUrl } from "@/lib/db";
import { generateSecureToken, validateToken, checkRateLimit } from "@/lib/jwt";

// 请求去重存储（简单的内存存储，生产环境建议使用Redis）
const requestCache = new Map<string, { timestamp: number; response: any }>();
const CACHE_DURATION = 5000; // 5秒内的重复请求将被去重

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, token } = body;

    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // 请求去重检查
    const requestKey = `init:${clientIP}:${username || 'anonymous'}:${Date.now().toString().slice(0, -3)}`; // 精确到秒
    const cachedRequest = requestCache.get(requestKey);
    
    if (cachedRequest && (Date.now() - cachedRequest.timestamp) < CACHE_DURATION) {
      console.log('\n🔄 检测到重复请求，返回缓存结果');
      console.log('  请求键:', requestKey);
      console.log('  缓存时间:', new Date(cachedRequest.timestamp).toLocaleString());
      return NextResponse.json(cachedRequest.response);
    }
    
    // 频率限制检查
    const rateLimitKey = `init:${clientIP}`;
    const rateLimitOk = checkRateLimit(rateLimitKey, 5, 10000); // 10秒内最多5次请求
    
    if (!rateLimitOk) {
      const errorResponse = { success: false, message: '请求过于频繁，请稍后再试' };
      console.log('\n🚫 频率限制触发');
      console.log('  客户端IP:', clientIP);
      console.log('  限制键:', rateLimitKey);
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // 获取用户访问的链接信息
    const referer = request.headers.get('referer') || request.headers.get('origin') || '';
    let noLoginUrl = '';
    let workflowInfo = null;
    let pointMultiplier = 1; // 默认积分倍率
    
    // 从referer中提取no_login_url部分（去掉authToken参数）
    if (referer) {
      try {
        const url = new URL(referer);
        // 移除authToken参数
        url.searchParams.delete('authToken');
        noLoginUrl = url.toString();
        
        // 根据no_login_url查询工作流信息
        workflowInfo = await getWorkflowByNoLoginUrl(noLoginUrl);
        if (workflowInfo && workflowInfo.point_multiplier !== undefined) {
          pointMultiplier = workflowInfo.point_multiplier;
        }
      } catch (error) {
        console.error('解析referer URL失败:', error);
      }
    }

    // 终端日志：显示用户输入的请求数据
    console.log('\n=== ShareAuth Init 接口调用 ===');
    console.log('时间:', new Date().toLocaleString('zh-CN'));
    console.log('请求数据:');
    console.log('  客户端IP:', clientIP);
    if (username) console.log('  Username:', username);
     if (password) console.log('  Password: ***已提供***');
     if (token) console.log('  Token:', `${token.substring(0, 20)}...`);
     if (referer) console.log('  Referer:', referer);
     if (noLoginUrl) console.log('  提取的no_login_url:', noLoginUrl);
     if (workflowInfo) console.log('  工作流信息: 找到工作流:', workflowInfo.name);
     if (pointMultiplier !== 1) console.log('  积分倍率:', pointMultiplier);

    let user = null;

    // 如果提供了token，优先使用JWT token验证，失败则回退到明文token验证
    if (token && token.trim()) {
      console.log('\n🔐 验证JWT Token...');
      // 首先尝试JWT token验证
      const jwtValidation = await validateToken(token);
      if (jwtValidation.success && jwtValidation.data) {
        console.log('✅ JWT验证成功');
        console.log('  用户ID:', jwtValidation.data.userId);
        console.log('  用户名:', jwtValidation.data.username);
        
        console.log('✅ JWT验证成功，用户信息:');
         console.log('  用户名:', jwtValidation.data.username);
         console.log('  用户ID:', jwtValidation.data.userId);
        
        const successResponse = {
          success: true,
          authToken: token, // 返回原JWT token
          data: {
            userId: jwtValidation.data.userId,
            username: jwtValidation.data.username,
            pointMultiplier: pointMultiplier,
            workflowInfo: workflowInfo ? {
              id: workflowInfo.id,
              name: workflowInfo.name,
              noLoginUrl: noLoginUrl
            } : null
          }
        };
        
        console.log('\n✅ === Init 处理成功 ===');
        console.log('===================\n');
        
        // 缓存成功响应
         requestCache.set(requestKey, {
           timestamp: Date.now(),
           response: successResponse
         });
         
         // 清理过期缓存
         for (const [key, value] of requestCache.entries()) {
           if (Date.now() - value.timestamp > CACHE_DURATION) {
             requestCache.delete(key);
           }
         }
         
         return NextResponse.json(successResponse);
      }
      
      // JWT验证失败，返回错误
      const errorResponse = { success: false, message: '身份验证失败，无效的token' };
      console.log('❌ JWT验证失败');
      console.log('\n❌ === Init 处理失败 ===');
      console.log('===================\n');
      
      return NextResponse.json(errorResponse);
    }

    // 使用用户名密码验证
    if (username && password) {
      console.log('\n👤 使用用户名密码验证...');
      console.log('  用户名:', username);
      
      user = await authenticateUser(username, password);
      if (user) {
          console.log('✅ 用户验证成功');
          console.log('  用户ID:', user._id.toString());
          console.log('  用户名:', user.username);
          console.log('  用户余额:', user.balance);
          console.log('  用户状态:', user.status);
        
        // 生成安全的JWT token
        console.log('\n🔑 生成JWT Token...');
        const jwtToken = generateSecureToken(
          user._id.toString(),
          user.username,
          undefined, // shareId可选
          ['read', 'chat'] // 默认权限
        );
        
        console.log('✅ JWT Token生成成功');
        console.log('  Token:', `${jwtToken.substring(0, 20)}...`);
        
        const successResponse = {
          success: true,
          authToken: jwtToken, // 返回JWT token
          data: {
            userId: user._id.toString(),
            username: user.username,
            pointMultiplier: pointMultiplier,
            workflowInfo: workflowInfo ? {
              id: workflowInfo.id,
              name: workflowInfo.name,
              noLoginUrl: noLoginUrl
            } : null
          }
        };
        
        console.log('\n✅ === Init 处理成功 ===');
        console.log('===================\n');
        
        // 缓存成功响应
         requestCache.set(requestKey, {
           timestamp: Date.now(),
           response: successResponse
         });
         
         // 清理过期缓存
         for (const [key, value] of requestCache.entries()) {
           if (Date.now() - value.timestamp > CACHE_DURATION) {
             requestCache.delete(key);
           }
         }
         
         return NextResponse.json(successResponse);
      } else {
        const errorResponse = { success: false, message: '用户名或密码错误' };
        console.log('❌ 用户验证失败: 用户名或密码错误');
        console.log('\n❌ === Init 处理失败 ===');
        console.log('===================\n');
        
        return NextResponse.json(errorResponse);
      }
    }

    const errorResponse = { success: false, message: '缺少认证参数' };
    console.log('❌ 缺少认证参数');
    console.log('\n❌ === Init 处理失败 ===');
    console.log('===================\n');
    
    return NextResponse.json(errorResponse);
  } catch (error) {
    const errorResponse = { success: false, message: '服务器错误' };
    console.log('❌ === Init 服务器错误 ===');
    console.log('错误信息:', error);
    console.log('===================\n');
    
    return NextResponse.json(errorResponse);
  }
}