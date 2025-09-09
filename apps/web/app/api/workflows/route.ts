import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllWorkflows, 
  createWorkflow, 
  updateWorkflow, 
  deleteWorkflow,
  getWorkflowById 
} from '@/lib/db';

// 工作流接口类型定义
interface Workflow {
  id?: number;
  name: string;
  description: string;
  no_login_url: string;
  status: 'active' | 'inactive';
  category_id?: string;
  category_name?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

// GET - 获取所有工作流
export async function GET() {
  try {
    const workflows = await getAllWorkflows();
    return NextResponse.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('获取工作流列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取工作流列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新工作流
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, no_login_url, status = 'active', category_id, avatar } = body;

    // 验证必填字段
    if (!name || !description || !no_login_url) {
      return NextResponse.json(
        { success: false, message: '工作流名称、描述和链接不能为空' },
        { status: 400 }
      );
    }

    // 验证URL格式
    try {
      new URL(no_login_url);
    } catch {
      return NextResponse.json(
        { success: false, message: '请输入有效的URL格式' },
        { status: 400 }
      );
    }

    // 验证状态值
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, message: '状态值必须为 active 或 inactive' },
        { status: 400 }
      );
    }

    const result = await createWorkflow(name, description, no_login_url, status, category_id || undefined, avatar);
    
    return NextResponse.json({
      success: true,
      message: '工作流创建成功',
      data: result
    });
  } catch (error) {
    console.error('创建工作流失败:', error);
    return NextResponse.json(
      { success: false, message: '创建工作流失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新工作流
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, no_login_url, status, category_id, avatar } = body;

    // 验证必填字段
    if (!id || !name || !description || !no_login_url || !status) {
      return NextResponse.json(
        { success: false, message: '所有字段都不能为空' },
        { status: 400 }
      );
    }

    // 验证工作流是否存在
    const existingWorkflow = await getWorkflowById(id);
    if (!existingWorkflow) {
      return NextResponse.json(
        { success: false, message: '工作流不存在' },
        { status: 404 }
      );
    }

    // 验证URL格式
    try {
      new URL(no_login_url);
    } catch {
      return NextResponse.json(
        { success: false, message: '请输入有效的URL格式' },
        { status: 400 }
      );
    }

    // 验证状态值
    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json(
        { success: false, message: '状态值必须为 active 或 inactive' },
        { status: 400 }
      );
    }

    const result = await updateWorkflow(id, name, description, no_login_url, status, category_id || undefined, avatar);
    
    return NextResponse.json({
      success: true,
      message: '工作流更新成功',
      data: result
    });
  } catch (error) {
    console.error('更新工作流失败:', error);
    return NextResponse.json(
      { success: false, message: '更新工作流失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除工作流
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, message: '工作流ID不能为空' },
        { status: 400 }
      );
    }

    // 验证工作流是否存在
    const existingWorkflow = await getWorkflowById(id);
    if (!existingWorkflow) {
      return NextResponse.json(
        { success: false, message: '工作流不存在' },
        { status: 404 }
      );
    }

    const result = await deleteWorkflow(id);
    
    return NextResponse.json({
      success: true,
      message: '工作流删除成功',
      data: result
    });
  } catch (error) {
    console.error('删除工作流失败:', error);
    return NextResponse.json(
      { success: false, message: '删除工作流失败' },
      { status: 500 }
    );
  }
}