'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, UploadCloud, Calendar, MapPin, Home, User as UserIcon } from 'lucide-react';
import { Contract, CreateContractDto } from '@/services/contract.api';
import { uploadApi } from '@/services/upload.api';
import { roomApi, Room } from '@/services/room.api';
import { userApi, User } from '@/services/user.api';
import { branchApi, Branch } from '@/services/branch.api'; // Import Branch API

// Validate dữ liệu
const contractSchema = z.object({
  branchId: z.coerce.number().optional(), // Trường này chỉ để lọc UI, ko gửi API
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

export default function ContractModal({ isOpen, onClose, onSubmit, initialData }: ContractModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Data States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    watch,
    formState: { errors } 
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as any,
  });

  // Theo dõi BranchId đang chọn để lọc phòng
  const selectedBranchId = watch('branchId');

  // Load tất cả dữ liệu cần thiết khi mở Modal
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const [branchData, roomData, userData] = await Promise.all([
            branchApi.getAll(),
            roomApi.getAll(),
            userApi.getAll()
          ]);
          setBranches(branchData);
          setAllRooms(roomData);
          const tenantsOnly = userData.filter(user => user.role !== 'ADMIN');
          setUsers(tenantsOnly);
        } catch (error) {
          console.error("Lỗi tải dữ liệu:", error);
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();

      // Setup Form Data
      if (initialData) {
        // Nếu là Edit: Cần set cả BranchId tương ứng với phòng đó
        const currentRoom = initialData.room; // Giả sử API trả về chi tiết room trong contract
        // Nếu API contract ko trả room.branchId, bạn có thể phải tìm trong list rooms
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

  // Logic lọc phòng: Theo Branch đã chọn + Status = AVAILABLE
  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) return [];
    
    return allRooms.filter(room => {
      const belongToBranch = room.branchId === Number(selectedBranchId);
      
      // Nếu đang Sửa hợp đồng: Phải hiện cả cái phòng hiện tại (dù nó đang OCCUPIED/RENTED)
      const isCurrentRoom = initialData && room.id === initialData.roomId;
      
      // Nếu Tạo mới: Chỉ hiện phòng AVAILABLE
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
    setIsSubmitting(true);
    try {
      // 1. Lấy ảnh cũ (nếu đang sửa)
      let uploadedUrl = initialData?.scanImage || null;

      // 2. Nếu có chọn file mới -> Upload
      if (selectedFile) {
        console.log("1. Bắt đầu upload file:", selectedFile.name);
        
        const res = await uploadApi.upload(selectedFile, 'contracts');
        
        console.log("2. Kết quả API Upload trả về:", res);

        // --- SỬA LOGIC LẤY URL CHO CHẮC CHẮN ---
        // Tùy vào Backend upload (Cloudinary, S3, hay Local), kết quả trả về khác nhau.
        // Đoạn này sẽ kiểm tra tất cả các trường hợp phổ biến.
        if (typeof res === 'string') {
            uploadedUrl = res; // Trường hợp API trả về trực tiếp chuỗi URL
        } else if (res?.secure_url) {
            uploadedUrl = res.secure_url; // Cloudinary
        } else if (res?.url) {
            uploadedUrl = res.url; // Các service thông thường
        } else if (res?.path) {
            uploadedUrl = res.path; // Local upload
        } else if (res?.data?.url) {
            uploadedUrl = res.data.url; // Trường hợp bọc trong object data
        }
        
        console.log("3. URL ảnh cuối cùng sẽ gửi đi:", uploadedUrl);
      }

      // 3. Tạo Payload
      const payload = {
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        deposit: Number(data.deposit),
        userId: Number(data.userId),
        roomId: Number(data.roomId),
        
        // Gửi URL ảnh (nếu ko có thì gửi null)
        scanImage: uploadedUrl || null
      };

      console.log('4. Payload gửi lên API Create/Update:', payload);

      await onSubmit(payload);
      onClose();
    } catch (error: any) {
      console.error("Lỗi:", error);
      const msg = error?.response?.data?.message || 'Lỗi xử lý';
      alert(Array.isArray(msg) ? msg.join('\n') : msg);
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
            {initialData ? 'Cập nhật Hợp đồng' : 'Tạo Hợp đồng Thuê'}
          </h2>
          <button onClick={onClose}><X size={24} className="text-slate-400 hover:text-red-500" /></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoadingData ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            <form id="contract-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              
              {/* --- 1. CHỌN KHU TRỌ (BRANCH) TRƯỚC --- */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                   <MapPin size={16} /> Chọn Khu trọ / Chi nhánh
                </label>
                <select 
                  {...register('branchId')} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Chọn chi nhánh trước --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {b.address}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* --- 2. CHỌN PHÒNG (ĐÃ LỌC) --- */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Home size={16} /> Chọn Phòng
                  </label>
                  <select 
                    {...register('roomId')} 
                    disabled={!selectedBranchId} // Disable nếu chưa chọn chi nhánh
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn phòng trống --</option>
                    {filteredRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.roomNumber} - {Number(room.price).toLocaleString()}đ
                        </option>
                      ))
                    }
                  </select>
                  {selectedBranchId && filteredRooms.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Khu trọ này đã hết phòng trống!</p>
                  )}
                  {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId.message}</p>}
                </div>

                {/* --- 3. CHỌN KHÁCH --- */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <UserIcon size={16} /> Khách thuê
                  </label>
                  <select 
                    {...register('userId')} 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.phone})
                      </option>
                    ))}
                  </select>
                  {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>}
                </div>
              </div>

              {/* Hàng 3: Thời gian */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="date" {...register('startDate')} className="w-full pl-10 pr-3 py-2 border rounded-lg" />
                  </div>
                  {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input type="date" {...register('endDate')} className="w-full pl-10 pr-3 py-2 border rounded-lg" />
                  </div>
                  {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate.message}</p>}
                </div>
              </div>

              {/* Tiền cọc */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiền đặt cọc (VNĐ)</label>
                <input type="number" {...register('deposit')} className="w-full px-3 py-2 border rounded-lg" placeholder="Nhập số tiền..." />
                {errors.deposit && <p className="text-red-500 text-xs mt-1">{errors.deposit.message}</p>}
              </div>

              {/* Upload ảnh */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bản scan hợp đồng</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 relative cursor-pointer">
                  {scanImage ? (
                     <div className="relative w-full h-48">
                        <img src={scanImage} alt="Hợp đồng" className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                          Thay đổi ảnh
                        </div>
                     </div>
                  ) : (
                    <>
                      <UploadCloud size={32} className="mb-2" />
                      <span className="text-sm">Bấm để tải ảnh lên</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Hủy bỏ</button>
          <button form="contract-form" type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2">
            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
            {initialData ? 'Lưu thay đổi' : 'Tạo hợp đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}