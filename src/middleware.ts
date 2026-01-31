import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  const isDashboardPath = pathname.startsWith('/dashboard');
  const isMyRoomPath = pathname.startsWith('/my-room');
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/register');

  // 1. Nếu đã LOGIN mà cố vào trang Login/Register -> Đẩy về trang chủ Public
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Nếu CHƯA LOGIN mà đòi vào khu vực riêng tư -> Đẩy đi Login
  if (!token && (isDashboardPath || isMyRoomPath)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname); 
    return NextResponse.redirect(loginUrl);
  }

  // 3. Thiết lập Header bảo mật (Chống Cache trang nhạy cảm)
  const response = NextResponse.next();
  if (isDashboardPath || isMyRoomPath) {
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn trừ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, assets (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)',
  ],
};