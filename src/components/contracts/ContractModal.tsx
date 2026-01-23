'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Calendar, MapPin, Home, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Contract, CreateContractDto, contractApi } from '@/services/contract.api'; // Thêm contractApi
import { uploadApi } from '@/services/upload.api';
import { roomApi, Room } from '@/services/room.api';
import { userApi, User } from '@/services/user.api';
import { branchApi, Branch } from '@/services/branch.api';

// Validate dữ liệu
const contractSchema = z.object({
  branchId: z.coerce.number().optional(),
  roomId: z.coerce.number().min(1, 'Vui lòng chọn Phòng'),
  userId: z.coerce.number().min(1, 'Vui lòng chọn Khách thuê'),
  deposit: z.coerce.number().min(0, 'Tiền cọc phải là số dương'),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  endDate: z.string().min(1, 'Chọn ngày kết thúc'),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Contract | null;
}

// Mở rộng interface User để lưu trạng thái thuê
interface ExtendedUser extends User {
  hasActiveContract?: boolean;
}

export default function ContractModal({ isOpen, onClose, onSubmit, initialData }: ContractModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Data States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as any,
  });

  const selectedBranchId = watch('branchId');
  const selectedUserId = watch('userId'); // Theo dõi để hiển thị cảnh báo

  // Kiểm tra xem khách hàng đang chọn có đang thuê phòng khác không
  const selectedUserStatus = useMemo(() => {
    return users.find(u => u.id === Number(selectedUserId));
  }, [selectedUserId, users]);

  useEffect(() => {
    if (isOpen) {
const fetchData = async () => {
  setIsLoadingData(true);
  try {
    const [branchData, roomData, userData, contractData] = await Promise.all([
      branchApi.getAll(),
      roomApi.getAll(),
      userApi.getAll(),
      contractApi.getAll()
    ]);

    setBranches(branchData);
    setAllRooms(roomData);

    // CHỈ LỌC CÁC HỢP ĐỒNG ĐANG HOẠT ĐỘNG (ACTIVE)
    // Loại bỏ 'UNPAID' vì đây là trạng thái của Hóa đơn, không phải Hợp đồng
    const activeUserIds = contractData
      .filter(c => c.status === 'ACTIVE') 
      .map(c => c.userId);

    const processedUsers = userData
      .filter(user => user.role !== 'ADMIN')
      .map(user => ({
        ...user,
        hasActiveContract: activeUserIds.includes(user.id)
      }));
    
    setUsers(processedUsers);
  } catch (error) {
    console.error("Lỗi tải dữ liệu:", error);
  } finally {
    setIsLoadingData(false);
  }
};
      fetchData();

      if (initialData) {
        const currentRoom = initialData.room;
        setValue('branchId', currentRoom?.branchId || 0); 
        setValue('roomId', initialData.roomId);
        setValue('userId', initialData.userId);
        setValue('deposit', Number(initialData.deposit));
        setValue('startDate', initialData.startDate.split('T')[0]);
        setValue('endDate', initialData.endDate.split('T')[0]);
        setScanImage(initialData.scanImage || null);
      } else {
        reset();
        setScanImage(null);
      }
      setSelectedFile(null);
    }
  }, [isOpen, initialData, reset, setValue]);

  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) return [];
    return allRooms.filter(room => {
      const belongToBranch = room.branchId === Number(selectedBranchId);
      const isCurrentRoom = initialData && room.id === initialData.roomId;
      const isAvailable = room.status === 'AVAILABLE' || !room.status; 
      return belongToBranch && (isAvailable || isCurrentRoom);
    });
  }, [allRooms, selectedBranchId, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
      setScanImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const onFormSubmit: SubmitHandler<ContractFormValues> = async (data) => {
    // Cảnh báo xác nhận lần cuối nếu khách đang thuê
    if (selectedUserStatus?.hasActiveContract && !initialData) {
      const confirmAdd = confirm(`Khách hàng ${selectedUserStatus.fullName} đang có một hợp đồng thuê khác. Bạn có chắc chắn muốn tạo thêm hợp đồng cho phòng này không?`);
      if (!confirmAdd) return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl = initialData?.scanImage || null;
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'contracts');
        uploadedUrl = res.secure_url || res.url || res.path || (res.data && res.data.url) || res;
      }

      const payload = {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        deposit: Number(data.deposit),
        userId: Number(data.userId),
        roomId: Number(data.roomId),
        scanImage: uploadedUrl || null
      };

      await onSubmit(payload);
      onClose();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Lỗi xử lý';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-slate-900">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Cập nhật Hợp đồng' : 'Tạo Hợp đồng Thuê'}
          </h2>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoadingData ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <form id="contract-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                   <MapPin size={16} /> Chi nhánh
                </label>
                <select {...register('branchId')} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Chọn chi nhánh --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Home size={16} /> Phòng trống
                  </label>
                  <select {...register('roomId')} disabled={!selectedBranchId} className="w-full px-3 py-2 border rounded-lg bg-white disabled:bg-slate-100 outline-none">
                    <option value="">-- Chọn phòng --</option>
                    {filteredRooms.map(room => (
                        <option key={room.id} value={room.id}>{room.roomNumber} - {Number(room.price).toLocaleString()}đ</option>
                      ))
                    }
                  </select>
                  {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <UserIcon size={16} /> Khách thuê
                  </label>
                  <select {...register('userId')} className={`w-full px-3 py-2 border rounded-lg bg-white outline-none ${selectedUserStatus?.hasActiveContract ? 'border-amber-400 ring-1 ring-amber-100' : ''}`}>
                    <option value="">-- Chọn khách hàng --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id} className={user.hasActiveContract ? "text-amber-600 font-medium" : "text-slate-900"}>
                        {user.fullName} {user.hasActiveContract ? "(Đang thuê phòng khác)" : ""}
                      </option>
                    ))}
                  </select>
                  {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>}
                </div>
              </div>

              {/* HIỂN THỊ CẢNH BÁO TRỰC QUAN */}
              {selectedUserStatus?.hasActiveContract && !initialData && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                  <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    <strong>Lưu ý:</strong> Khách hàng <b>{selectedUserStatus.fullName}</b> hiện đang có hợp đồng thuê tại hệ thống. Bạn vẫn có thể tạo thêm hợp đồng nếu khách thuê thêm phòng khác.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="date" {...register('startDate')} className="w-full px-3 py-2 border rounded-lg" />
                  {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input type="date" {...register('endDate')} className="w-full px-3 py-2 border rounded-lg" />
                  {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tiền đặt cọc (VNĐ)</label>
                <input type="number" {...register('deposit')} className="w-full px-3 py-2 border rounded-lg" placeholder="Nhập số tiền..." />
                {errors.deposit && <p className="text-red-500 text-xs mt-1">{errors.deposit.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bản scan hợp đồng</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 relative cursor-pointer min-h-[150px]">
                  {scanImage ? (
                     <div className="relative w-full h-40">
                        <img src={scanImage} alt="Scan" className="w-full h-full object-contain" />
                     </div>
                  ) : (
                    <>
                      <UploadCloud size={24} className="mb-1" />
                      <span className="text-xs">Tải ảnh lên</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Hủy bỏ</button>
          <button form="contract-form" type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-100 disabled:opacity-50">
            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
            {initialData ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}