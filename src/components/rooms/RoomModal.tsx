'use client';

// 1. NHÓM IMPORTS (Thư viện trước, local sau)
import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Video, CheckCircle2 } from 'lucide-react';

// Import Services/Types nội bộ
import { CreateRoomDto, Room } from '@/services/room.api';
import { uploadApi } from '@/services/upload.api';

// 2. NHÓM TYPES & INTERFACES
interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  branchId: number; 
  initialData?: Room | null; 
}

// 3. NHÓM SCHEMA & CONSTANTS (Đặt ngoài component để tối ưu bộ nhớ)
const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Tên phòng không được để trống'),
  price: z.coerce.number().min(0, 'Giá tiền phải lớn hơn 0'),
  area: z.coerce.number().min(0, 'Diện tích phải lớn hơn 0'),
  description: z.string().optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

const UTILITY_OPTIONS = [
  'Điều hòa', 'Máy giặt', 'Tủ lạnh', 'Wifi', 
  'Nóng lạnh', 'Ban công', 'Bếp riêng', 'Giường nệm'
];

// 4. MAIN COMPONENT
export default function RoomModal({ isOpen, onClose, onSubmit, branchId, initialData }: RoomModalProps) {
  // --- States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);

  // --- Form Hook ---
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema) as any,
  });

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setValue('roomNumber', initialData.roomNumber);
        setValue('price', Number(initialData.price));
        setValue('area', initialData.area || 0);
        setValue('description', (initialData as any).description || '');
        setPreviewImage(initialData.image || null);
        setSelectedUtilities((initialData as any).utilities || []);
      } else {
        reset({ roomNumber: '', price: 0, area: 0, description: '' });
        setPreviewImage(null);
        setSelectedUtilities([]);
      }
      setSelectedFile(null);
      setSelectedVideo(null);
    }
  }, [isOpen, initialData, reset, setValue]);

  // --- Handlers ---
  const toggleUtility = (utility: string) => {
    setSelectedUtilities(prev => 
      prev.includes(utility) ? prev.filter(u => u !== utility) : [...prev, utility]
    );
  };

  const onFormSubmit: SubmitHandler<RoomFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      let imageUrl = initialData?.image || '';
      let videoUrl = (initialData as any)?.video || '';

      // Upload Media song song để tăng tốc độ demo
      const uploadTasks = [];
      if (selectedFile) {
        uploadTasks.push(uploadApi.upload(selectedFile, 'rooms').then(res => imageUrl = res.url || res.secure_url));
      }
      if (selectedVideo) {
        uploadTasks.push(uploadApi.upload(selectedVideo, 'videos').then(res => videoUrl = res.url || res.secure_url));
      }
      
      await Promise.all(uploadTasks);

      const payload: any = {
        ...data,
        image: imageUrl,
        video: videoUrl,
        utilities: selectedUtilities,
        branchId: branchId,
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Lỗi khi lưu thông tin phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render ---
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden my-auto border border-slate-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {initialData ? 'Cấu hình Phòng' : 'Khởi tạo Phòng Mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Nội dung form giữ nguyên như cũ của Giang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ảnh đại diện</label>
              <div className="relative h-40 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500 transition-all cursor-pointer">
                 {previewImage ? <img src={previewImage} className="w-full h-full object-cover" /> : <UploadCloud size={32} className="text-slate-300" />}
                 <input type="file" accept="image/*" onChange={(e) => {
                    if(e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                      setPreviewImage(URL.createObjectURL(e.target.files[0]));
                    }
                 }} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Video giới thiệu</label>
              <div className="relative h-40 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center hover:border-emerald-500 transition-all cursor-pointer">
                 {selectedVideo || (initialData as any)?.video ? (
                    <div className="text-center p-4">
                       <Video className="mx-auto text-emerald-500 mb-2" size={32} />
                       <p className="text-[10px] font-bold text-emerald-600 truncate max-w-[150px] uppercase">
                          {selectedVideo ? selectedVideo.name : 'Đã có video'}
                       </p>
                    </div>
                 ) : <Video size={32} className="text-slate-300" />}
                 <input type="file" accept="video/*" onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase">Số phòng</label>
              <input {...register('roomNumber')} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none font-bold shadow-inner" />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Giá thuê</label>
                  <input type="number" {...register('price')} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none font-bold shadow-inner" />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">m²</label>
                  <input type="number" {...register('area')} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none font-bold shadow-inner" />
               </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Tiện ích căn phòng</label>
            <div className="flex flex-wrap gap-2">
              {UTILITY_OPTIONS.map(util => (
                <button 
                  key={util} type="button" onClick={() => toggleUtility(util)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                    selectedUtilities.includes(util) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'
                  }`}
                >
                  {util}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Mô tả chi tiết</label>
            <textarea {...register('description')} rows={3} className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none font-medium text-sm shadow-inner" placeholder="Mô tả các tiện nghi khác..."></textarea>
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest transition-colors">Hủy bỏ</button>
            <button type="submit" disabled={isSubmitting} className="px-10 py-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-30">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Lưu thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}