import bcrypt from 'bcryptjs'
import { getUserById, updateUserPassword } from '@/lib/db'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { password } = await request.json()
    const { id } = await params
    
    if (!password || password.length < 6) {
      return Response.json({ error: '密码长度至少6位' }, { status: 400 })
    }

    // 检查用户是否存在
    const user = await getUserById(id)
    if (!user) {
      return Response.json({ error: '用户不存在' }, { status: 404 })
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 更新用户密码
    const success = await updateUserPassword(id, hashedPassword)
    
    if (!success) {
      return Response.json({ error: '密码更新失败' }, { status: 500 })
    }
    
    return Response.json({ message: '密码更新成功' })
  } catch (error) {
    console.error('Password update error:', error)
    return Response.json({ error: '服务器错误' }, { status: 500 })
  }
}