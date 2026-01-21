import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Danh sách các trang đặc biệt
  const authPaths = ['/login', '/register']; // Trang dành cho khách
  const publicPaths = ['/'];                 // Trang công khai (Landing page)

  // Kiểm tra xem trang hiện tại thuộc nhóm nào
  const isAuthPath = authPaths.includes(pathname);
  const isPublicPath = publicPaths.includes(pathname);
  
  // Biến lưu kết quả điều hướng
  let response = NextResponse.next();

  // --- LOGIC ĐIỀU HƯỚNG ---

  // TRƯỜNG HỢP 1: Đã đăng nhập (Có Token)
  if (token) {
    // Nếu cố vào Login/Register -> Đá sang Dashboard
    if (isAuthPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  } 
  
  // TRƯỜNG HỢP 2: Chưa đăng nhập (Không Token)
  else {
    // Nếu không phải trang Auth và không phải trang Public -> Đá về Login
    // (Tức là đang cố vào Dashboard, Rooms... mà chưa login)
    if (!isAuthPath && !isPublicPath) {
      const loginUrl = new URL('/login', request.url);
      // (Tuỳ chọn) Lưu lại trang đang muốn vào để login xong redirect ngược lại
      // loginUrl.searchParams.set('callbackUrl', pathname); 
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- LOGIC CHẶN CACHE (FIX LỖI BẤM NÚT BACK) ---
  // Thêm Headers để báo trình duyệt KHÔNG ĐƯỢC LƯU nội dung trang này
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}

// Cấu hình matcher: Chạy trên tất cả routes trừ file tĩnh
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};