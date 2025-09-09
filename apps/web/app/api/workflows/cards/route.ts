import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkflows } from '@/lib/db';

// 工作流卡片数据转换函数
function transformWorkflowToCard(workflow: any) {
  return {
    id: workflow._id?.toString() || workflow.id?.toString(),
    name: workflow.name,
    description: workflow.description,
    logo: '/fastgpt.svg', // 默认logo
    isVip: false, // 默认非VIP
    demo_url: workflow.no_login_url, // 使用no_login_url作为demo_url
    config: { model: 'gpt-4', temperature: 0.7 }, // 默认配置
    author: {
      name: 'FastGPT Team',
      avatar: '/fastgpt.svg',
      isVerified: true
    },
    category: '智能助手', // 默认分类
    likeCount: Math.floor(Math.random() * 200) + 50, // 随机点赞数
    usageCount: Math.floor(Math.random() * 2000) + 100 // 随机使用数
  };
}

// GET - 获取工作流卡片数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active';
    
    // 从数据库获取工作流数据
    const workflows = await getAllWorkflows();
    
    // 过滤活跃状态的工作流
    const activeWorkflows = workflows.filter(workflow => 
      workflow.status === status
    );
    
    // 转换为前端卡片格式
    const cardData = activeWorkflows.map(transformWorkflowToCard);
    
    return NextResponse.json({
      success: true,
      data: cardData,
      total: cardData.length
    });
  } catch (error) {
    console.error('获取工作流卡片数据失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作流卡片数据失败' },
      { status: 500 }
    );
  }
}