'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Calculator, MapPin, Home, AlertCircle, Zap, Droplets } from 'lucide-react';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { roomApi, Room } from '@/services/room.api';
import { uploadApi } from '@/services/upload.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext'; // Thêm để lấy branchId

const PRICE_ELEC = 3500;
const PRICE_WATER = 15000;

const invoiceSchema = z.object({
  branchId: z.coerce.number().min(1, 'Vui lòng chọn Chi nhánh'), 
  roomId: z.coerce.number().min(1, 'Vui lòng chọn Phòng'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  oldElectricity: z.coerce.number().min(0),
  newElectricity: z.coerce.number().min(0),
  oldWater: z.coerce.number().min(0),
  newWater: z.coerce.number().min(0),
  serviceFee: z.coerce.number().min(0),
}).refine((data) => data.newElectricity >= data.oldElectricity, {
  message: "Chỉ số mới không được nhỏ hơn chỉ số cũ!",
  path: ["newElectricity"],
}).refine((data) => data.newWater >= data.oldWater, {
  message: "Chỉ số mới không được nhỏ hơn chỉ số cũ!",
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
  const { user } = useAuth(); // Lấy thông tin admin đăng nhập
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
    }
  });

  const watchAllFields = watch();
  const selectedBranchId = watch('branchId');
  const selectedRoomId = watch('roomId');

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          // Lọc dữ liệu theo chi nhánh ngay từ API
          const branchFilter = user?.branchId || undefined;
          const [allRooms, allBranches] = await Promise.all([
            roomApi.getAll(branchFilter), 
            branchApi.getAll()
          ]);
          setRooms(allRooms);
          setBranches(allBranches);

          if (initialData) {
            setValue('branchId', initialData.room?.branchId);
            setValue('roomId', initialData.roomId);
            setValue('month', initialData.month);
            setValue('year', initialData.year);
            setValue('oldElectricity', initialData.oldElectricity);
            setValue('newElectricity', initialData.newElectricity);
            setValue('oldWater', initialData.oldWater);
            setValue('newWater', initialData.newWater);
            setValue('serviceFee', Number(initialData.serviceFee));
            setPaymentProof(initialData.paymentProof || null);
          } else if (user?.branchId) {
            setValue('branchId', user.branchId); // Auto-fill branch nếu là Admin cơ sở
          }
        } catch (error) { console.error(error); }
      };
      fetchData();
    }
  }, [isOpen, initialData, setValue, user]);

  // Tự động chốt số cũ khi chọn phòng
  useEffect(() => {
    const fetchLatestIndexes = async () => {
      if (selectedRoomId && !initialData) {
        try {
          const res = await invoiceApi.getLatestByRoom(Number(selectedRoomId));
          if (res) {
            setValue('oldElectricity', res.newElectricity);
            setValue('oldWater', res.newWater);
            setValue('newElectricity', res.newElectricity);
            setValue('newWater', res.newWater);
          }
        } catch (error) { 
           setValue('oldElectricity', 0);
           setValue('oldWater', 0);
        }
      }
    };
    fetchLatestIndexes();
  }, [selectedRoomId, initialData, setValue]);

  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) return [];
    return rooms.filter(r => r.branchId === Number(selectedBranchId) && (r.status === 'OCCUPIED' || initialData));
  }, [rooms, selectedBranchId, initialData]);

  // Tính tiền tự động thời gian thực
  useEffect(() => {
    const { roomId, oldElectricity, newElectricity, oldWater, newWater, serviceFee } = watchAllFields;
    if (newElectricity < oldElectricity || newWater < oldWater) {
      setEstimatedTotal(-1);
      return;
    }
    const selectedRoom = rooms.find(r => r.id === Number(roomId));
    const roomPrice = selectedRoom ? Number(selectedRoom.price) : 0;
    const elecCost = (Number(newElectricity || 0) - Number(oldElectricity || 0)) * PRICE_ELEC;
    const waterCost = (Number(newWater || 0) - Number(oldWater || 0)) * PRICE_WATER;
    setEstimatedTotal(roomPrice + elecCost + waterCost + Number(serviceFee || 0));
  }, [watchAllFields, rooms]);

  const onFormSubmit: SubmitHandler<InvoiceFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      let uploadedUrl = initialData?.paymentProof;
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'invoices');
        uploadedUrl = res.url || res.secure_url || res;
      }
      await onSubmit({ ...data, paymentProof: uploadedUrl });
      onClose();
    } catch (error) { alert('Lỗi khi lưu hóa đơn'); } 
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Lập quyết toán tài chính</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Tự động tính toán theo đơn giá cơ sở</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto">
          <form id="invoice-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-blue-500"/> Chi nhánh quản lý</label>
                <select {...register('branchId')} disabled={!!user?.branchId} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60">
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Home size={14} className="text-emerald-500"/> Phòng cho thuê</label>
                <select {...register('roomId')} disabled={!selectedBranchId} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all">
                  <option value="">-- Chọn phòng --</option>
                  {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.roomNumber}</option>)}
                </select>
              </div>
            </div>

            {/* Chỉ số Điện & Nước được thiết kế lại để dễ nhìn hơn */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-yellow-50/50 p-6 rounded-[2rem] border-2 border-yellow-100/50">
                  <h3 className="font-black text-yellow-600 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={16} fill="currentColor" /> Chỉ số điện (kWh)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Số cũ:</span>
                       <input type="number" {...register('oldElectricity')} className="w-24 bg-transparent border-b border-yellow-200 text-right font-black text-slate-700 outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-yellow-600 uppercase">Số mới:</span>
                       <input type="number" {...register('newElectricity')} className="w-24 bg-white px-2 py-1 rounded-lg shadow-sm border border-yellow-200 text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-yellow-400" />
                    </div>
                  </div>
               </div>

               <div className="bg-blue-50/50 p-6 rounded-[2rem] border-2 border-blue-100/50">
                  <h3 className="font-black text-blue-600 text-[10px] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Droplets size={16} fill="currentColor" /> Chỉ số nước (m³)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Số cũ:</span>
                       <input type="number" {...register('oldWater')} className="w-24 bg-transparent border-b border-blue-200 text-right font-black text-slate-700 outline-none" />
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-blue-600 uppercase">Số mới:</span>
                       <input type="number" {...register('newWater')} className="w-24 bg-white px-2 py-1 rounded-lg shadow-sm border border-blue-200 text-right font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">
                  <Calculator size={100} className="text-white" />
               </div>
               <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ước tính doanh thu tháng</p>
                     {estimatedTotal === -1 ? (
                        <div className="flex items-center gap-2 text-red-400 font-black text-xs uppercase italic animate-pulse">
                           <AlertCircle size={14} /> Chỉ số không hợp lệ
                        </div>
                     ) : (
                        <p className="text-xs text-slate-400 font-bold italic">Bao gồm: Giá phòng + Điện + Nước + Dịch vụ</p>
                     )}
                  </div>
                  <div className="text-right">
                     {estimatedTotal !== -1 && (
                        <span className="text-3xl font-black text-green-400 tracking-tighter italic">
                           {estimatedTotal.toLocaleString()} <span className="text-xs">đ</span>
                        </span>
                     )}
                  </div>
               </div>
            </div>

          </form>
        </div>

        <div className="p-8 border-t flex justify-end gap-4 bg-slate-50/50">
           <button onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">Hủy bỏ</button>
           <button form="invoice-form" type="submit" disabled={isSubmitting || estimatedTotal === -1} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95">
             {isSubmitting && <Loader2 className="animate-spin" size={16} />}
             {initialData ? 'Lưu thay đổi' : 'Kích hoạt hóa đơn'}
           </button>
        </div>
      </div>
    </div>
  );
}