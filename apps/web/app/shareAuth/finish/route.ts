import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { updateUserBalanceById, addConsumptionRecord, getUserById, getWorkflowById, getWorkflowByName } from "@/lib/db";
import { validateToken, checkRateLimit } from "@/lib/jwt";

// 请求去重存储（简单的内存存储，生产环境建议使用Redis）
const requestCache = new Map<string, { timestamp: number; response: any }>();
const CACHE_DURATION = 3000; // 3秒内的重复请求将被去重

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, responseData, workflowId, appName } = body;

    // 获取客户端IP
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // 请求去重检查（基于token和totalTokens的组合，因为finish请求应该是唯一的）
    const requestKey = `finish:${clientIP}:${token ? token.substring(0, 10) : 'no-token'}:${body.totalTokens || 0}:${Date.now().toString().slice(0, -3)}`;
    const cachedRequest = requestCache.get(requestKey);
    
    if (cachedRequest && (Date.now() - cachedRequest.timestamp) < CACHE_DURATION) {
      console.log('\n🔄 检测到重复请求，返回缓存结果');
      console.log('  请求键:', requestKey);
      console.log('  缓存时间:', new Date(cachedRequest.timestamp).toLocaleString());
      return NextResponse.json(cachedRequest.response);
    }
    
    // 频率限制检查
    const rateLimitKey = `finish:${clientIP}`;
    const rateLimitOk = checkRateLimit(rateLimitKey, 10, 10000); // 10秒内最多10次请求
    
    if (!rateLimitOk) {
      const errorResponse = { success: false, message: '请求过于频繁，请稍后再试' };
      console.log('\n🚫 频率限制触发');
      console.log('  客户端IP:', clientIP);
      console.log('  限制键:', rateLimitKey);
      return NextResponse.json(errorResponse, { status: 429 });
    }

    // 终端日志：显示用户输入的请求数据
    console.log('\n=== ShareAuth Finish 接口调用 ===');
    console.log('时间:', new Date().toLocaleString('zh-CN'));
    console.log('请求数据:');
    console.log('  客户端IP:', clientIP);
    if (token) console.log('  Token:', `${token.substring(0, 20)}...`);
    if (workflowId) console.log('  WorkflowId:', workflowId);
    if (appName) console.log('  AppName:', appName);

    if (!token) {
      const errorResponse = { success: false, message: '缺少token参数' };
      console.log('❌ 错误: 缺少token参数');
      return NextResponse.json(errorResponse);
    }



    // 验证JWT token
    console.log('\n🔐 验证JWT Token...');
    const jwtValidation = await validateToken(token);
    
    if (!jwtValidation.success || !jwtValidation.data) {
      const errorResponse = { success: false, message: '身份验证失败，无效的token' };
      console.log('❌ JWT验证失败');
      return NextResponse.json(errorResponse);
    }
    
    console.log('✅ JWT验证成功, 用户ID:', jwtValidation.data.userId);
    
    // JWT token验证成功，通过用户ID获取用户信息
    console.log('\n👤 获取用户信息...');
    const user = await getUserById(jwtValidation.data.userId.toString());
    
    if (!user) {
      const errorResponse = { success: false, message: '用户不存在' };
      console.log('❌ 用户不存在');
      return NextResponse.json(errorResponse, { status: 404 });
    }
    
    console.log('✅ 用户信息获取成功:');
    console.log('  用户名:', user.username);
    console.log('  当前余额:', user.balance);

    // 计算总消耗（支持FastGPT格式）
    console.log('\n💰 计算消费数据...');
    let totalPoints = 0;
    let totalTokens = 0;
    
    if (responseData) {
      if (Array.isArray(responseData)) {
        // 数组格式
        console.log('📊 处理数组格式的响应数据');
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
    if (body.totalTokens) {
      totalTokens = body.totalTokens;
    }
    if (body.totalPoints) {
      totalPoints = body.totalPoints;
    }
    
    console.log('计算结果:');
    console.log('  总Token数:', totalTokens);
    console.log('  总积分数:', totalPoints);
    
    // 获取积分倍率
    console.log('\n⚙️ 获取积分倍率配置...');
    let pointMultiplier = 1; // 默认倍率为1
    
    if (appName) {
      const multiplierConfig = await getWorkflowByName(appName);
      if (multiplierConfig && multiplierConfig.point_multiplier !== undefined) {
        pointMultiplier = multiplierConfig.point_multiplier;
        console.log(`✅ 找到积分倍率配置: ${pointMultiplier}`);
      } else {
        console.log('⚠️ 未找到积分倍率配置，使用默认倍率: 1');
      }
    } else {
      console.log('⚠️ AppName为空，使用默认倍率: 1');
    }
    
    // 计算实际扣除的积分
    const actualPointsToDeduct = Math.round(totalPoints * pointMultiplier);
    
    console.log('\n💳 积分计算详情:');
    console.log('  原始积分:', totalPoints);
    console.log('  积分倍率:', pointMultiplier);
    console.log('  实际扣除积分:', actualPointsToDeduct);
    console.log('  用户当前余额:', user.balance);

    // 允许余额不足时继续扣费，余额可以为负数
    if (user.balance < actualPointsToDeduct) {
      console.log('⚠️ 余额不足，但继续扣费');
      console.log('  需要积分:', actualPointsToDeduct);
      console.log('  当前余额:', user.balance);
      console.log('  扣费后余额将为:', user.balance - actualPointsToDeduct);
    }

    try {
      // 使用MongoDB事务处理余额扣除和消费记录
      console.log('\n🔄 开始MongoDB事务处理...');
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          console.log('💰 扣除用户余额...');
          console.log('  原余额:', user!.balance);
          console.log('  扣除金额:', actualPointsToDeduct);
          console.log('  新余额:', user!.balance - actualPointsToDeduct);
          
          // 扣除用户余额
          await updateUserBalanceById(user!._id.toString(), user!.balance - actualPointsToDeduct, session);
          console.log('✅ 余额扣除成功');
          
          // 记录消费记录
          console.log('\n📝 写入消费记录到MongoDB...');
          console.log('消费记录数据:');
          console.log('  用户ID:', user!._id.toString());
          console.log('  用户名:', user!.username);
          console.log('  Token使用量:', totalTokens);
          console.log('  积分使用量:', totalPoints);
          console.log('  消费金额:', actualPointsToDeduct);
          console.log('  响应数据:', JSON.stringify(body.responseData, null, 2));
          
          const recordResult = await addConsumptionRecord(
            user!._id.toString(),
            user!.username,
            totalTokens,
            totalPoints,
            actualPointsToDeduct,
            body.responseData,
            session,
            token,
            appName
          );
          
          if (recordResult) {
            console.log('✅ 消费记录写入成功');
          } else {
            console.log('❌ 消费记录写入失败');
          }
        });
        
        await session.endSession();
        console.log('✅ MongoDB事务处理完成');
        
        // 获取更新后的用户信息
        console.log('\n🔄 获取更新后的用户信息...');
        const updatedUser = await getUserById(user!._id.toString());
        const newBalance = updatedUser?.balance || 0;
        console.log('✅ 更新后余额:', newBalance);
        
        // 构建响应数据
        const responseData = {
          success: true,
          message: '上报成功',
          balanceUpdated: true, // 添加余额更新标识，用于触发客户端事件
          data: {
            cost: actualPointsToDeduct,
            balance: newBalance,
            tokens: totalTokens,
            points: totalPoints,
            originalPoints: totalPoints,
            pointMultiplier: pointMultiplier
          }
        };
        
        console.log('\n✅ === 处理成功 ===');
        console.log('用户余额扣除成功');
        console.log('  用户:', user!.username);
        console.log('  扣除积分:', actualPointsToDeduct);
        console.log('  剩余余额:', newBalance);
        console.log('  Token使用量:', totalTokens);
        console.log('  积分使用量:', totalPoints);
        console.log('  积分倍率:', pointMultiplier);
        console.log('===================\n');
        
        // 缓存成功的响应
        requestCache.set(requestKey, {
          timestamp: Date.now(),
          response: responseData
        });
        
        // 清理过期的缓存
        for (const [key, value] of requestCache.entries()) {
          if (Date.now() - value.timestamp > CACHE_DURATION) {
            requestCache.delete(key);
          }
        }
        
        return NextResponse.json(responseData);
        
      } catch (error) {
        await session.endSession();
        console.log('❌ 数据库事务失败:', error);
        throw error;
      }
      
    } catch (error) {
      const errorResponse = { success: false, message: '数据库操作失败' };
      console.log('❌ === 处理失败 ===');
      console.log('错误信息:', error);
      console.log('===================\n');
      return NextResponse.json(errorResponse, { status: 500 });
    }
  } catch (error) {
    console.log('❌ === 服务器错误 ===');
    console.log('错误信息:', error);
    console.log('===================\n');
    
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}