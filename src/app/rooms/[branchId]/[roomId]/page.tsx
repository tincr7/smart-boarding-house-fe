'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { Branch, branchApi } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import RoomModal from '@/components/rooms/RoomModal';
import { 
  ArrowLeft, Loader2, Edit, Home as HomeIcon, 
  Maximize, DollarSign, MapPin, Archive, 
  CheckCircle2, PlayCircle, Building2 
} from 'lucide-react';

export default function RoomDetailPage() {
  const { user, isAdmin } = useAuth(); // Lấy thông tin user để kiểm tra quyền truy cập chi nhánh
  const params = useParams();
  const router = useRouter();
  
  const branchId = Number(params.branchId);
  const roomId = Number(params.roomId);

  const [room, setRoom] = useState<Room | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Kiểm tra quyền truy cập chi nhánh (An ninh đa chi nhánh)
      if (user?.branchId && user.branchId !== branchId) {
        alert('Bạn không có quyền truy cập dữ liệu phòng của chi nhánh khác!');
        router.push('/dashboard');
        return;
      }

      const [roomData, branchData] = await Promise.all([
        roomApi.getDetail(roomId),
        branchApi.getDetail(branchId)
      ]);

      // Nếu phòng đã bị xóa mềm, đẩy về danh sách
      if (roomData.deletedAt) {
        router.push(`/rooms/${branchId}`);
        return;
      }

      setRoom(roomData);
      setCurrentBranch(branchData);
    } catch (error) {
      console.error("Lỗi tải chi tiết phòng:", error);
      router.push(`/rooms/${branchId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId && branchId && user) fetchData();
  }, [roomId, branchId, user]);

  const handleUpdate = async (data: any) => {
    try {
      await roomApi.update(roomId, data);
      alert('Cập nhật thông tin phòng thành công!');
      fetchData(); 
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Lỗi khi cập nhật phòng.');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Bạn có chắc chắn muốn ngừng kinh doanh phòng "${room?.roomNumber}"?`)) {
      try {
        await roomApi.delete(roomId); 
        alert('Đã chuyển phòng vào kho lưu trữ thành công!');
        router.push(`/rooms/${branchId}`);
      } catch (error) {
        alert('Không thể xóa phòng đang có cư dân thuê!');
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!room) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase text-xs text-slate-400 bg-slate-50 tracking-widest italic">
      Dữ liệu phòng không tồn tại
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        {/* Điều hướng */}
        <button 
          onClick={() => router.push(`/rooms/${branchId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-8 font-black uppercase text-[10px] tracking-widest transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Quay lại danh sách chi nhánh
        </button>

        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* MEDIA SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Khối Ảnh */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden h-[400px] relative group">
              {room.image ? (
                <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 italic text-[10px] font-black uppercase">
                  Chưa có hình ảnh
                </div>
              )}
              <div className="absolute top-6 left-6">
                <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 shadow-2xl ${
                  room.status === 'AVAILABLE' ? 'bg-green-500 border-green-400 text-white' : 'bg-red-500 border-red-400 text-white'
                }`}>
                  {room.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Đã thuê'}
                </span>
              </div>
            </div>

            {/* Khối Video */}
            <div className="bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-800 overflow-hidden h-[400px] flex items-center justify-center group relative">
              <div className="absolute top-6 left-6 z-10">
                <span className="px-4 py-1.5 rounded-xl bg-slate-800/80 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-700">
                  <PlayCircle size={12} className="text-blue-400" /> Video thực tế
                </span>
              </div>
              {/* Giả lập video - Bạn có thể thay field này theo DB thực tế của bạn */}
              {room.image ? ( 
                <div className="w-full h-full flex items-center justify-center bg-slate-800/50 backdrop-blur-sm italic text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                  Video đang được xử lý...
                </div>
              ) : (
                <div className="text-center p-6">
                  <PlayCircle size={48} className="text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-600 font-black uppercase text-[9px] tracking-widest italic">Nguồn dữ liệu chưa sẵn sàng</p>
                </div>
              )}
            </div>
          </div>

          {/* THÔNG TIN CHI TIẾT */}
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-10 md:p-16">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16">
               <div>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                    <Building2 size={16} /> Cơ sở vận hành: {currentBranch?.name}
                  </div>
                  <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none italic">
                    Phòng {room.roomNumber}
                  </h1>
                  <p className="flex items-center gap-2 text-slate-400 font-bold mt-6 uppercase text-[11px] tracking-widest">
                    <MapPin size={16} className="text-blue-500" /> {currentBranch?.address}
                  </p>
               </div>
               
               {isAdmin && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditModalOpen(true)} 
                      className="p-5 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95 group"
                      title="Chỉnh sửa phòng"
                    >
                      <Edit size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                    <button 
                      onClick={handleDelete} 
                      className="p-5 bg-white text-red-500 rounded-2xl hover:bg-red-50 transition-all border border-slate-200 shadow-sm"
                      title="Ngừng kinh doanh"
                    >
                      <Archive size={20} />
                    </button>
                  </div>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Thông số & Tiện ích */}
               <div className="lg:col-span-2 space-y-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="p-8 bg-blue-50/40 rounded-[2rem] border border-blue-100 flex items-center gap-6 shadow-sm">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 shadow-blue-50"><DollarSign size={24} /></div>
                        <div>
                          <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Đơn giá thuê</span>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                            {Number(room.price).toLocaleString()} <span className="text-sm font-bold ml-1">đ/tháng</span>
                          </p>
                        </div>
                     </div>
                     <div className="p-8 bg-violet-50/40 rounded-[2rem] border border-violet-100 flex items-center gap-6 shadow-sm">
                        <div className="p-4 bg-white rounded-2xl shadow-sm text-violet-600 shadow-violet-50"><Maximize size={24} /></div>
                        <div>
                          <span className="block text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Diện tích sàn</span>
                          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
                            {room.area} <span className="text-sm font-bold ml-1">m²</span>
                          </p>
                        </div>
                     </div>
                  </div>

                  <div>
                     <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Hệ thống tiện ích tích hợp
                     </h3>
                     <div className="flex flex-wrap gap-3">
                        {room.utilities && room.utilities.length > 0 ? room.utilities.map((item: string, idx: number) => (
                           <span key={idx} className="px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-[11px] font-black text-slate-500 transition-all hover:border-blue-200 hover:text-blue-600 shadow-sm uppercase tracking-tighter">
                              ✨ {item}
                           </span>
                        )) : <p className="text-slate-400 italic text-xs font-bold uppercase">Nội thất đang được cập nhật...</p>}
                     </div>
                  </div>
               </div>

               {/* Mô tả chi tiết */}
               <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                    <HomeIcon size={120} className="text-slate-400" />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 relative z-10">Mô tả vận hành</h3>
                  <div className="text-sm font-bold text-slate-600 leading-relaxed relative z-10 italic">
                     {room.description || "Phòng được thiết kế tối ưu ánh sáng tự nhiên, trang bị hệ thống SmartLock và an ninh 24/7. Phù hợp cho hộ gia đình và cư dân văn minh."}
                  </div>
               </div>
            </div>
          </div>
        </div>
        
        {/* Modal chỉnh sửa */}
        {isAdmin && (
          <RoomModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            onSubmit={handleUpdate} 
            branchId={branchId} 
            initialData={room} 
          />
        )}
      </main>
    </div>
  );
}