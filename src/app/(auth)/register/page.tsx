'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { authApi } from '@/services/auth.api';

const registerSchema = z.object({
  email: z.string().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải tối thiểu 6 ký tự' }),
  fullName: z.string().min(2, { message: 'Họ tên phải tối thiểu 2 ký tự' }),
  phone: z.string().optional(),
  identityCard: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    // 1. Thêm defaultValues để tránh lỗi input bị undefined lúc đầu
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      identityCard: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await authApi.register(data);
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Tạo tài khoản mới</h2>
          <p className="mt-1 text-sm text-slate-600">Smart Boarding House</p>
        </div>

        {serverError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Họ tên */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register('fullName')}
              // 2. Thêm text-gray-900 và bg-white vào đây
              className={`mt-1 block w-full px-3 py-2 border rounded-lg outline-none text-gray-900 bg-white ${
                errors.fullName 
                ? 'border-red-500' 
                : 'border-slate-300 focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500'
              }`}
              placeholder="Nguyễn Văn A"
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              {...register('email')}
              // 2. Thêm text-gray-900 và bg-white vào đây
              className={`mt-1 block w-full px-3 py-2 border rounded-lg outline-none text-gray-900 bg-white ${
                errors.email 
                ? 'border-red-500' 
                : 'border-slate-300 focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500'
              }`}
              placeholder="user@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Mật khẩu <span className="text-red-500">*</span></label>
            <input
              type="password"
              {...register('password')}
              // 2. Thêm text-gray-900 và bg-white vào đây
              className={`mt-1 block w-full px-3 py-2 border rounded-lg outline-none text-gray-900 bg-white ${
                errors.password 
                ? 'border-red-500' 
                : 'border-slate-300 focus:border-blue-500 ring-1 ring-transparent focus:ring-blue-500'
              }`}
              placeholder="••••••"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          {/* Grid 2 cột cho SĐT và CCCD */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Số điện thoại</label>
              <input
                type="text"
                {...register('phone')}
                // 2. Thêm text-gray-900 và bg-white vào đây
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="0912..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">CCCD/CMND</label>
              <input
                type="text"
                {...register('identityCard')}
                // 2. Thêm text-gray-900 và bg-white vào đây
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-gray-900 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="0010..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2.5 px-4 mt-6 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span className="flex items-center gap-2">
                Đăng ký ngay <UserPlus size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}