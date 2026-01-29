import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Định nghĩa các nhóm route
  const authPaths = ['/login', '/register'];
  const publicPaths = ['/'];
  
  const isAuthPath = authPaths.includes(pathname);
  const isPublicPath = publicPaths.includes(pathname);
  
  // --- LOGIC ĐIỀU HƯỚNG ---

  // TRƯỜNG HỢP 1: Đã đăng nhập (Có Token)
  if (token) {
    // Nếu cố vào trang Login/Register thì chuyển thẳng vào Dashboard
    if (isAuthPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  
  // TRƯỜNG HỢP 2: Chưa đăng nhập (Không Token)
  else {
    // Nếu cố vào các trang bảo mật (không phải Auth/Public) -> Chuyển về Login
    if (!isAuthPath && !isPublicPath) {
      const loginUrl = new URL('/login', request.url);
      // Lưu lại trang đang truy cập dở để sau khi login xong sẽ quay lại đúng trang đó
      loginUrl.searchParams.set('callbackUrl', pathname); 
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- THIẾT LẬP RESPONSE & BẢO MẬT ---
  const response = NextResponse.next();

  // Chặn Cache triệt để: Đảm bảo khi Admin logout, cư dân không thể bấm Back để xem lại dữ liệu cũ
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

// Matcher: Kiểm soát toàn bộ route trừ các tài nguyên tĩnh
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (thư mục ảnh nếu bạn để trong public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};