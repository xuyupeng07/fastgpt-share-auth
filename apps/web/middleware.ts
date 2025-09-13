import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 移除profile页面的服务端认证检查
  // 让前端页面自己处理认证逻辑，避免与localStorage存储的token冲突
  return NextResponse.next()
}

export const config = {
  matcher: []
}