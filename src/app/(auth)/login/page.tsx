'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { authApi } from '@/services/auth.api';
import { useAuth } from '@/context/AuthContext';

// Schema validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(1, { message: 'Vui lòng nhập mật khẩu' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null); // Xóa lỗi cũ nếu có
    try {
      // 1. Gọi API đăng nhập (Token được lưu vào Cookie trong hàm authApi.login)
      await authApi.login(data);
      
      // 2. Lấy thông tin User để kiểm tra Role
      // (Lúc này axios interceptor đã tự động gắn token từ cookie vào header)
      const currentUser = await authApi.getProfile(); 
      
      // 3. Cập nhật AuthContext toàn cục ngay lập tức
      await refreshProfile(); 
      
      // 4. Phân quyền chuyển hướng
      if (currentUser.role === 'ADMIN') {
        router.replace('/dashboard'); // Dùng replace để không back lại được
      } else {
        router.replace('/rooms');     // Tenant vào thẳng trang phòng
      }
      
    } catch (error: any) {
      console.error("Login Error:", error);
      
      // Lấy thông báo lỗi từ Backend trả về (nếu có)
      const msg = error?.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.';
      
      // Hiển thị lỗi ra màn hình (xử lý trường hợp message là mảng hoặc chuỗi)
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            Smart Boarding House
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Đăng nhập để quản lý hệ thống
          </p>
        </div>

        {/* Hiển thị thông báo lỗi từ Server */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-start gap-2 text-sm animate-pulse">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`block w-full px-3 py-2 border rounded-lg outline-none text-slate-900 bg-white transition-all ${
                  errors.email 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className={`block w-full px-3 py-2 border rounded-lg outline-none text-slate-900 bg-white transition-all ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                placeholder="••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-blue-200"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span className="flex items-center gap-2">
                Đăng nhập <LogIn size={18} />
              </span>
            )}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}