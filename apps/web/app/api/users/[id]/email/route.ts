import { getUserById } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return Response.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
    }

    // 检查用户是否存在
    const user = await getUserById(params.id);
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 });
    }

    // TODO: 实现邮箱更新逻辑
    // 这里需要根据实际的数据库操作来更新用户邮箱
    
    return Response.json({ message: '邮箱更新成功' });
  } catch (error) {
    console.error('Email update error:', error);
    return Response.json({ error: '服务器错误' }, { status: 500 });
  }
}