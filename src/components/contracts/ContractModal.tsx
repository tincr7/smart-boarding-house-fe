'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, MapPin, Home, User as UserIcon, AlertTriangle, FileText } from 'lucide-react';
import { Contract, contractApi } from '@/services/contract.api';
import { uploadApi } from '@/services/upload.api';
import { roomApi, Room } from '@/services/room.api';
import { userApi, User } from '@/services/user.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';

// 1. SCHEMA VALIDATE
const contractSchema = z.object({
  branchId: z.preprocess((val) => Number(val), z.number().min(1, 'Vui lòng chọn Chi nhánh')),
  roomId: z.preprocess((val) => Number(val), z.number().min(1, 'Vui lòng chọn Phòng')),
  userId: z.preprocess((val) => Number(val), z.number().min(1, 'Vui lòng chọn Khách thuê')),
  deposit: z.preprocess((val) => Number(val), z.number().min(0, 'Tiền cọc phải từ 0đ')),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
  endDate: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Contract | null;
  // Để hỗ trợ trường hợp truyền sẵn branchId từ page
  branchId?: number; 
}

interface ExtendedUser extends User {
  hasActiveContract?: boolean;
}

export default function ContractModal({ isOpen, onClose, onSubmit, initialData, branchId: propsBranchId }: ContractModalProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State xử lý ảnh
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // State dữ liệu danh mục
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
      startDate: new Date().toISOString().split('T')[0], // Mặc định hôm nay
      endDate: '',
    }
  });

  const selectedBranchId = watch('branchId');
  const selectedUserId = watch('userId');

  // 2. TẢI DỮ LIỆU KHI MỞ MODAL
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          // Lấy branchId ưu tiên: Props truyền vào -> User đang đăng nhập
          const branchIdFilter = propsBranchId || currentUser?.branchId || undefined;

          // Gọi song song các API
          const [branchData, roomData, userData, contractData] = await Promise.all([
            branchApi.getAll(),
            roomApi.getAll(branchIdFilter),
            userApi.getAll(branchIdFilter),
            contractApi.getAll(undefined, branchIdFilter)
          ]);

          setBranches(branchData);
          setAllRooms(roomData);

          // Đánh dấu user đang có hợp đồng Active
          const activeUserIds = contractData
            .filter(c => c.status === 'ACTIVE' && !c.deletedAt) 
            .map(c => c.userId);

          const processedUsers = userData
            .filter(user => user.role !== 'ADMIN') // Lọc bỏ Admin
            .map(user => ({
              ...user,
              hasActiveContract: activeUserIds.includes(user.id)
            }));
          
          setUsers(processedUsers);

          // Nếu có branchId cố định -> Set luôn vào form
          if (branchIdFilter) {
             setValue('branchId', Number(branchIdFilter));
          }

        } catch (error) {
          console.error("Lỗi đồng bộ dữ liệu modal:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchData();

      // Nếu là chế độ Edit -> Fill dữ liệu cũ
      if (initialData) {
        setValue('branchId', initialData.room?.branchId || initialData.branchId || 0); 
        setValue('roomId', initialData.roomId);
        setValue('userId', initialData.userId);
        setValue('deposit', Number(initialData.deposit));
        setValue('startDate', initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '');
        setValue('endDate', initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '');
        
        // Load ảnh cũ nếu có (Giả sử trường image trong DB là initialData.image)
        setScanImage((initialData as any).image || null);
      }
    } else {
      // Reset khi đóng
      reset();
      setScanImage(null);
      setSelectedFile(null);
    }
  }, [isOpen, initialData, propsBranchId, currentUser, reset, setValue]);


  // 3. LOGIC LỌC DỮ LIỆU
  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) return [];
    return allRooms.filter(room => {
      // Chỉ hiện phòng TRỐNG hoặc chính phòng đang sửa
      const isAvailable = room.status === 'AVAILABLE' || (initialData && room.id === initialData.roomId); 
      return Number(room.branchId) === Number(selectedBranchId) && isAvailable;
    });
  }, [allRooms, selectedBranchId, initialData]);

  const filteredUsers = useMemo(() => {
    // Nếu chưa chọn chi nhánh -> không hiện user (tránh nhầm lẫn)
    if (!selectedBranchId) return [];
    
    // Lọc user thuộc chi nhánh đó (nếu user có gán branchId) HOẶC user tự do
    return users.filter(user => 
      !user.branchId || Number(user.branchId) === Number(selectedBranchId)
    );
  }, [users, selectedBranchId]);

  const selectedUserStatus = useMemo(() => {
    return users.find(u => u.id === Number(selectedUserId));
  }, [selectedUserId, users]);


  // 4. SUBMIT FORM
  const onFormSubmit: SubmitHandler<ContractFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      let uploadedUrl = (initialData as any)?.image || null;
      
      // Nếu có chọn file mới -> Upload lên
      if (selectedFile) {
        //  
        // Upload file lên server
        const res = await uploadApi.upload(selectedFile, 'contracts'); // 'contracts' là folder trên Cloudinary
        
        // Lấy URL trả về (tùy format API của bạn trả về string hay object)
        if (typeof res === 'string') uploadedUrl = res;
        else if (res?.url) uploadedUrl = res.url;
        else if (res?.secure_url) uploadedUrl = res.secure_url;
      }

      const finalPayload = {
        branchId: Number(data.branchId),
        roomId: Number(data.roomId),
        userId: Number(data.userId),
        deposit: Number(data.deposit),
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
scanImage: uploadedUrl,
      };

      await onSubmit(finalPayload);
      onClose();
    } catch (error: any) {
      console.error(error);
      alert('Lỗi: ' + (error.response?.data?.message || 'Không thể lưu hợp đồng.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-slate-900 transition-all duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none flex items-center gap-2">
               <FileText size={28} className="text-blue-600" /> Thiết lập hợp đồng
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">SmartHouse Legal System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all group">
             <X size={24} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="p-10 overflow-y-auto custom-scrollbar">
          {isLoadingData ? (
             <div className="flex flex-col items-center justify-center py-24 gap-6">
               <Loader2 className="animate-spin text-blue-600" size={56} />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Đang đồng bộ dữ liệu...</p>
             </div>
          ) : (
            <form id="contract-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-10">
              
              {/* Chọn Chi nhánh */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                   <MapPin size={14} className="text-blue-500" /> Cơ sở lưu trú
                </label>
                <div className="relative group">
                  <select 
                    {...register('branchId')} 
                    // Nếu đã truyền propsBranchId hoặc User là Admin Chi nhánh -> Disable select này
                    disabled={!!propsBranchId || !!currentUser?.branchId} 
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-black uppercase outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60 appearance-none cursor-pointer"
                  >
                    <option value="0">-- CHỌN CƠ SỞ --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {/* Custom Arrow */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500">▼</div>
                </div>
                {errors.branchId && <p className="text-red-500 text-[9px] font-black px-1 uppercase animate-pulse">{errors.branchId.message}</p>}
              </div>

              {/* Grid: Phòng & Khách */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Home size={14} className="text-emerald-500" /> Chọn Phòng
                  </label>
                  <div className="relative group">
                    <select {...register('roomId')} disabled={!selectedBranchId} className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-black uppercase outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                        <option value="0">-- CHỌN PHÒNG --</option>
                        {filteredRooms.map(room => (<option key={room.id} value={room.id}>P.{room.roomNumber} - {Number(room.price).toLocaleString()}đ</option>))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-emerald-500">▼</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                    <UserIcon size={14} className="text-violet-500" /> Chọn Cư dân
                  </label>
                  <div className="relative group">
                    <select {...register('userId')} disabled={!selectedBranchId} className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-black uppercase outline-none focus:bg-white focus:border-violet-500 transition-all appearance-none cursor-pointer">
                        <option value="0">-- CHỌN CƯ DÂN --</option>
                        {filteredUsers.map(user => (
                        <option key={user.id} value={user.id} className={user.hasActiveContract ? 'text-slate-300' : ''}>
                            {user.fullName} {user.hasActiveContract ? '(CÓ HĐ)' : ''}
                        </option>
                        ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-violet-500">▼</div>
                  </div>
                  
                  {/* Cảnh báo nếu user đang thuê phòng khác */}
                  {selectedUserStatus?.hasActiveContract && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2">
                      <AlertTriangle size={16} className="text-amber-600" />
                      <div>
                         <p className="text-[9px] font-black text-amber-700 uppercase italic">Lưu ý: Cư dân này đang có hợp đồng hiệu lực</p>
                         <p className="text-[8px] text-amber-600/70">Việc tạo mới có thể gây trùng lặp dữ liệu.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid: Ngày tháng */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hiệu lực từ</label>
                  <input type="date" {...register('startDate')} className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Đến ngày (Optional)</label>
                  <input type="date" {...register('endDate')} className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all" />
                </div>
              </div>

              {/* Tiền cọc */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Khoản tiền đặt cọc</label>
                <div className="relative group">
                  <input type="number" {...register('deposit')} placeholder="0" className="w-full pl-6 pr-12 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-xs font-black outline-none focus:bg-white focus:border-blue-500 transition-all" />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase group-focus-within:text-blue-500">VNĐ</span>
                </div>
              </div>

              {/* KHU VỰC UPLOAD ẢNH HỢP ĐỒNG */}
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Bản scan hợp đồng giấy</label>
                 
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/10 transition-all group relative overflow-hidden">
                    <div className="flex flex-col items-center justify-center relative min-h-[160px] cursor-pointer z-10">
                    
                    {scanImage ? (
                        <div className="relative w-full h-48 group/img">
                            {/* Preview Ảnh */}
                            <img src={scanImage} alt="Scan Preview" className="w-full h-full object-contain rounded-2xl shadow-lg bg-white" />
                            
                            {/* Overlay nút đổi ảnh */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center rounded-2xl transition-all backdrop-blur-sm">
                                <UploadCloud className="text-white mb-2" size={32} />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">Nhấn để thay đổi ảnh</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 bg-white rounded-full shadow-md mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud size={32} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Kéo thả hoặc nhấn để tải lên</span>
                            <p className="text-[8px] text-slate-300 mt-2 font-bold uppercase italic">Hỗ trợ định dạng: JPG, PNG (Max 5MB)</p>
                        </>
                    )}

                    {/* Input File ẩn */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => { 
                            if (e.target.files?.[0]) { 
                                setSelectedFile(e.target.files[0]); 
                                setScanImage(URL.createObjectURL(e.target.files[0])); 
                            } 
                        }} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    </div>
                 </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t flex justify-end gap-6 bg-slate-50/80 backdrop-blur-sm">
          <button onClick={onClose} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all hover:bg-red-50 rounded-2xl">Hủy thao tác</button>
          <button 
            form="contract-form" 
            type="submit" 
            disabled={isSubmitting} 
            className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-300 active:scale-95 group"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] group-hover:bg-white"></div>}
            Lưu hồ sơ hợp đồng
          </button>
        </div>
      </div>
    </div>
  );
}