import { NextRequest, NextResponse } from "next/server";
import { getUserById, getWorkflowByName } from "@/lib/db";
import { validateToken, checkRateLimit } from "@/lib/jwt";

// 请求去重存储（简单的内存存储，生产环境建议使用Redis）
const requestCache = new Map<string, { timestamp: number; response: any }>();
const CACHE_DURATION = 3000; // 3秒内的重复请求将被去重

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, question, shareId, appName } = body;

    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // 请求去重检查
    const requestKey = `start:${clientIP}:${shareId || 'no-share'}:${Date.now().toString().slice(0, -3)}`; // 精确到秒
    const cachedRequest = requestCache.get(requestKey);
    
    if (cachedRequest && (Date.now() - cachedRequest.timestamp) < CACHE_DURATION) {
      console.log('\n🔄 检测到重复请求，返回缓存结果');
      console.log('  请求键:', requestKey);
      console.log('  缓存时间:', new Date(cachedRequest.timestamp).toLocaleString());
      return NextResponse.json(cachedRequest.response);
    }
    
    // 频率限制检查
    const rateLimitKey = `start:${clientIP}`;
    const rateLimitOk = checkRateLimit(rateLimitKey, 8, 10000); // 10秒内最多8次请求
    
    if (!rateLimitOk) {
      const errorResponse = { success: false, message: '请求过于频繁，请稍后再试' };
      console.log('\n🚫 频率限制触发');
      console.log('  客户端IP:', clientIP);
      console.log('  限制键:', rateLimitKey);
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // 终端日志：显示用户输入的请求数据
    console.log('\n=== ShareAuth Start 接口调用 ===');
    console.log('时间:', new Date().toLocaleString('zh-CN'));
    console.log('请求数据:');
    console.log('  客户端IP:', clientIP);
    if (token) console.log('  Token:', `${token.substring(0, 20)}...`);
    if (question) console.log('  Question:', question);
    if (appName) console.log('  AppName:', appName);

    if (!token) {
      const errorResponse = { success: false, message: '缺少token参数' };
      console.log('❌ 错误: 缺少token参数');
      return NextResponse.json(errorResponse);
    }

    // 验证JWT token (shareId可选)
    console.log('\n🔐 验证JWT Token...');
    const validationResult = await validateToken(token, shareId);
    if (!validationResult.success || !validationResult.data) {
      const errorResponse = { success: false, message: validationResult.message || '身份验证失败，无效的token' };
      console.log('❌ JWT验证失败:', validationResult.message);
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    console.log('✅ JWT验证成功');
    console.log('  用户ID:', validationResult.data.userId);
    console.log('  用户名:', validationResult.data.username);
    
    // 从JWT token中获取用户信息
    console.log('\n👤 获取用户详细信息...');
    const userId = typeof validationResult.data.userId === 'string' ? validationResult.data.userId : validationResult.data.userId.toString();
    const user = await getUserById(userId);
    if (!user) {
      const errorResponse = { success: false, message: '用户不存在' };
      console.log('❌ 用户不存在, 用户ID:', userId);
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    console.log('✅ 用户信息获取成功');
    console.log('  用户名:', user.username);
    console.log('  用户余额:', user.balance);

    // 检查用户余额，只有余额大于0时才能开始对话
    console.log('\n💰 检查用户余额...');
    const balance = Number(user.balance);
    
    if (balance <= 0) {
      const errorResponse = { success: false, message: '余额不足，请充值后再使用' };
      console.log('❌ 余额不足, 当前余额:', balance);
      return NextResponse.json(errorResponse);
    }
    
    console.log('✅ 余额检查通过, 余额:', balance);

    // 简单的敏感词过滤
    console.log('\n🔍 敏感词检查...');
    const sensitiveWords = ['政治', '暴力', '色情', '赌博'];
    const hasSensitiveWord = sensitiveWords.some(word => question && question.includes(word));
    console.log('  检查内容:', question || '无内容');
    
    if (hasSensitiveWord) {
      const errorResponse = { success: false, message: '内容包含敏感词，请重新输入' };
      console.log('❌ 发现敏感词');
      return NextResponse.json(errorResponse);
    }
    
    console.log('✅ 敏感词检查通过');
    
    // 获取工作流信息（如果提供了appName）
    console.log('\n⚙️ 获取工作流信息...');
    let workflowInfo = null;
    let workflowId = null;
    let pointMultiplier = 1;
    
    if (appName) {
      try {
        workflowInfo = await getWorkflowByName(appName);
        
        if (workflowInfo) {
          workflowId = workflowInfo.id || workflowInfo._id?.toString();
          pointMultiplier = workflowInfo.point_multiplier || 1;
          console.log('✅ 工作流信息获取成功:', workflowInfo.name, '积分倍率:', pointMultiplier);
        } else {
          console.log('⚠️ 未找到对应的工作流:', appName);
        }
      } catch (error) {
        console.log('❌ 获取工作流信息失败:', error);
      }
    }
    
    const successResponse = {
      success: true,
      data: {
        balance: user.balance,
        workflowId: workflowId,
        pointMultiplier: pointMultiplier,
        workflowInfo: workflowInfo ? {
          id: workflowId,
          name: workflowInfo.name,
          pointMultiplier: pointMultiplier
        } : null
      }
    };
    
    console.log('\n✅ === Start 处理成功 ===');
    console.log('用户可以开始对话');
    console.log('  用户:', user.username);
    if (question) console.log('  问题:', question);
    console.log('  当前余额:', balance);
    if (workflowId) console.log('  工作流ID:', workflowId);
    if (pointMultiplier !== 1) console.log('  积分倍率:', pointMultiplier);
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
  } catch (error) {
    const errorResponse = { success: false, message: '服务器错误' };
    console.log('❌ === Start 服务器错误 ===');
    console.log('错误信息:', error);
    console.log('===================\n');
    
    return NextResponse.json(errorResponse);
  }
}