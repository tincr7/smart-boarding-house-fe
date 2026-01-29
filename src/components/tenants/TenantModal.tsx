'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, User, Mail, Phone, Lock, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // MỚI: Dùng AuthContext để lấy branchId

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
  const { user: currentUser } = useAuth(); // Lấy thông tin Admin hiện tại
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
  });

  useEffect(() => {
    if (isOpen) {
      reset({ fullName: '', email: '', phone: '', password: '' });
    }
  }, [isOpen, reset]);

  const onFormSubmit: SubmitHandler<UserFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // ĐA CHI NHÁNH: Tự động đính kèm branchId của Admin vào hồ sơ cư dân mới
      const payload = { 
        ...data, 
        role: 'TENANT',
        branchId: currentUser?.branchId || undefined 
      };
      
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Lỗi khi tạo cư dân:", error);
      alert('Lỗi khi tạo cư dân. Vui lòng kiểm tra email/SĐT có bị trùng lặp không.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* Header - Phong cách SmartHouse AI */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Đăng ký Cư dân</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
              <Building2 size={12} className="text-blue-500" />
              {currentUser?.branchId ? `Cấp hồ sơ cho chi nhánh ${currentUser.branchId}` : 'Khởi tạo cư dân hệ thống'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Họ và tên định danh</label>
              <div className="relative">
                 <User className="absolute left-4 top-3.5 text-slate-300" size={18} />
                 <input 
                  {...register('fullName')} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="NGUYỄN VĂN A" 
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ Email xác thực</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
                 <input 
                  {...register('email')} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="USER@EXAMPLE.COM" 
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số điện thoại liên lạc</label>
              <div className="relative">
                 <Phone className="absolute left-4 top-3.5 text-slate-300" size={18} />
                 <input 
                  {...register('phone')} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="0912345678" 
                />
              </div>
              {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mật khẩu truy cập AI</label>
              <div className="relative">
                 <Lock className="absolute left-4 top-3.5 text-slate-300" size={18} />
                 <input 
                  type="password" 
                  {...register('password')} 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                  placeholder="******" 
                />
              </div>
              {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.password.message}</p>}
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
              Tạo hồ sơ cư dân
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}