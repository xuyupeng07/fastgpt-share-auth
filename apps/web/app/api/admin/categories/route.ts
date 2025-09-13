import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllWorkflowCategories, 
  createWorkflowCategory, 
  updateWorkflowCategory, 
  deleteWorkflowCategory,
  getUserById 
} from '@/lib/db';
import { validateToken } from '@/lib/jwt';

// 验证管理员权限
async function verifyAdminToken(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('authToken')?.value;
    
    if (!token) {
      return {
        success: false,
        error: '缺少认证token',
        status: 401
      };
    }

    const jwtValidation = await validateToken(token);
    
    if (!jwtValidation.success || !jwtValidation.data) {
      return {
        success: false,
        error: '无效的token',
        status: 401
      };
    }

    const user = await getUserById(jwtValidation.data.userId);
    
    if (!user) {
      return {
        success: false,
        error: '用户不存在',
        status: 404
      };
    }

    if (!user.is_admin) {
      return {
        success: false,
        error: '权限不足，需要管理员权限',
        status: 403
      };
    }

    return {
      success: true,
      user
    };
  } catch (error) {
    console.error('管理员权限验证失败:', error);
    return {
      success: false,
      error: '权限验证失败',
      status: 500
    };
  }
}

// GET - 获取所有分类
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const categories = await getAllWorkflowCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新分类
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { name, sort_order, status } = body;

    // 验证必填字段
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const categoryData = {
      name: name.trim(),
      sort_order: sort_order || 0,
      status: status || 'active'
    };

    const newCategory = await createWorkflowCategory(categoryData);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: unknown) {
    console.error('创建分类失败:', error);
    
    // 处理重复名称错误
    if (error && typeof error === 'object' && 'code' in error && (error as { code: number }).code === 11000) {
      return NextResponse.json(
        { error: '分类名称已存在' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新分类
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { id, name, sort_order, status } = body;

    // 验证必填字段
    if (!id) {
      return NextResponse.json(
        { error: '分类ID不能为空' },
        { status: 400 }
      );
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '分类名称不能为空' },
        { status: 400 }
      );
    }

    const updateData = {
      name: name.trim(),
      sort_order: sort_order || 0,
      status: status || 'active'
    };

    const updatedCategory = await updateWorkflowCategory(id, updateData);
    
    if (!updatedCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCategory);
  } catch (error: unknown) {
    console.error('更新分类失败:', error);
    
    // 处理重复名称错误
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { error: '分类名称已存在' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '更新分类失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除分类
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '分类ID不能为空' },
        { status: 400 }
      );
    }

    const deletedCategory = await deleteWorkflowCategory(id);
    
    if (!deletedCategory) {
      return NextResponse.json(
        { error: '分类不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '分类删除成功' });
  } catch (error) {
    console.error('删除分类失败:', error);
    return NextResponse.json(
      { error: '删除分类失败' },
      { status: 500 }
    );
  }
}