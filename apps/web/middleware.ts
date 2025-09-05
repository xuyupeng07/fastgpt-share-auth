import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 只处理需要认证的页面
  if (pathname === '/profile' || pathname === '/select-link') {
    const authToken = request.cookies.get('authToken')?.value
    
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // 简单的token检查，详细的用户状态检查由前端页面处理
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/profile', '/select-link']
}