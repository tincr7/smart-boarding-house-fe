'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { Branch, branchApi } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import RoomModal from '@/components/rooms/RoomModal';
import { ArrowLeft, Loader2, Edit, Trash2, Home as HomeIcon, Maximize, DollarSign, MapPin, Archive } from 'lucide-react'; // Thêm Archive

export default function RoomDetailPage() {
  const { isAdmin } = useAuth();
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
      const [roomData, branchData] = await Promise.all([
        roomApi.getDetail(roomId),
        branchApi.getDetail(branchId)
      ]);

      // Nếu phòng đã bị xóa mềm, không cho phép xem ở trang chi tiết thông thường
      if (roomData.deletedAt) {
        alert('Phòng này đã ngừng kinh doanh và nằm trong kho lưu trữ.');
        router.push(`/rooms/${branchId}`);
        return;
      }

      setRoom(roomData);
      setCurrentBranch(branchData);
    } catch (error) {
      console.error(error);
      alert('Không thể tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId && branchId) fetchData();
  }, [roomId, branchId]);

  const handleUpdate = async (data: any) => {
    try {
      await roomApi.update(roomId, data);
      alert('Cập nhật thành công!');
      fetchData(); 
    } catch (error) {
      alert('Lỗi khi cập nhật phòng.');
    }
  };

  // CẬP NHẬT LOGIC XÓA MỀM
  const handleDelete = async () => {
    if (confirm(`Bạn có chắc chắn muốn ngừng kinh doanh và đưa phòng "${room?.roomNumber}" vào kho lưu trữ?`)) {
      try {
        // Backend thực hiện gán deletedAt thay vì xóa row
        await roomApi.delete(roomId); 
        alert('Đã chuyển phòng vào mục lưu trữ thành công!');
        router.push(`/rooms/${branchId}`); // Quay lại danh sách đã lọc dữ liệu sạch
      } catch (error) {
        alert('Không thể xóa phòng đang có hợp đồng hoạt động!');
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">Không tìm thấy thông tin phòng</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <button 
          onClick={() => router.push(`/rooms/${branchId}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-bold transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách phòng
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
          
          <div className="h-80 bg-slate-200 w-full relative">
            {room.image ? (
              <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-200">
<HomeIcon size={80} strokeWidth={1.5} />              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent p-10 flex flex-col justify-end">
              <div className="flex items-center gap-3 mb-2">
                 <h1 className="text-5xl font-black text-white uppercase tracking-tighter">{room.roomNumber}</h1>
                 <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 shadow-lg ${
                    room.status === 'AVAILABLE' 
                    ? 'bg-green-500 border-green-400 text-white' 
                    : 'bg-red-500 border-red-400 text-white'
                 }`}>
                    {room.status === 'AVAILABLE' ? 'Phòng trống' : 'Đã cho thuê'}
                 </span>
              </div>
              
              <div className="text-white/90">
                <p className="text-xl font-black uppercase tracking-wide">
                  {currentBranch ? currentBranch.name : `Chi nhánh #${branchId}`}
                </p>
                <p className="text-sm text-white/60 flex items-center gap-1.5 mt-2 font-medium">
                  <MapPin size={16} className="text-blue-400" />
                  {currentBranch ? currentBranch.address : 'Đang tải địa chỉ...'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10">
            {isAdmin && (
              <div className="flex justify-end gap-3 mb-10 border-b border-slate-100 pb-8">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-700 hover:border-blue-200 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                >
                  <Edit size={16} /> Chỉnh sửa thông tin
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 border-2 border-red-100"
                >
                  <Archive size={16} /> Ngừng kinh doanh
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-10">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-blue-50 rounded-[1.5rem] text-blue-600 shadow-inner">
                    <DollarSign size={28} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Giá thuê hàng tháng</h3>
                    <p className="text-4xl font-black text-slate-900 tracking-tight">
                      {Number(room.price).toLocaleString('vi-VN')} <span className="text-lg font-bold text-slate-400">đ/tháng</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-purple-50 rounded-[1.5rem] text-purple-600 shadow-inner">
                    <Maximize size={28} />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Diện tích sử dụng</h3>
                    <p className="text-3xl font-black text-slate-900 tracking-tight">{room.area} <span className="text-lg font-bold text-slate-400">m²</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-slate-100 h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <HomeIcon size={120} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                   Thông tin tiện ích & Mô tả
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium relative z-10">
                  {room.description || "Phòng hiện chưa được cập nhật mô tả chi tiết. Vui lòng bấm 'Chỉnh sửa' để bổ sung các thông tin về nội thất, thiết bị IoT và các quy định riêng của phòng này."}
                </p>
              </div>
            </div>
          </div>
        </div>
        
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