'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, User, Mail, Phone, Building2, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { branchApi, Branch } from '@/services/branch.api'; 

// Validate: Tối giản hóa thông tin, tập trung vào định danh liên lạc
const userSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  branchId: z.any().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface TenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export default function TenantModal({ isOpen, onClose, onSubmit }: TenantModalProps) {
  const { user: currentUser } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
  });

  // Tải danh sách chi nhánh để Admin lựa chọn cơ sở cho cư dân
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchApi.getAll();
        setBranches(data);
      } catch (error) {
        console.error("Lỗi tải chi nhánh:", error);
      }
    };
    if (isOpen) {
      fetchBranches();
      reset({ fullName: '', email: '', phone: '', branchId: currentUser?.branchId || '' });
    }
  }, [isOpen, reset, currentUser]);
const onFormSubmit: SubmitHandler<UserFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      // Chuẩn hóa dữ liệu trước khi gửi
      const payload = { 
        fullName: data.fullName.toUpperCase().trim(), // Vẫn in hoa tên cho trang trọng
        email: data.email.toLowerCase().trim(), // Luôn viết thường email để dứt điểm lỗi trùng lặp
        phone: data.phone.trim(),
        role: 'TENANT',
        password: 'smarthouse@123', 
        // Xử lý branchId chặt chẽ hơn
        branchId: data.branchId && data.branchId !== "" 
          ? Number(data.branchId) 
          : (currentUser?.branchId ? Number(currentUser.branchId) : undefined)
      };
      
      await onSubmit(payload);
      reset(); // Reset form thành công
      onClose();
    } catch (error: any) {
      // Hiển thị lỗi chi tiết từ Backend nếu có
      const message = error.response?.data?.message || 'Thông tin định danh (Email/CCCD) đã tồn tại trong thùng rác hoặc danh sách đang hoạt động.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
        
        {/* Header - Phong cách SmartHouse Identity */}
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
               <ShieldCheck size={14} /> Security Registry
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Cấp hồ sơ cư dân</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all">
            <X size={24} className="text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-10 space-y-8">
          
          <div className="space-y-5">
            {/* Bộ chọn chi nhánh: Chỉ dành cho Super Admin, Admin cơ sở bị khóa */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Cơ sở vận hành</label>
              <div className="relative">
                 <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                 <select 
                  {...register('branchId')}
                  disabled={!!currentUser?.branchId}
                  className="w-full pl-14 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Chọn chi nhánh lưu trú</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Họ tên: Giữ nguyên uppercase để định danh trông trang trọng hơn */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Họ tên định danh</label>
              <div className="relative">
                 <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                 <input 
                  {...register('fullName')} 
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black uppercase outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" 
                  placeholder="NGUYỄN VĂN A" 
                />
              </div>
              {errors.fullName && <p className="text-red-500 text-[10px] font-black mt-2 uppercase italic">{errors.fullName.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5">
               {/* Email: Đã xóa class 'uppercase' để tránh lỗi Caps Lock */}
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Địa chỉ Email</label>
                  <div className="relative">
                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                     <input 
                        {...register('email')} 
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" 
                        placeholder="email@example.com" 
                     />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] font-black mt-2 italic">{errors.email.message}</p>}
               </div>

               {/* Số điện thoại: Đã xóa placeholder viết hoa để đồng bộ UI */}
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic px-1">Số điện thoại</label>
                  <div className="relative">
                     <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                     <input 
                        {...register('phone')} 
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[11px] font-black outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner" 
                        placeholder="0912 345 678" 
                     />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] font-black mt-2 italic">{errors.phone.message}</p>}
               </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-5 border-t border-slate-50">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-4 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 shadow-2xl shadow-blue-100 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} />}
              Khởi tạo hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}