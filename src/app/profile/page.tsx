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
  EyeOff
} from 'lucide-react';

import Sidebar from '@/components/shared/Sidebar';
import { userApi, User } from '@/services/user.api';
import { uploadApi } from '@/services/upload.api';

// Schema Validate
const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  // Mật khẩu là tùy chọn (nếu nhập thì validate min 6, không nhập thì thôi)
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "Mật khẩu mới phải từ 6 ký tự trở lên"
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Xử lý ảnh đại diện
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Ẩn/Hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });

  // 1. Tải thông tin Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const userData = await userApi.getProfile();
      setUser(userData);
      
      // Fill dữ liệu vào form
      setAvatarPreview(userData.avatar || null);
      reset({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        password: '', // Mật khẩu luôn để trống ban đầu
      });
    } catch (error) {
      console.error(error);
      alert('Không thể tải thông tin tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Xử lý chọn ảnh
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // 2. Submit cập nhật
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      let avatarUrl = user.avatar;

      // Bước 1: Upload ảnh nếu có chọn file mới
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'avatars');
        // Logic lấy URL giống bài trước
        if (typeof res === 'string') avatarUrl = res;
        else if (res?.secure_url) avatarUrl = res.secure_url;
        else if (res?.url) avatarUrl = res.url;
        else if (res?.data?.url) avatarUrl = res.data.url;
      }

      // Bước 2: Chuẩn bị Payload
      const payload: any = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        avatar: avatarUrl,
        role: user.role, // Giữ nguyên role cũ
      };

      // Chỉ gửi password nếu người dùng có nhập
      if (data.password && data.password.trim() !== '') {
        payload.password = data.password;
      }

      console.log('Payload Update:', payload);

      // Bước 3: Gọi API cập nhật
      await userApi.update(user.id, payload);
      
      alert('Cập nhật hồ sơ thành công!');
      fetchProfile(); // Refresh lại data
      
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.';
      alert(`Thất bại: ${msg}`);
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
        
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Thông tin tài khoản</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: Avatar & Thông tin cơ bản */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center h-full">
              
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <UserIcon size={64} />
                    </div>
                  )}
                </div>
                
                {/* Nút upload ảnh đè lên */}
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg border-2 border-white transition-transform transform hover:scale-110">
                  <Camera size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
              <p className="text-slate-500 text-sm mb-4">{user?.email}</p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wide">
                <ShieldCheck size={14} />
                {user?.role}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Form chỉnh sửa */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center gap-2 border-b pb-4">
                <UserIcon size={20} className="text-blue-600"/> Chỉnh sửa thông tin
              </h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      {...register('fullName')} 
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-slate-300" 
                      placeholder="Nhập họ tên..."
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input 
                        {...register('email')} 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-slate-300" 
                        placeholder="example@gmail.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                      <input 
                        {...register('phone')} 
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-slate-300" 
                        placeholder="0912..."
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <hr className="border-slate-100 my-2" />

                {/* Mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Đổi mật khẩu <span className="text-slate-400 font-normal">(Bỏ trống nếu không muốn đổi)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      {...register('password')} 
                      className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none border-slate-300" 
                      placeholder="Nhập mật khẩu mới..."
                      autoComplete="new-password"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div className="pt-4 flex justify-end">
                   <button 
                     type="submit" 
                     disabled={isSaving}
                     className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-70"
                   >
                     {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                     Lưu thay đổi
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