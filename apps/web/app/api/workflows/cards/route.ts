import { NextRequest, NextResponse } from 'next/server';
import { getAllWorkflows } from '@/lib/db';

// 工作流卡片数据转换函数
function transformWorkflowToCard(workflow: any) {
  return {
    id: workflow._id?.toString() || workflow.id?.toString(),
    name: workflow.name,
    description: workflow.description,
    logo: workflow.avatar || '/fastgpt.svg', // 优先使用自定义头像，否则使用默认logo
    avatar: workflow.avatar, // 添加avatar字段
    isVip: false, // 默认非VIP
    demo_url: workflow.no_login_url, // 使用no_login_url作为demo_url
    config: { model: 'gpt-4', temperature: 0.7 }, // 默认配置
    author: {
      name: 'FastGPT Team',
      avatar: '/fastgpt.svg',
      isVerified: true
    },
    category: workflow.category_name || '其他', // 使用工作流的实际分类
    category_name: workflow.category_name || '其他', // 添加category_name字段
    likeCount: workflow.likeCount || 0, // 使用数据库中的真实点赞数
    usageCount: workflow.usageCount || 0 // 使用数据库中的真实使用数
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