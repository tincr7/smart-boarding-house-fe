'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { userApi, User } from '@/services/user.api';
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => void;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  logout: () => {},
  refreshProfile: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Tính toán quyền Admin
  const isAdmin = useMemo(() => {
    return user?.role?.toUpperCase() === 'ADMIN';
  }, [user]);

  // Hàm Đăng xuất (Đã sửa đổi)
  const logout = () => {
    // 1. Xóa sạch dữ liệu phiên làm việc
    Cookies.remove('access_token'); // Hoặc 'token' tùy vào backend của bạn
    sessionStorage.removeItem('managed_branch_id');
    
    // 2. Reset state
    setUser(null);
    
    // 3. 👇 QUAN TRỌNG: Chuyển về Trang chủ thay vì Login
    router.push('/'); 
    // router.refresh(); // Có thể mở dòng này nếu muốn làm mới lại dữ liệu trang chủ
  };

  const fetchProfile = async () => {
    const token = Cookies.get('access_token');
    
    // Nếu không có token -> Không phải lỗi, chỉ là chưa đăng nhập
    if (!token) {
      setLoading(false);
      // Nếu đang ở trang bảo mật (không phải public) thì mới đá về login
      const publicPaths = ['/', '/login', '/register', '/rooms', '/branches'];
      // Logic: Nếu path hiện tại KHÔNG bắt đầu bằng các path public
      const isPublic = publicPaths.some(path => pathname === path || pathname.startsWith('/rooms') || pathname.startsWith('/branches'));
      
      if (!isPublic) {
        router.push('/login');
      }
      return;
    }

    try {
      const userData = await userApi.getProfile();
      setUser(userData);
      
      // Đồng bộ branchId cho quản lý chi nhánh
      if (userData.branchId) {
        sessionStorage.setItem('managed_branch_id', userData.branchId.toString());
      } else {
        sessionStorage.removeItem('managed_branch_id');
      }
    } catch (error) {
      console.error('Session hết hạn:', error);
      logout(); // Token sai/hết hạn -> Logout về trang chủ
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // PHÂN QUYỀN TRUY CẬP (Middleware Client-side)
  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role?.toUpperCase();
      
      // Nếu là TENANT nhưng cố tình vào trang quản trị Dashboard
      if (userRole === 'TENANT') {
        const restrictedPaths = ['/dashboard'];
        if (restrictedPaths.some(path => pathname.startsWith(path))) {
          router.push('/my-room'); // Đưa về trang cá nhân của họ
        }
      }
      
      // Nếu là ADMIN nhưng vào trang login/register thì đưa vào dashboard
      if (userRole === 'ADMIN' && (pathname === '/login' || pathname === '/register')) {
         router.push('/dashboard');
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40}/>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">SmartHouse AI Verifying...</p>
      </div>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);