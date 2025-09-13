import { NextResponse } from 'next/server';
import { getAllWorkflowCategories } from '@/lib/db';

export async function GET() {
  try {
    // 获取所有活跃的工作流分类
    const categories = await getAllWorkflowCategories();
    
    return NextResponse.json({
      success: true,
      data: categories,
      message: '获取分类列表成功'
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        data: [],
        message: '获取分类列表失败'
      },
      { status: 500 }
    );
  }
}