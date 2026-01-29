'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, MapPin, User, Building2 } from 'lucide-react';
import { Branch } from '@/services/branch.api';
import { uploadApi } from '@/services/upload.api';

const branchSchema = z.object({
  name: z.string().min(1, 'Tên khu trọ không được để trống'),
  address: z.string().min(1, 'Địa chỉ không được để trống'),
  manager: z.string().min(1, 'Tên quản lý không được để trống'),
});

type BranchFormValues = z.infer<typeof branchSchema>;

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>; 
  initialData?: Branch | null;
}

export default function BranchModal({ isOpen, onClose, onSubmit, initialData }: BranchModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('name', initialData.name);
        setValue('address', initialData.address);
        setValue('manager', initialData.manager || '');
        setPreviewImage(initialData.image || null);
      } else {
        reset({ name: '', address: '', manager: '' });
        setPreviewImage(null);
      }
      setSelectedFile(null);
    }
  }, [isOpen, initialData, reset, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const onFormSubmit = async (data: BranchFormValues) => {
    setIsSubmitting(true);
    try {
      let imageUrl = initialData?.image || '';

      if (selectedFile) {
        const uploadRes = await uploadApi.upload(selectedFile, 'branches');
        // Đồng bộ key trả về từ Cloudinary/Server
        imageUrl = uploadRes.url || uploadRes.secure_url || uploadRes.data?.url || uploadRes; 
      }

      const payload = {
        ...data,
        image: imageUrl,
      };
      
      await onSubmit(payload);
      onClose();
    } catch (error) {
      alert('Lỗi khi xử lý dữ liệu chi nhánh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* Header - Phong cách SmartHouse AI */}
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
              {initialData ? 'Cập nhật Cơ sở' : 'Khởi tạo Cơ sở mới'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Hệ thống mở rộng chuỗi nhà trọ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6">
          
          {/* Ảnh Cover với thiết kế bo góc lớn */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <UploadCloud size={14} className="text-blue-500" /> Hình ảnh nhận diện cơ sở
            </label>
            <div className="relative h-44 w-full rounded-[2rem] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500 transition-all cursor-pointer group shadow-inner">
               {previewImage ? (
                 <img src={previewImage} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
               ) : (
                 <div className="text-center p-4">
                   <UploadCloud className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải ảnh mặt tiền</p>
                 </div>
               )}
               <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Building2 size={14} className="text-blue-500" /> Tên gọi cơ sở
              </label>
              <input 
                {...register('name')}
                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                placeholder="VÍ DỤ: SMARTHOUSE CẦU GIẤY"
              />
              {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <MapPin size={14} className="text-emerald-500" /> Địa chỉ chính xác
              </label>
              <input 
                {...register('address')}
                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                placeholder="SỐ NHÀ, TÊN ĐƯỜNG, QUẬN/HUYỆN..."
              />
              {errors.address && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.address.message}</p>}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <User size={14} className="text-violet-500" /> Quản lý chi nhánh
              </label>
              <input 
                {...register('manager')}
                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" 
                placeholder="TÊN NGƯỜI CHỊU TRÁCH NHIỆM"
              />
              {errors.manager && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.manager.message}</p>}
            </div>
          </div>

          {/* Footer Actions */}
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
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {initialData ? 'Lưu thay đổi' : 'Tạo cơ sở mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}