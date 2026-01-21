'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { Branch, branchApi } from '@/services/branch.api'; // 1. Import thêm Branch API
import Sidebar from '@/components/shared/Sidebar';
import RoomModal from '@/components/rooms/RoomModal';
import { ArrowLeft, Loader2, Edit, Trash2, Home as HomeIcon, Maximize, DollarSign, MapPin } from 'lucide-react'; // Thêm MapPin

export default function RoomDetailPage() {
  const { isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  const branchId = Number(params.branchId);
  const roomId = Number(params.roomId);

  const [room, setRoom] = useState<Room | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null); // 2. State lưu chi nhánh
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Hàm tải dữ liệu
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 3. Gọi song song cả 2 API để lấy Phòng và Chi nhánh
      const [roomData, branchData] = await Promise.all([
        roomApi.getDetail(roomId),
        branchApi.getDetail(branchId)
      ]);

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
      console.error(error);
      alert('Lỗi khi cập nhật phòng.');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Bạn có chắc chắn muốn xóa phòng ${room?.roomNumber}?`)) {
      try {
        await roomApi.delete(roomId);
        alert('Đã xóa phòng thành công.');
        router.push(`/rooms/${branchId}`);
      } catch (error) {
        console.error(error);
        alert('Không thể xóa phòng.');
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!room) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy phòng</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <button 
          onClick={() => router.push(`/rooms/${branchId}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Quay lại danh sách
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header Cover Image */}
          <div className="h-64 bg-slate-200 w-full relative group">
            {room.image ? (
              <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                <HomeIcon size={64} opacity={0.5} />
              </div>
            )}
            
            {/* Lớp phủ đen mờ để chữ dễ đọc */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 flex flex-col justify-end">
              <h1 className="text-4xl font-bold text-white mb-2">{room.roomNumber}</h1>
              
              {/* 4. HIỂN THỊ TÊN CHI NHÁNH & ĐỊA CHỈ */}
              <div className="text-white/90">
                <p className="text-lg font-medium">
                  {currentBranch ? currentBranch.name : `Chi nhánh #${branchId}`}
                </p>
                <p className="text-sm text-white/70 flex items-center gap-1 mt-1">
                  <MapPin size={14} />
                  {currentBranch ? currentBranch.address : 'Đang tải địa chỉ...'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {isAdmin ?? (
            <div className="flex justify-end gap-3 mb-8 border-b border-slate-100 pb-6">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
              >
                <Edit size={16} /> Chỉnh sửa
              </button>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors border border-transparent"
              >
                <Trash2 size={16} /> Xóa phòng
              </button>
            </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                {/* Giá tiền */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Giá thuê</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {Number(room.price).toLocaleString('vi-VN')} đ <span className="text-base font-normal text-slate-500">/ tháng</span>
                    </p>
                  </div>
                </div>
                
                {/* Diện tích */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                    <Maximize size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Diện tích</h3>
                    <p className="text-2xl font-bold text-slate-900">{room.area} m²</p>
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="flex items-start gap-4">
                   <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                    <HomeIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Trạng thái hiện tại</h3>
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${
                      room.status === 'AVAILABLE' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {room.status === 'AVAILABLE' ? 'Phòng trống (Sẵn sàng)' : 'Đang có người thuê'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Mô tả thêm</h3>
                <p className="text-slate-700 leading-relaxed">
                  {room.description || "Chưa có mô tả chi tiết cho phòng này. Bạn có thể cập nhật thêm thông tin về nội thất, hướng phòng, tiện ích đi kèm bằng cách bấm nút Chỉnh sửa."}
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