'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { userApi, User } from '@/services/user.api'; // Sử dụng trực tiếp interface User
import { Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null; // Không dùng ExtendedUser nữa
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
    
    // 1. TRƯỜNG HỢP: KHÔNG CÓ TOKEN
    if (!token) {
      setLoading(false);
      const publicPaths = ['/', '/login', '/register'];
      if (!publicPaths.includes(pathname)) {
        router.push('/login');
      }
      return;
    }

    // 2. TRƯỜNG HỢP: CÓ TOKEN
    try {
      const userData = await userApi.getProfile();
      setUser(userData);
      
      // Lưu branchId vào sessionStorage để sử dụng cho các mục đích khác nếu cần
      if (userData.branchId) {
        sessionStorage.setItem('managed_branch_id', userData.branchId.toString());
      } else {
        sessionStorage.removeItem('managed_branch_id');
      }
    } catch (error) {
      console.error('Lỗi xác thực Profile:', error);
      Cookies.remove('access_token');
      sessionStorage.removeItem('managed_branch_id');
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
    sessionStorage.removeItem('managed_branch_id');
    setUser(null);
    router.push('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  // 3. PHÂN QUYỀN TRUY CẬP
  useEffect(() => {
    if (!loading && user && user.role === 'TENANT') {
      const restrictedPaths = ['/dashboard', '/tenants'];
      if (restrictedPaths.some(path => pathname.startsWith(path))) {
        router.push('/rooms'); 
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40}/>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);