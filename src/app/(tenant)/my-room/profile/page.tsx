'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User as UserIcon, Mail, Phone, Lock, Camera, Loader2, Save, 
  ShieldCheck, Eye, EyeOff, Building2, Fingerprint 
} from 'lucide-react';

import { userApi, User } from '@/services/user.api';
import { uploadApi } from '@/services/upload.api';
import { branchApi, Branch } from '@/services/branch.api';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs

// Schema Validate
const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "Mật khẩu mới phải từ 6 ký tự trở lên"
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function TenantProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await userApi.getProfile();
      setUser(userData);
      
      if (userData.branchId) {
        const branchData = await branchApi.getDetail(userData.branchId);
        setBranch(branchData);
      }
      
      setAvatarPreview(userData.avatar || null);
      reset({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: '',
      });
    } catch (error) {
      console.error("Lỗi tải profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);
    try {
      let avatarUrl = user.avatar;
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'avatars');
        if (typeof res === 'string') avatarUrl = res;
        else if (res?.url) avatarUrl = res.url;
      }

      const payload: any = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        avatar: avatarUrl,
        role: user.role,
        branchId: user.branchId,
      };

      if (data.password && data.password.trim() !== '') {
        payload.password = data.password;
      }

      await userApi.update(user.id, payload);
      alert('Cập nhật hồ sơ thành công!');
      fetchProfile();
    } catch (error: any) {
      alert('Lỗi khi cập nhật hồ sơ.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải hồ sơ cư dân...</p>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto selection:bg-blue-100">
      
      {/* TÍCH HỢP BREADCRUMBS */}
      <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'My Room', href: '/my-room' },
            { label: 'Hồ sơ cá nhân' }
          ]} 
        />
      </div>

      <div className="mb-10 flex items-center gap-3">
        <div className="w-2 h-10 bg-blue-600 rounded-full" />
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Cài đặt tài khoản</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: Avatar & Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative group mb-8">
              <div className="w-44 h-44 rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-2xl bg-slate-100 relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-100"><UserIcon size={80} /></div>
                )}
                {/* Overlay khi hover vào avatar */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <p className="text-[8px] font-black text-white uppercase tracking-widest">Thay đổi ảnh</p>
                </div>
              </div>
              <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-3.5 rounded-2xl cursor-pointer hover:bg-slate-900 shadow-xl border-4 border-white transition-all transform hover:rotate-12 active:scale-90">
                <Camera size={20} />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{user?.fullName}</h2>
            <p className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mt-3 mb-8">{user?.email}</p>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 text-slate-500 text-[9px] font-black border border-slate-100 uppercase tracking-[0.2em]">
                <ShieldCheck size={14} className="text-blue-500" /> Vai trò: {user?.role}
              </div>
              {branch && (
                <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200">
                  <Building2 size={14} className="text-blue-400" /> {branch.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Form hiệu chỉnh */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 md:p-14 relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
            
            <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.3em] mb-12 flex items-center gap-3 border-b border-slate-50 pb-8">
              <Fingerprint size={20} className="text-blue-600"/> Thông tin định danh cư dân
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và tên cư dân</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input {...register('fullName')} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold uppercase tracking-tight" />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại liên lạc</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input {...register('phone')} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold" />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Địa chỉ thư điện tử</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input {...register('email')} className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold" />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.email.message}</p>}
              </div>

              <div className="pt-10 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Bảo mật tài khoản <span className="text-blue-500 lowercase opacity-50 font-medium">(Chỉ nhập nếu muốn đổi mật khẩu mới)</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      {...register('password')} 
                      className="w-full pl-12 pr-14 py-4 bg-slate-50 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold"
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.password.message}</p>}
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                 <button type="submit" disabled={isSaving} className="bg-slate-900 text-white px-12 py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 shadow-2xl shadow-blue-200/50 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95 group">
                   {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} className="group-hover:rotate-12 transition-transform" />} Cập nhật hồ sơ
                 </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}