'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Calculator, MapPin, Home } from 'lucide-react';
import { Invoice, CreateInvoiceDto } from '@/services/invoice.api';
import { roomApi, Room } from '@/services/room.api';
import { uploadApi } from '@/services/upload.api';
import { branchApi, Branch } from '@/services/branch.api'; // 1. IMPORT API CHI NHÁNH

const PRICE_ELEC = 3500;
const PRICE_WATER = 15000;

// Schema Validation
const invoiceSchema = z.object({
  branchId: z.coerce.number().optional(), // Thêm trường này để phục vụ UI (không bắt buộc gửi API)
  roomId: z.coerce.number().min(1, 'Vui lòng chọn Phòng'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020),
  oldElectricity: z.coerce.number().min(0),
  newElectricity: z.coerce.number().min(0),
  oldWater: z.coerce.number().min(0),
  newWater: z.coerce.number().min(0),
  serviceFee: z.coerce.number().min(0),
}).refine((data) => data.newElectricity >= data.oldElectricity, {
  message: "Số mới phải >= số cũ",
  path: ["newElectricity"],
}).refine((data) => data.newWater >= data.oldWater, {
  message: "Số mới phải >= số cũ",
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
  const [branches, setBranches] = useState<Branch[]>([]); // 2. STATE LƯU CHI NHÁNH
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  const { 
    register, 
    handleSubmit, 
    watch, 
    reset, 
    setValue, 
    formState: { errors } 
  } = useForm<InvoiceFormValues>({
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
  const selectedBranchId = watch('branchId'); // Theo dõi chi nhánh đang chọn

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          // 3. GỌI SONG SONG ROOM VÀ BRANCH
          const [allRooms, allBranches] = await Promise.all([
             roomApi.getAll(),
             branchApi.getAll()
          ]);
          
          setRooms(allRooms);
          setBranches(allBranches);

          // Nếu đang Sửa (Edit mode)
          if (initialData) {
            // Tìm branchId của phòng hiện tại để set default
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

  // 4. LOGIC LỌC PHÒNG THEO CHI NHÁNH
  const filteredRooms = useMemo(() => {
    // Chỉ lấy phòng có người ở (OCCUPIED hoặc RENTED)
    const occupiedRooms = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RENTED');

    // Nếu chưa chọn chi nhánh -> Trả về rỗng (bắt buộc chọn chi nhánh trước)
    if (!selectedBranchId) return [];

    // Lọc theo branchId
    return occupiedRooms.filter(r => r.branchId === Number(selectedBranchId));
  }, [rooms, selectedBranchId]);


  // Tính tiền tự động
  useEffect(() => {
    const { roomId, oldElectricity, newElectricity, oldWater, newWater, serviceFee } = watchAllFields;
    
    const selectedRoom = rooms.find(r => r.id === Number(roomId));
    const roomPrice = selectedRoom ? Number(selectedRoom.price) : 0;

    const elecCost = (Number(newElectricity || 0) - Number(oldElectricity || 0)) * PRICE_ELEC;
    const waterCost = (Number(newWater || 0) - Number(oldWater || 0)) * PRICE_WATER;
    const total = roomPrice + Math.max(0, elecCost) + Math.max(0, waterCost) + Number(serviceFee || 0);
    
    setEstimatedTotal(total);
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

      // Loại bỏ branchId ra khỏi payload gửi đi (vì backend không cần)
      const { branchId, ...restData } = data;

      const payload: CreateInvoiceDto = {
        ...restData,
        paymentProof: uploadedUrl,
      };
      await onSubmit(payload);
      onClose();
    } catch (error) {
      alert('Lỗi khi lưu hóa đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Sửa hóa đơn' : 'Lập hóa đơn tiền phòng'}
          </h2>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="invoice-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            
            {/* 5. UI: CHỌN CHI NHÁNH & PHÒNG */}
            <div className="grid grid-cols-2 gap-4">
              {/* Dropdown Chi nhánh */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin size={14} /> Khu trọ / Chi nhánh
                </label>
                <select 
                  {...register('branchId')} 
                  className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown Phòng (Đã lọc) */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                   <Home size={14} /> Phòng thuê
                </label>
                <select 
                  {...register('roomId')} 
                  disabled={!selectedBranchId} // Disable nếu chưa chọn chi nhánh
                  className="w-full px-3 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">-- Chọn phòng --</option>
                  {filteredRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.roomNumber} - {Number(r.price).toLocaleString()}đ</option>
                  ))}
                </select>
                {selectedBranchId && filteredRooms.length === 0 && (
                   <p className="text-xs text-red-500 mt-1">Khu này chưa có phòng nào đang thuê.</p>
                )}
                {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId.message}</p>}
              </div>
            </div>

            {/* Hàng: Thời gian */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tháng</label>
                <input type="number" {...register('month')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.month && <p className="text-red-500 text-xs mt-1">{errors.month.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Năm</label>
                <input type="number" {...register('year')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.year && <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>}
              </div>
            </div>

            {/* Hàng: Điện */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
               <h3 className="font-bold text-yellow-700 text-sm mb-2 flex items-center gap-2">⚡ Chỉ số Điện ({PRICE_ELEC.toLocaleString()}đ/kwh)</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Chỉ số cũ</label>
                    <input type="number" {...register('oldElectricity')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Chỉ số mới</label>
                    <input type="number" {...register('newElectricity')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-yellow-500" />
                    {errors.newElectricity && <p className="text-red-500 text-xs mt-1">{errors.newElectricity.message}</p>}
                  </div>
               </div>
            </div>

            {/* Hàng: Nước */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <h3 className="font-bold text-blue-700 text-sm mb-2 flex items-center gap-2">💧 Chỉ số Nước ({PRICE_WATER.toLocaleString()}đ/m3)</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Chỉ số cũ</label>
                    <input type="number" {...register('oldWater')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Chỉ số mới</label>
                    <input type="number" {...register('newWater')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.newWater && <p className="text-red-500 text-xs mt-1">{errors.newWater.message}</p>}
                  </div>
               </div>
            </div>

            {/* Hàng: Phí khác */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phí dịch vụ / Khác</label>
                  <input type="number" {...register('serviceFee')} className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh hóa đơn/CK (Nếu có)</label>
                  <div className="relative border border-dashed rounded-lg h-[42px] flex items-center px-3 cursor-pointer hover:bg-slate-50 bg-white">
                     <span className="text-sm text-slate-500 truncate">{paymentProof ? 'Đã chọn ảnh' : 'Chọn ảnh...'}</span>
                     <UploadCloud size={16} className="absolute right-3 text-slate-400"/>
                     <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
               </div>
            </div>

            {/* Total */}
            <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
               <div className="flex items-center gap-2 text-slate-300">
                  <Calculator size={20} />
                  <span>Tổng tiền (Tạm tính):</span>
               </div>
               <span className="text-2xl font-bold text-green-400">
                  {estimatedTotal.toLocaleString()} đ
               </span>
            </div>

          </form>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Hủy bỏ</button>
           <button form="invoice-form" type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 transition-all">
             {isSubmitting && <Loader2 className="animate-spin" size={18} />}
             {initialData ? 'Cập nhật' : 'Lập hóa đơn'}
           </button>
        </div>
      </div>
    </div>
  );
}