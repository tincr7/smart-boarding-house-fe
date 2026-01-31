'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, MapPin, Home, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Contract, contractApi } from '@/services/contract.api';
import { uploadApi } from '@/services/upload.api';
import { roomApi, Room } from '@/services/room.api';
import { userApi, User } from '@/services/user.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';

// 1. SCHEMA CHẶT CHẼ
const contractSchema = z.object({
  branchId: z.preprocess((val) => Number(val), z.number().min(1, 'Vui lòng chọn Chi nhánh')),
  roomId: z.preprocess((val) => Number(val), z.number().min(1, 'Vui lòng chọn Phòng')),
  userId: z.preprocess((val) => Number(val), z.number().min(1, 'Vui lòng chọn Khách thuê')),
  deposit: z.preprocess((val) => Number(val), z.number().min(0, 'Tiền cọc phải từ 0đ')),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  endDate: z.string().optional(), // EndDate có thể optional trong form nếu muốn
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
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as Resolver<ContractFormValues>,
    defaultValues: {
      branchId: 0,
      roomId: 0,
      userId: 0,
      deposit: 0,
      startDate: '',
      endDate: '',
    }
  });

  const selectedBranchId = watch('branchId');
  const selectedUserId = watch('userId');

  // 2. TẢI DỮ LIỆU THÔNG MINH
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const branchIdFilter = currentUser?.branchId || undefined;

          const [branchData, roomData, userData, contractData] = await Promise.all([
            branchApi.getAll(),
            roomApi.getAll(branchIdFilter),
            userApi.getAll(branchIdFilter),
            contractApi.getAll(undefined, branchIdFilter)
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

          if (currentUser?.branchId) {
            setValue('branchId', Number(currentUser.branchId));
          }
        } catch (error) {
          console.error("Lỗi đồng bộ dữ liệu modal:", error);
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
        
        // 👇 SỬA LỖI Ở ĐÂY: Kiểm tra tồn tại trước khi split
        setValue('startDate', initialData.startDate ? initialData.startDate.split('T')[0] : '');
        setValue('endDate', initialData.endDate ? initialData.endDate.split('T')[0] : '');
        
        setScanImage(initialData.scanImage || null);
      }
    } else {
      reset();
      setScanImage(null);
      setSelectedFile(null);
    }
  }, [isOpen, initialData, reset, setValue, currentUser]);

  // ... (Phần còn lại giữ nguyên không đổi) ...

  const filteredUsers = useMemo(() => {
    if (!selectedBranchId) return [];
    return users.filter(user => 
      !user.branchId || user.branchId === Number(selectedBranchId)
    );
  }, [users, selectedBranchId]);

  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) return [];
    return allRooms.filter(room => {
      const isAvailable = room.status === 'AVAILABLE' || (initialData && room.id === initialData.roomId); 
      return room.branchId === Number(selectedBranchId) && isAvailable;
    });
  }, [allRooms, selectedBranchId, initialData]);

  const selectedUserStatus = useMemo(() => {
    return users.find(u => u.id === Number(selectedUserId));
  }, [selectedUserId, users]);

  const onFormSubmit: SubmitHandler<ContractFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      let uploadedUrl = initialData?.scanImage || null;
      if (selectedFile) {
        const res = await uploadApi.upload(selectedFile, 'contracts');
        uploadedUrl = res.url || res.secure_url || res;
      }

      const finalPayload = {
        branchId: Number(data.branchId),
        roomId: Number(data.roomId),
        userId: Number(data.userId),
        deposit: Number(data.deposit),
        startDate: new Date(data.startDate).toISOString(),
        // Check endDate có giá trị không trước khi convert
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        scanImage: uploadedUrl
      };

      await onSubmit(finalPayload);
      onClose();
    } catch (error: any) {
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể thiết lập hợp đồng.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 text-slate-900">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* Header */}
        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">Thiết lập hợp đồng AI</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SmartHouse Security Verified</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><X size={24} /></button>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar">
          {isLoadingData ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="animate-spin text-blue-600" size={48} />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Đồng bộ dữ liệu cơ sở...</p>
             </div>
          ) : (
            <form id="contract-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-10">
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                   <MapPin size={14} className="text-blue-500" /> Chi nhánh vận hành
                </label>
                <select 
                  {...register('branchId')} 
                  disabled={!!currentUser?.branchId} 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60"
                >
                  <option value="0">-- CHỌN CƠ SỞ --</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.branchId && <p className="text-red-500 text-[9px] font-black px-1 uppercase">{errors.branchId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Home size={14} className="text-emerald-500" /> Phòng trống
                  </label>
                  <select {...register('roomId')} disabled={!selectedBranchId} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all">
                    <option value="0">-- CHỌN PHÒNG --</option>
                    {filteredRooms.map(room => (<option key={room.id} value={room.id}>PHÒNG {room.roomNumber}</option>))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <UserIcon size={14} className="text-violet-500" /> Khách thuê
                  </label>
                  <select {...register('userId')} disabled={!selectedBranchId} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black uppercase outline-none focus:bg-white focus:border-violet-500 transition-all">
                    <option value="0">-- CHỌN CƯ DÂN --</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id} className={user.hasActiveContract ? 'text-slate-300' : ''}>
                        {user.fullName} {user.hasActiveContract ? '(ĐÃ CÓ HĐ)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedUserStatus?.hasActiveContract && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <AlertTriangle size={12} className="text-amber-600" />
                      <p className="text-[8px] font-black text-amber-700 uppercase italic">Cư dân này đang có hợp đồng hiệu lực</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ngày bắt đầu</label>
                  <input type="date" {...register('startDate')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ngày kết thúc</label>
                  <input type="date" {...register('endDate')} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiền đặt cọc (VNĐ)</label>
                <div className="relative">
                  <input type="number" {...register('deposit')} placeholder="0" className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all" />
                  <span className="absolute right-6 top-4 text-[10px] font-black text-slate-300 uppercase">đ</span>
                </div>
              </div>

              <div className="p-8 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 hover:border-blue-200 transition-all group">
                <div className="flex flex-col items-center justify-center relative min-h-[140px] cursor-pointer">
                  {scanImage ? (
                    <div className="relative w-full h-40">
                      <img src={scanImage} alt="Scan" className="w-full h-full object-contain rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-all">
                        <UploadCloud className="text-white" size={32} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={40} className="text-slate-300 mb-3 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải lên bản quét hợp đồng giấy</span>
                      <p className="text-[8px] text-slate-300 mt-2 font-bold uppercase italic">Hỗ trợ JPG, PNG, PDF (Max 5MB)</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setSelectedFile(e.target.files[0]); setScanImage(URL.createObjectURL(e.target.files[0])); } }} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-10 border-t flex justify-end gap-6 bg-slate-50/50">
          <button onClick={onClose} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all">Hủy bỏ</button>
          <button 
            form="contract-form" 
            type="submit" 
            disabled={isSubmitting} 
            className="px-12 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-blue-200 active:scale-95"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"></div>}
            Xác thực & Ký hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
}