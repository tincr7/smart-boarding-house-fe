'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import RoomModal from '@/components/rooms/RoomModal';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Search, Maximize, Plus, ArrowLeft, 
  MapPin, Trash2, Home, Building2 
} from 'lucide-react';

export default function BranchRoomListPage() {
  const { user, isAdmin } = useAuth(); // Lấy thông tin user để kiểm tra quyền hạn
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
      
      // Kiểm tra quyền truy cập: Admin cơ sở không được xem chi nhánh khác
      if (user?.branchId && user.branchId !== branchId) {
        alert('Bạn không có quyền quản lý chi nhánh này!');
        router.push('/dashboard');
        return;
      }

      const [allRooms, branchData] = await Promise.all([
        roomApi.getAll(branchId), // Truyền branchId vào API để lọc từ Backend
        branchApi.getDetail(branchId)
      ]);

      // LỌC DỮ LIỆU: Chỉ lấy những phòng CHƯA BỊ XÓA
      const activeRooms = allRooms.filter(r => !r.deletedAt);
      setRooms(activeRooms);
      setCurrentBranch(branchData);
    } catch (error) {
      console.error("Lỗi tải danh sách phòng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId && user) fetchData();
  }, [branchId, user]);

  const handleDeleteRoom = async (e: React.MouseEvent, id: number, roomNumber: string) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn đưa phòng "${roomNumber}" vào danh sách lưu trữ?`)) {
      try {
        await roomApi.delete(id); 
        setRooms(prev => prev.filter(r => r.id !== id));
        alert('Đã chuyển phòng vào mục lưu trữ thành công!');
      } catch (error) {
        alert('Không thể xóa phòng đang có cư dân thuê!');
      }
    }
  };

  const handleCreateRoom = async (data: any) => {
    try {
      await roomApi.create({ ...data, branchId });
      alert('Thêm phòng mới thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Lỗi khi tạo phòng. Vui lòng kiểm tra mã phòng trùng lặp.');
    }
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

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="mb-10 space-y-6">
          <button 
            onClick={() => router.push('/rooms')} 
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Quay lại danh sách chi nhánh
          </button>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                <Building2 size={14} /> Cơ sở vận hành
              </div>
              <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic">
                {currentBranch?.name}
              </h1>
              <p className="text-slate-500 text-xs flex items-center gap-1 mt-2 font-bold uppercase tracking-wide">
                <MapPin size={14} className="text-blue-500" />
                {currentBranch?.address}
              </p>
            </div>
            
            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
              >
                <Plus size={18} /> Thêm phòng mới
              </button>
            )}
          </div>

          {/* Bộ lọc phòng */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="TÌM MÃ PHÒNG NHANH..." 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-[10px] font-black uppercase tracking-widest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border-transparent rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">TẤT CẢ TRẠNG THÁI</option>
              <option value="AVAILABLE">CÒN TRỐNG</option>
              <option value="OCCUPIED">ĐÃ CHO THUÊ</option>
              <option value="MAINTENANCE">ĐANG BẢO TRÌ</option>
            </select>

            <select 
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="bg-slate-50 border-transparent rounded-xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">TẤT CẢ MỨC GIÁ</option>
              <option value="LOW">DƯỚI 3 TRIỆU</option>
              <option value="HIGH">TRÊN 3 TRIỆU</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {filteredRooms.map((room) => (
            <div 
              key={room.id}
              onClick={() => router.push(`/rooms/${branchId}/${room.id}`)}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all group relative"
            >
              <div className="h-48 bg-slate-100 relative">
                {room.image ? (
                   <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-slate-50">
                      <Home size={48} className="text-slate-200" />
                   </div>
                )}
                
                {/* Badge trạng thái */}
                <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-xl text-[9px] font-black text-white shadow-lg uppercase tracking-widest border-2 ${
                  room.status === 'AVAILABLE' ? 'bg-green-500 border-green-400' : 'bg-red-500 border-red-400'
                }`}>
                  {room.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Đã thuê'}
                </div>

                {isAdmin && (
                  <button 
                    onClick={(e) => handleDeleteRoom(e, room.id, room.roomNumber)}
                    className="absolute top-4 right-4 p-3 bg-white/95 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="p-6">
                <h3 className="font-black text-xl text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                  Phòng {room.roomNumber}
                </h3>
                <div className="mt-4 flex flex-col gap-2">
                  <p className="text-lg font-black text-blue-600 tracking-tighter">
                    {Number(room.price).toLocaleString('vi-VN')} <span className="text-[10px] text-slate-400 ml-0.5">đ/tháng</span>
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                     <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Maximize size={14} className="text-blue-500" /> {room.area} m²
                     </span>
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Detail →</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredRooms.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase tracking-widest italic">Không tìm thấy phòng phù hợp trong phạm vi quản lý</p>
            </div>
          )}
        </div>

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