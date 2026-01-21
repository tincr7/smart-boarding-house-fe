'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form'; // Thêm SubmitHandler
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud } from 'lucide-react';
import { CreateRoomDto, Room } from '@/services/room.api';
import { uploadApi } from '@/services/upload.api';

// Validate
const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Tên phòng không được để trống'),
  price: z.coerce.number().min(0, 'Giá tiền phải lớn hơn 0'),
  area: z.coerce.number().min(0, 'Diện tích phải lớn hơn 0'),
});

// Xuất kiểu dữ liệu từ Schema
type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  branchId: number; 
  initialData?: Room | null; 
}

export default function RoomModal({ isOpen, onClose, onSubmit, branchId, initialData }: RoomModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // SỬA 1: Khai báo Generic <RoomFormValues> cho useForm
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors } 
  } = useForm<RoomFormValues>({
    // SỬA 2: Thêm 'as any' để fix lỗi type resolver
    resolver: zodResolver(roomSchema) as any,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('roomNumber', initialData.roomNumber);
        setValue('price', Number(initialData.price));
        setValue('area', initialData.area);
        setPreviewImage(initialData.image || null);
      } else {
        reset({ roomNumber: '', price: 0, area: 0 });
        setPreviewImage(null);
      }
      setSelectedFile(null);
    }
  }, [isOpen, initialData, reset, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  // SỬA 3: Định nghĩa kiểu SubmitHandler rõ ràng
  const onFormSubmit: SubmitHandler<RoomFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      let imageUrl = initialData?.image || '';

      // 1. Upload ảnh nếu có
      if (selectedFile) {
        const uploadRes = await uploadApi.upload(selectedFile, 'rooms');
        imageUrl = uploadRes.url || uploadRes.secure_url || uploadRes.path; 
      }

      // 2. Tạo payload JSON
      const payload: CreateRoomDto = {
        roomNumber: data.roomNumber,
        price: data.price,
        area: data.area,
        image: imageUrl,
        branchId: branchId,
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi lưu phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Cập nhật Phòng' : 'Thêm Phòng Mới'}
          </h2>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        {/* Form đã được gắn handleSubmit đúng kiểu */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-4">
          
          {/* Upload Ảnh */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hình ảnh phòng</label>
            <div className="relative h-40 w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500 transition-colors cursor-pointer group">
               {previewImage ? (
                 <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="text-center p-4">
                   <UploadCloud className="mx-auto h-8 w-8 text-slate-400" />
                   <p className="mt-1 text-xs text-slate-500">Bấm để chọn ảnh</p>
                 </div>
               )}
               <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Số phòng / Tên phòng</label>
            <input {...register('roomNumber')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ví dụ: P101" />
            {errors.roomNumber && <p className="text-red-500 text-xs">{errors.roomNumber.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Giá thuê (VNĐ)</label>
              <input type="number" {...register('price')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.price && <p className="text-red-500 text-xs">{errors.price.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Diện tích (m²)</label>
              <input type="number" {...register('area')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              {errors.area && <p className="text-red-500 text-xs">{errors.area.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2">
              {isSubmitting && <Loader2 className="animate-spin" size={18} />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}