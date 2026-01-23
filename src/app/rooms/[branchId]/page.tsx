'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import RoomModal from '@/components/rooms/RoomModal';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Search, Maximize, Plus, ArrowLeft, MapPin, Trash2 } from 'lucide-react';

export default function RoomListPage() {
  const { isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  const branchId = Number(params.branchId);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  const [filterPrice, setFilterPrice] = useState('ALL');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allRooms, branchData] = await Promise.all([
        roomApi.getAll(),
        branchApi.getDetail(branchId)
      ]);

      // LỌC XÓA MỀM: Chỉ lấy những phòng thuộc chi nhánh và CHƯA BỊ XÓA
      const branchRooms = allRooms.filter(r => r.branchId === branchId && !r.deletedAt);
      setRooms(branchRooms);
      setCurrentBranch(branchData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchData();
  }, [branchId]);

  // HÀM XỬ LÝ XÓA MỀM PHÒNG
  const handleDeleteRoom = async (e: React.MouseEvent, id: number, roomNumber: string) => {
    e.stopPropagation(); // Ngăn chặn sự kiện click vào Card gây chuyển trang
    if (confirm(`Bạn có chắc chắn muốn ngừng kinh doanh và đưa phòng "${roomNumber}" vào kho lưu trữ?`)) {
      try {
        await roomApi.delete(id); // Backend xử lý gán deletedAt
        
        // Cập nhật UI ngay lập tức để Card biến mất
        setRooms(prev => prev.filter(r => r.id !== id));
        alert('Đã chuyển phòng vào mục lưu trữ thành công!');
      } catch (error) {
        alert('Không thể xóa phòng đang có hợp đồng hoạt động!');
      }
    }
  };

  const handleCreateRoom = async (data: any) => {
    await roomApi.create(data);
    fetchData();
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchName = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || room.status === filterStatus;
      const price = Number(room.price);
      let matchPrice = true;
      if (filterPrice === 'LOW') matchPrice = price < 3000000;
      if (filterPrice === 'HIGH') matchPrice = price >= 3000000;
      return matchName && matchStatus && matchPrice;
    });
  }, [rooms, searchTerm, filterStatus, filterPrice]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="mb-8 space-y-4">
          <button 
            onClick={() => router.push('/rooms')} 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft size={18} /> Quay lại danh sách Chi nhánh
          </button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {currentBranch ? currentBranch.name : 'Đang tải...'}
              </h1>
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1 font-medium">
                <MapPin size={14} className="text-blue-500" />
                {currentBranch ? currentBranch.address : 'Đang tải địa chỉ...'}
              </p>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95"
              >
                <Plus size={18} /> Thêm phòng mới
              </button>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm mã phòng nhanh..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* ... Select filters giữ nguyên nhưng sửa style bo góc tương ứng ... */}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredRooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => router.push(`/rooms/${branchId}/${room.id}`)}
                className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1.5 transition-all group relative"
              >
                <div className="h-44 bg-slate-100 relative">
                  {room.image ? (
                     <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 font-bold text-[10px] uppercase">No Image</div>
                  )}
                  
                  {/* TRẠNG THÁI PHÒNG */}
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-md uppercase tracking-wider ${
                    room.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {room.status === 'AVAILABLE' ? 'Trống' : 'Đã thuê'}
                  </span>

                  {/* NÚT XÓA MỀM (Soft Delete) */}
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDeleteRoom(e, room.id, room.roomNumber)}
                      className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm"
                      title="Xóa mềm"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-black text-lg text-slate-800 group-hover:text-blue-600 transition-colors uppercase">
                    {room.roomNumber}
                  </h3>
                  <div className="mt-3 flex flex-col gap-1">
                    <p className="text-sm font-black text-blue-600">
                      {Number(room.price).toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 uppercase">
                      <Maximize size={12} className="text-slate-300" /> Diện tích: {room.area} m²
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRooms.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Chưa có phòng nào hoạt động tại đây.</p>
              </div>
            )}
          </div>
        )}

        <RoomModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateRoom}
          branchId={branchId}
        />
      </main>
    </div>
  );
}