'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Calculator, MapPin, Home, AlertCircle } from 'lucide-react';
import { Invoice, CreateInvoiceDto, invoiceApi } from '@/services/invoice.api'; // Thêm invoiceApi để lấy chỉ số cũ
import { roomApi, Room } from '@/services/room.api';
import { uploadApi } from '@/services/upload.api';
import { branchApi, Branch } from '@/services/branch.api';

const PRICE_ELEC = 3500;
const PRICE_WATER = 15000;

// 1. Schema Validation: Chặn số âm và logic chỉ số lùi
const invoiceSchema = z.object({
  branchId: z.coerce.number().optional(), 
  roomId: z.coerce.number().min(1, 'Vui lòng chọn Phòng'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  oldElectricity: z.coerce.number().min(0, 'Không được là số âm'),
  newElectricity: z.coerce.number().min(0, 'Không được là số âm'),
  oldWater: z.coerce.number().min(0, 'Không được là số âm'),
  newWater: z.coerce.number().min(0, 'Không được là số âm'),
  serviceFee: z.coerce.number().min(0, 'Không được là số âm'),
}).refine((data) => data.newElectricity >= data.oldElectricity, {
  message: "Chỉ số điện mới không được nhỏ hơn chỉ số cũ!",
  path: ["newElectricity"],
}).refine((data) => data.newWater >= data.oldWater, {
  message: "Chỉ số nước mới không được nhỏ hơn chỉ số cũ!",
  path: ["newWater"],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Invoice | null;
}

export default function InvoiceModal({ isOpen, onClose, onSubmit, initialData }: InvoiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as any, 
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      serviceFee: 0,
      oldElectricity: 0, newElectricity: 0,
      oldWater: 0, newWater: 0
    }
  });

  const watchAllFields = watch();
  const selectedBranchId = watch('branchId');
  const selectedRoomId = watch('roomId'); // Theo dõi để Auto-fill

  // 2. Tải dữ liệu ban đầu (Chi nhánh & Phòng)
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [allRooms, allBranches] = await Promise.all([roomApi.getAll(), branchApi.getAll()]);
          setRooms(allRooms);
          setBranches(allBranches);

          if (initialData) {
            const currentRoom = allRooms.find(r => r.id === initialData.roomId);
            if (currentRoom) setValue('branchId', currentRoom.branchId);
            setValue('roomId', initialData.roomId);
            setValue('month', initialData.month);
            setValue('year', initialData.year);
            setValue('oldElectricity', initialData.oldElectricity);
            setValue('newElectricity', initialData.newElectricity);
            setValue('oldWater', initialData.oldWater);
            setValue('newWater', initialData.newWater);
            setValue('serviceFee', Number(initialData.serviceFee));
            setPaymentProof(initialData.paymentProof || null);
          } else {
            reset();
            setPaymentProof(null);
          }
        } catch (error) { console.error(error); }
      };
      fetchData();
      setSelectedFile(null);
    }
  }, [isOpen, initialData, reset, setValue]);

  // 3. LOGIC AUTO-FILL CHỈ SỐ CŨ KHI CHỌN PHÒNG
  useEffect(() => {
    const fetchLatestIndexes = async () => {
      if (selectedRoomId && !initialData) {
        try {
          const res = await invoiceApi.getLatestByRoom(Number(selectedRoomId));
          if (res) {
            setValue('oldElectricity', res.newElectricity);
            setValue('oldWater', res.newWater);
            setValue('newElectricity', res.newElectricity); // Mặc định số mới = số cũ
            setValue('newWater', res.newWater);
          }
        } catch (error) { console.log("Phòng mới hoặc chưa có dữ liệu cũ."); }
      }
    };
    fetchLatestIndexes();
  }, [selectedRoomId, initialData, setValue]);

  // 4. Logic lọc phòng theo chi nhánh (Giữ nguyên logic của Giang)
  const filteredRooms = useMemo(() => {
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RENTED');
    if (!selectedBranchId) return [];
    return occupiedRooms.filter(r => r.branchId === Number(selectedBranchId));
  }, [rooms, selectedBranchId]);

  // 5. Tính tiền tự động và hiển thị cảnh báo lỗi logic
  useEffect(() => {
    const { roomId, oldElectricity, newElectricity, oldWater, newWater, serviceFee } = watchAllFields;
    if (newElectricity < oldElectricity || newWater < oldWater) {
      setEstimatedTotal(-1); // Trạng thái lỗi
      return;
    }
    const selectedRoom = rooms.find(r => r.id === Number(roomId));
    const roomPrice = selectedRoom ? Number(selectedRoom.price) : 0;
    const elecCost = (Number(newElectricity || 0) - Number(oldElectricity || 0)) * PRICE_ELEC;
    const waterCost = (Number(newWater || 0) - Number(oldWater || 0)) * PRICE_WATER;
    setEstimatedTotal(roomPrice + elecCost + waterCost + Number(serviceFee || 0));
  }, [watchAllFields, rooms]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setPaymentProof(URL.createObjectURL(e.target.files[0]));
    }
  };

  const onFormSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      let uploadedUrl = initialData?.paymentProof;
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'invoices');
        uploadedUrl = res.url || res.secure_url || res.path;
      }
      const { branchId, ...restData } = data;
      await onSubmit({ ...restData, paymentProof: uploadedUrl });
      onClose();
    } catch (error) { alert('Lỗi khi lưu hóa đơn'); } 
    finally { setIsSubmitting(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-slate-900">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Sửa hóa đơn' : 'Lập hóa đơn tiền phòng'}</h2>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="invoice-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1"><MapPin size={14}/> Chi nhánh</label>
                <select {...register('branchId')} className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Home size={14}/> Phòng thuê</label>
                <select {...register('roomId')} disabled={!selectedBranchId} className="w-full px-3 py-2 border rounded-lg bg-white disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn phòng --</option>
                  {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
                </select>
                {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tháng</label>
                <input type="number" {...register('month')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
                <input type="number" {...register('year')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Chỉ số Điện - Tự động điền và Chặn lỗi */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
               <h3 className="font-bold text-yellow-700 text-sm mb-2 flex items-center gap-2">⚡ Chỉ số Điện ({PRICE_ELEC.toLocaleString()}đ)</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 italic font-medium">Chỉ số cũ</label>
                    <input type="number" min="0" onKeyDown={handleKeyDown} {...register('oldElectricity')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 italic font-bold">Chỉ số mới</label>
                    <input type="number" min="0" onKeyDown={handleKeyDown} {...register('newElectricity')} className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.newElectricity ? 'border-red-500 ring-1 ring-red-500' : 'focus:ring-2 focus:ring-yellow-500'}`} />
                    {errors.newElectricity && <p className="text-red-500 text-[10px] mt-1 italic font-bold">⚠️ {errors.newElectricity.message}</p>}
                  </div>
               </div>
            </div>

            {/* Chỉ số Nước - Tự động điền và Chặn lỗi */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <h3 className="font-bold text-blue-700 text-sm mb-2 flex items-center gap-2">💧 Chỉ số Nước ({PRICE_WATER.toLocaleString()}đ)</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 italic font-medium">Chỉ số cũ</label>
                    <input type="number" min="0" onKeyDown={handleKeyDown} {...register('oldWater')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 italic font-bold">Chỉ số mới</label>
                    <input type="number" min="0" onKeyDown={handleKeyDown} {...register('newWater')} className={`w-full px-3 py-2 border rounded-lg outline-none transition-all ${errors.newWater ? 'border-red-500 ring-1 ring-red-500' : 'focus:ring-2 focus:ring-blue-500'}`} />
                    {errors.newWater && <p className="text-red-500 text-[10px] mt-1 italic font-bold">⚠️ {errors.newWater.message}</p>}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phí dịch vụ / Khác</label>
                  <input type="number" min="0" onKeyDown={handleKeyDown} {...register('serviceFee')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh hóa đơn/CK</label>
                  <div className="relative border border-dashed rounded-lg h-[42px] flex items-center px-3 cursor-pointer hover:bg-slate-50 bg-white">
                     <span className="text-sm text-slate-500 truncate">{paymentProof ? 'Đã chọn ảnh' : 'Chọn ảnh...'}</span>
                     <UploadCloud size={16} className="absolute right-3 text-slate-400"/>
                     <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
               <div className="flex items-center gap-2 text-slate-300"><Calculator size={20} /><span>Tổng tiền (Tạm tính):</span></div>
               <div className="text-right">
                  {estimatedTotal === -1 ? (
                    <div className="flex items-center gap-1 text-red-400 font-bold animate-pulse"><AlertCircle size={16} /> Chỉ số không hợp lệ - Kiểm tra lại!</div>
                  ) : (
                    <span className="text-2xl font-bold text-green-400">{estimatedTotal.toLocaleString()} đ</span>
                  )}
               </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Hủy bỏ</button>
           <button form="invoice-form" type="submit" disabled={isSubmitting || estimatedTotal === -1} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all">
             {isSubmitting && <Loader2 className="animate-spin" size={18} />}
             {initialData ? 'Cập nhật' : 'Lập hóa đơn'}
           </button>
        </div>
      </div>
    </div>
  );
}