'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud } from 'lucide-react';
import { Branch } from '@/services/branch.api';
import { uploadApi } from '@/services/upload.api';

// Schema validate dữ liệu
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

  // Reset form khi mở modal hoặc thay đổi chế độ (Thêm/Sửa)
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('name', initialData.name);
        setValue('address', initialData.address);
        setValue('manager', initialData.manager);
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
      setPreviewImage(URL.createObjectURL(file)); // Xem trước ảnh
    }
  };

  const onFormSubmit = async (data: BranchFormValues) => {
    setIsSubmitting(true);
    try {
      let imageUrl = initialData?.image || ''; // Mặc định lấy ảnh cũ nếu có

      // 1. Nếu người dùng có chọn file mới -> Upload lên server trước
      if (selectedFile) {
        console.log('Đang upload ảnh...');
        const uploadRes = await uploadApi.upload(selectedFile, 'branches');
        
        // Cần kiểm tra Backend trả về key gì. Ví dụ: res.url, res.path, hay res.secure_url
        imageUrl = uploadRes.url || uploadRes.secure_url || uploadRes.path; 
        console.log('Upload thành công:', imageUrl);
      }

      // 2. Gom dữ liệu thành JSON
      const payload = {
        name: data.name,
        address: data.address,
        manager: data.manager,
        image: imageUrl, // Gửi chuỗi URL
      };
      
      // 3. Gửi JSON xuống component cha
      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Lỗi khi xử lý form:', error);
      alert('Có lỗi xảy ra (Upload ảnh hoặc Lưu dữ liệu). Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Chỉnh sửa Khu trọ' : 'Thêm Khu trọ mới'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          
          {/* Ảnh Cover */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Hình ảnh</label>
            <div className="relative h-40 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500 transition-colors cursor-pointer group">
               {previewImage ? (
                 <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center p-4">
                   <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                   <p className="mt-1 text-xs text-slate-500">Bấm để chọn ảnh</p>
                 </div>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleFileChange}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Tên Khu Trọ</label>
            <input 
              {...register('name')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Ví dụ: Nhà trọ Hạnh Phúc"
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
            <input 
              {...register('address')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Số 123, Đường ABC..."
            />
            {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Người quản lý</label>
            <input 
              {...register('manager')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Nguyễn Văn A"
            />
            {errors.manager && <p className="text-red-500 text-xs">{errors.manager.message}</p>}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}