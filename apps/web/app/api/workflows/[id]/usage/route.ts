import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById } from '@/lib/db';
import WorkflowModel from '@/lib/models/Workflow';
import connectDB from '@/lib/mongodb';

// POST - 增加工作流使用量
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    
    // 验证ID格式
    if (!id || (typeof id === 'string' && (id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)))) {
      return NextResponse.json(
        { success: false, message: '无效的工作流ID格式' },
        { status: 400 }
      );
    }
    
    // 验证工作流是否存在
    const workflow = await getWorkflowById(id);
    if (!workflow) {
      return NextResponse.json(
        { success: false, message: '工作流不存在' },
        { status: 404 }
      );
    }

    // 增加使用量
    const updatedWorkflow = await WorkflowModel.findByIdAndUpdate(
      id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!updatedWorkflow) {
      return NextResponse.json(
        { success: false, message: '更新工作流失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '使用量更新成功',
      data: {
        id: updatedWorkflow._id.toString(),
        usageCount: updatedWorkflow.usageCount
      }
    });
  } catch (error) {
    console.error('更新工作流使用量失败:', error);
    return NextResponse.json(
      { success: false, message: '更新使用量失败' },
      { status: 500 }
    );
  }
}