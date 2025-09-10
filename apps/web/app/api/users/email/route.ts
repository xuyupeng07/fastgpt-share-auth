import { NextRequest, NextResponse } from 'next/server';
import { updateUserEmail, getUserById } from '@/lib/db';
import UserModel from '@/lib/models/User';

export async function PUT(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    // 验证必需参数
    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: '缺少必需参数：用户ID和邮箱地址' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: '邮箱格式不正确，请输入有效的邮箱地址' },
        { status: 400 }
      );
    }

    // 检查用户是否存在
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户不存在，请检查用户ID' },
        { status: 404 }
      );
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await UserModel.findOne({ 
      email, 
      _id: { $ne: userId } 
    }).lean();
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '该邮箱已被其他用户使用，请选择其他邮箱' },
        { status: 409 }
      );
    }

    // 更新用户邮箱
    const success = await updateUserEmail(userId, email);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: '邮箱修改成功'
      });
    } else {
      return NextResponse.json(
        { success: false, message: '邮箱修改失败，请稍后重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('修改邮箱API错误:', error);
    
    // 处理MongoDB重复键错误
    if ((error as unknown as { code: number }).code === 11000) {
      return NextResponse.json(
        { success: false, message: '该邮箱已被使用，请选择其他邮箱' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}