'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Loader2, 
  Save, 
  ShieldCheck,
  Eye,
  EyeOff,
  Building2 // Thêm icon tòa nhà
} from 'lucide-react';

import Sidebar from '@/components/shared/Sidebar';
import { userApi, User } from '@/services/user.api';
import { uploadApi } from '@/services/upload.api';
import { branchApi, Branch } from '@/services/branch.api'; // Thêm API branch

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null); // State lưu chi nhánh
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
      
      // Nếu user thuộc một chi nhánh, lấy thông tin chi nhánh đó
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

  useEffect(() => {
    fetchProfile();
  }, []);

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
        branchId: user.branchId, // Giữ nguyên branchId hiện tại
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
    <div className="flex min-h-screen bg-slate-50 items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <h1 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter italic">Cài đặt cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: Hồ sơ & Chi nhánh */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 flex flex-col items-center text-center">
              
              <div className="relative group mb-6">
                <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-50">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-100">
                      <UserIcon size={80} />
                    </div>
                  )}
                </div>
                
                <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-3 rounded-2xl cursor-pointer hover:bg-blue-600 shadow-xl border-4 border-white transition-all transform hover:scale-110">
                  <Camera size={20} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{user?.fullName}</h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 mb-6">{user?.email}</p>

              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-blue-50 text-blue-700 text-[10px] font-black border-2 border-blue-100 uppercase tracking-widest">
                  <ShieldCheck size={16} /> {user?.role}
                </div>
                
                {/* HIỂN THỊ CHI NHÁNH */}
                {branch && (
                  <div className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                    <Building2 size={16} className="text-blue-400" /> {branch.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Form chỉnh sửa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-[0.2em] mb-10 flex items-center gap-3 border-b border-slate-50 pb-6">
                <UserIcon size={20} className="text-blue-600"/> Hiệu chỉnh hồ sơ AI
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Họ và tên định danh</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-3.5 text-slate-300" size={18} />
                      <input 
                        {...register('fullName')} 
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold uppercase tracking-tight" 
                      />
                    </div>
                    {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Số điện thoại liên lạc</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 text-slate-300" size={18} />
                      <input 
                        {...register('phone')} 
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold" 
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ Email xác thực</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-300" size={18} />
                    <input 
                      {...register('email')} 
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold" 
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.email.message}</p>}
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Mật khẩu truy cập <span className="text-blue-500 lowercase">(Bỏ trống nếu không thay đổi)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-300" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      {...register('password')} 
                      className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold"
                      autoComplete="new-password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.password.message}</p>}
                </div>

                <div className="pt-6 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={isSaving}
                     className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95"
                   >
                     {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                     Lưu thông tin hồ sơ
                   </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}