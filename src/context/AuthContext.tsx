'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchProfile = async () => {
    const token = Cookies.get('access_token');
    // TRƯỜNG HỢP: KHÔNG CÓ TOKEN (KHÁCH VÃNG LAI)
    if (!token) {
      setLoading(false);
      
      // --- SỬA ĐOẠN NÀY ---
      // Định nghĩa các trang "Công khai" ai cũng vào được
      const publicPaths = ['/', '/login', '/register'];
      
      // Nếu trang hiện tại KHÔNG nằm trong danh sách công khai thì mới bắt đăng nhập
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
      // --------------------
      return;
    }

    // TRƯỜNG HỢP: CÓ TOKEN (ĐÃ ĐĂNG NHẬP)
    try {
      const userData = await userApi.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Token lỗi:', error);
      Cookies.remove('access_token');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const logout = () => {
    Cookies.remove('access_token');
    setUser(null);
    router.push('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  // Chặn truy cập trang Dashboard và Tenants nếu là TENANT
  useEffect(() => {
    if (!loading && user && user.role === 'TENANT') {
      const restrictedPaths = ['/dashboard', '/tenants'];
      if (restrictedPaths.some(path => pathname.startsWith(path))) {
        router.push('/rooms'); // Chuyển hướng Tenant về trang phòng
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);