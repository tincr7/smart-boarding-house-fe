'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Calendar, MapPin, Home, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Contract, contractApi } from '@/services/contract.api';
import { uploadApi } from '@/services/upload.api';
import { roomApi, Room } from '@/services/room.api';
import { userApi, User } from '@/services/user.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext'; // MỚI: Dùng AuthContext để lấy chi nhánh của Admin

const contractSchema = z.object({
  branchId: z.coerce.number().min(1, 'Vui lòng chọn Chi nhánh'),
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

interface ExtendedUser extends User {
  hasActiveContract?: boolean;
}

export default function ContractModal({ isOpen, onClose, onSubmit, initialData }: ContractModalProps) {
  const { user: currentUser } = useAuth(); // Lấy thông tin Admin hiện tại
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as any,
  });

  const selectedBranchId = watch('branchId');
  const selectedUserId = watch('userId');

  const selectedUserStatus = useMemo(() => {
    return users.find(u => u.id === Number(selectedUserId));
  }, [selectedUserId, users]);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          // CHUẨN ĐA CHI NHÁNH: Admin cơ sở chỉ lấy dữ liệu của chính mình
          const branchIdFilter = currentUser?.branchId || undefined;

          const [branchData, roomData, userData, contractData] = await Promise.all([
            branchApi.getAll(),
            roomApi.getAll(branchIdFilter), // Lọc phòng theo chi nhánh
            userApi.getAll(branchIdFilter), // Lọc cư dân theo chi nhánh
            contractApi.getAll(undefined, branchIdFilter) // Lọc hợp đồng cũ để kiểm tra trùng lặp
          ]);

          setBranches(branchData);
          setAllRooms(roomData);

          const activeUserIds = contractData
            .filter(c => c.status === 'ACTIVE' && !c.deletedAt) 
            .map(c => c.userId);

          const processedUsers = userData
            .filter(user => user.role !== 'ADMIN')
            .map(user => ({
              ...user,
              hasActiveContract: activeUserIds.includes(user.id)
            }));
          
          setUsers(processedUsers);

          // Tự động điền branchId nếu là Admin cơ sở
          if (currentUser?.branchId) {
            setValue('branchId', currentUser.branchId);
          }
        } catch (error) {
          console.error("Lỗi tải dữ liệu đa chi nhánh:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();

      if (initialData) {
        setValue('branchId', initialData.room?.branchId || 0); 
        setValue('roomId', initialData.roomId);
        setValue('userId', initialData.userId);
        setValue('deposit', Number(initialData.deposit));
        setValue('startDate', initialData.startDate.split('T')[0]);
        setValue('endDate', initialData.endDate.split('T')[0]);
        setScanImage(initialData.scanImage || null);
      } else if (!currentUser?.branchId) {
        reset();
        setScanImage(null);
      }
    }
  }, [isOpen, initialData, reset, setValue, currentUser]);

  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) return [];
    return allRooms.filter(room => {
      const belongToBranch = room.branchId === Number(selectedBranchId);
      const isCurrentRoom = initialData && room.id === initialData.roomId;
      const isAvailable = room.status === 'AVAILABLE'; 
      return belongToBranch && (isAvailable || isCurrentRoom);
    });
  }, [allRooms, selectedBranchId, initialData]);

  const onFormSubmit: SubmitHandler<ContractFormValues> = async (data) => {
    if (selectedUserStatus?.hasActiveContract && !initialData) {
      const confirmAdd = confirm(`Khách hàng ${selectedUserStatus.fullName} đang có một hợp đồng ACTIVE. Tiếp tục tạo thêm hợp đồng mới?`);
      if (!confirmAdd) return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrl = initialData?.scanImage || null;
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'contracts');
        uploadedUrl = res.url || res.secure_url || res;
      }

      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        scanImage: uploadedUrl
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      alert('Lỗi khi lưu hợp đồng đa chi nhánh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              {initialData ? 'Hiệu chỉnh Hợp đồng' : 'Thiết lập Hợp đồng mới'}
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SmartHouse AI Management System</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto">
          {isLoadingData ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
          ) : (
            <form id="contract-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
              
              {/* CHỌN CHI NHÁNH - Khóa nếu là Admin cơ sở */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <MapPin size={14} className="text-blue-500" /> Lựa chọn Cơ sở vận hành
                </label>
                <select 
                  {...register('branchId')} 
                  disabled={!!currentUser?.branchId}
                  className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-60"
                >
                  <option value="">-- Chọn chi nhánh hệ thống --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branchId && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase italic">{errors.branchId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Home size={14} className="text-emerald-500" /> Phòng trống khả dụng
                  </label>
                  <select {...register('roomId')} disabled={!selectedBranchId} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50">
                    <option value="">-- Chọn mã phòng --</option>
                    {filteredRooms.map(room => (
                        <option key={room.id} value={room.id}>{room.roomNumber} - {Number(room.price).toLocaleString()}đ</option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <UserIcon size={14} className="text-violet-500" /> Đối tác Cư dân
                  </label>
                  <select {...register('userId')} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all">
                    <option value="">-- Chọn khách hàng --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} {user.hasActiveContract ? "(Đang lưu trú)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedUserStatus?.hasActiveContract && !initialData && (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
                  <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                  <p className="text-[10px] text-orange-700 font-bold uppercase leading-relaxed tracking-tight">
                    Cư dân <b>{selectedUserStatus.fullName}</b> đang có hợp đồng hoạt động tại chi nhánh. Vui lòng xác nhận trước khi ký thêm phòng.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời điểm nhận phòng</label>
                  <input type="date" {...register('startDate')} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời điểm bàn giao</label>
                  <input type="date" {...register('endDate')} className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              <div className="p-6 bg-blue-50/30 rounded-[2rem] border-2 border-dashed border-blue-100">
                <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 text-center">Bản quét Hợp đồng thực tế (Scan/Photo)</label>
                <div className="flex flex-col items-center justify-center relative min-h-[120px] cursor-pointer">
                  {scanImage ? (
                     <img src={scanImage} alt="Scan" className="h-32 w-full object-contain rounded-xl" />
                  ) : (
                    <>
                      <UploadCloud size={32} className="text-blue-300 mb-2" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải lên hồ sơ lưu trữ</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                      setScanImage(URL.createObjectURL(e.target.files[0]));
                    }
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-8 border-t flex justify-end gap-4 bg-slate-50/50">
          <button onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all">Hủy bỏ thao tác</button>
          <button form="contract-form" type="submit" disabled={isSubmitting} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 disabled:opacity-50">
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            {initialData ? 'Cập nhật hồ sơ' : 'Xác thực & Ký hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}