'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, User, Mail, Phone, Lock } from 'lucide-react';
import { CreateUserDto } from '@/services/user.api';

// Validate
const userSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự'),
});

type UserFormValues = z.infer<typeof userSchema>;

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function TenantModal({ isOpen, onClose, onSubmit }: TenantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any, // Dùng as any để tránh lỗi type conflict
  });

  useEffect(() => {
    if (isOpen) {
      reset({ fullName: '', email: '', phone: '', password: '' });
    }
  }, [isOpen, reset]);

  const onFormSubmit: SubmitHandler<UserFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // Mặc định tạo user có role là TENANT
      await onSubmit({ ...data, role: 'TENANT' });
      onClose();
    } catch (error) {
      alert('Lỗi khi tạo cư dân');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Thêm Cư dân mới</h2>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
            <div className="relative">
               <User className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input {...register('fullName')} className="w-full pl-10 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nguyễn Văn A" />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="relative">
               <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input {...register('email')} className="w-full pl-10 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="user@example.com" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
            <div className="relative">
               <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input {...register('phone')} className="w-full pl-10 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0912345678" />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu khởi tạo</label>
            <div className="relative">
               <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input type="password" {...register('password')} className="w-full pl-10 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="******" />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2">
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              Tạo tài khoản
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}