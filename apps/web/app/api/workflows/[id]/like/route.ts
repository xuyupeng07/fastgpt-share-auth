import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById } from '@/lib/db';
import WorkflowModel from '@/lib/models/Workflow';
import connectDB from '@/lib/mongodb';

// POST - 点赞工作流
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

    // 增加点赞数
    const updatedWorkflow = await WorkflowModel.findByIdAndUpdate(
      id,
      { $inc: { likeCount: 1 } },
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
      message: '点赞成功',
      data: {
        id: updatedWorkflow._id.toString(),
        likeCount: updatedWorkflow.likeCount
      }
    });
  } catch (error) {
    console.error('点赞工作流失败:', error);
    return NextResponse.json(
      { success: false, message: '点赞失败' },
      { status: 500 }
    );
  }
}

// DELETE - 取消点赞工作流
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // 减少点赞数（确保不会小于0）
    const updatedWorkflow = await WorkflowModel.findByIdAndUpdate(
      id,
      { 
        $inc: { likeCount: -1 },
        $max: { likeCount: 0 } // 确保点赞数不会小于0
      },
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
      message: '取消点赞成功',
      data: {
        id: updatedWorkflow._id.toString(),
        likeCount: updatedWorkflow.likeCount
      }
    });
  } catch (error) {
    console.error('取消点赞工作流失败:', error);
    return NextResponse.json(
      { success: false, message: '取消点赞失败' },
      { status: 500 }
    );
  }
}