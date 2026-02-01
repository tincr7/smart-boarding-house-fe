'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import RoomModal from '@/components/rooms/RoomModal';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; 
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Search, Maximize, Plus, Edit, // 👈 Đã thêm Edit
  MapPin, Trash2, Home, Building2, SlidersHorizontal, ShieldCheck
} from 'lucide-react';

function RoomListContent() {
  const { user, isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const branchIdParam = searchParams.get('branchId');
  const branchId = branchIdParam ? Number(branchIdParam) : undefined;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  
  // State Modal & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null); // 👈 Thêm state lưu phòng đang sửa

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  const [filterPrice, setFilterPrice] = useState('ALL');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (user?.branchId && branchId && Number(user.branchId) !== branchId) {
        alert('⛔ Bạn không có quyền quản lý chi nhánh này!');
        router.push('/dashboard/branches');
        return;
      }

      const [allRooms, branchData] = await Promise.all([
        roomApi.getAll(branchId), 
        branchId ? branchApi.getDetail(branchId) : Promise.resolve(null)
      ]);

      setRooms(allRooms.filter((r: any) => !r.deletedAt));
      setCurrentBranch(branchData);
    } catch (error) {
      console.error("Lỗi tải phòng:", error);
    } finally {
      setLoading(false);
    }
  }, [branchId, user, router]);

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  // --- ACTIONS ---

  const handleDeleteRoom = async (e: React.MouseEvent, id: number, roomNumber: string) => {
    e.stopPropagation(); // Ngăn click nhầm vào card
    if (confirm(`🗑️ Đưa phòng "${roomNumber}" vào thùng rác?`)) {
      try {
        await roomApi.delete(id); 
        setRooms(prev => prev.filter(r => r.id !== id));
        alert('✅ Đã xóa thành công!');
      } catch (error) {
        alert('❌ Lỗi xóa phòng.');
      }
    }
  };

  // Mở Modal Tạo mới
  const handleOpenCreate = () => {
    setEditingRoom(null); // Reset edit state
    setIsModalOpen(true);
  };

  // Mở Modal Sửa
  const handleOpenEdit = (e: React.MouseEvent, room: Room) => {
    e.stopPropagation(); // Ngăn chuyển trang
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  // Xử lý Submit chung (Create + Update)
  const handleFormSubmit = async (data: any) => {
    try {
      if (editingRoom) {
        // Logic Cập nhật
        await roomApi.update(editingRoom.id, data);
        alert('✅ Cập nhật phòng thành công!');
      } else {
        // Logic Tạo mới
        const finalBranchId = branchId || user?.branchId;
        if (!finalBranchId) {
          alert("⚠️ Vui lòng chọn chi nhánh!");
          return;
        }
        await roomApi.create({ ...data, branchId: finalBranchId });
        alert('✅ Tạo phòng mới thành công!');
      }
      setIsModalOpen(false);
      fetchData(); // Reload lại dữ liệu
    } catch (error) {
      alert('❌ Lỗi xử lý dữ liệu.');
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
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Đang kiểm kê phòng...</p>
    </div>
  );

  return (
    <>
      <div className="p-8 space-y-8 selection:bg-blue-100">
        
        {/* Breadcrumbs */}
        <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Breadcrumbs 
            items={[
              { label: 'Chi nhánh', href: '/dashboard/branches' },
              { label: currentBranch ? `Phòng: ${currentBranch.name}` : 'Tất cả phòng' }
            ]} 
          />
        </div>

        <div className="mb-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
                <ShieldCheck size={18} className="fill-blue-50" /> Quản lý tài sản số
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                {currentBranch ? currentBranch.name : 'Toàn bộ danh sách phòng'}
              </h1>
              {currentBranch && (
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-2 bg-slate-50 w-fit px-3 py-1 rounded-md">
                  <MapPin size={14} className="text-blue-500"/> {currentBranch.address}
                </p>
              )}
            </div>
            
            {isAdmin && (
              <button 
                onClick={handleOpenCreate} // Dùng hàm mới handleOpenCreate
                className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Khởi tạo phòng mới
              </button>
            )}
          </div>

          {/* Search Toolbar */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap gap-6 items-center">
            <div className="relative flex-1 min-w-[300px] group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Tìm mã phòng nhanh (ví dụ: 101)..." 
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent rounded-2xl outline-none text-[11px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
               <SlidersHorizontal size={20} className="text-slate-300 hidden md:block" />
               <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-[10px] font-black uppercase outline-none cursor-pointer hover:border-slate-200 transition-all"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="AVAILABLE">🍃 Sẵn sàng</option>
                <option value="OCCUPIED">🏠 Đã thuê</option>
              </select>

              <select 
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-[10px] font-black uppercase outline-none cursor-pointer hover:border-slate-200 transition-all"
              >
                <option value="ALL">Mức giá</option>
                <option value="LOW">Dưới 3 triệu</option>
                <option value="HIGH">Trên 3 triệu</option>
              </select>
            </div>
          </div>
        </div>

        {/* LIST GRID */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => router.push(`/dashboard/rooms/${room.id}`)} // 👈 THÊM: Click để xem chi tiết
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group relative hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-2 transition-all duration-500 cursor-pointer"
              >
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  {room.image ? (
                     <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-slate-50"><Home size={56} className="text-slate-200" /></div>
                  )}
                  
                  <div className={`absolute top-5 left-5 px-4 py-2 rounded-xl text-[9px] font-black text-white shadow-lg uppercase tracking-widest border-2 ${
                    room.status === 'AVAILABLE' ? 'bg-emerald-500 border-emerald-400' : 'bg-red-500 border-red-400'
                  }`}>
                    {room.status === 'AVAILABLE' ? 'Trống' : 'Đã thuê'}
                  </div>

                  {isAdmin && (
                    <div className="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      {/* 👇 NÚT SỬA NHANH */}
                      <button 
                        onClick={(e) => handleOpenEdit(e, room)}
                        className="p-3 bg-white/90 text-blue-600 rounded-xl shadow-xl hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Edit size={18} />
                      </button>

                      {/* NÚT XÓA */}
                      <button 
                        onClick={(e) => handleDeleteRoom(e, room.id, room.roomNumber)}
                        className="p-3 bg-white/90 text-red-500 rounded-xl shadow-xl hover:bg-red-600 hover:text-white transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-8">
                  <h3 className="font-black text-3xl text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">P.{room.roomNumber}</h3>
                  <p className="text-2xl font-black text-blue-600 mt-2 italic">
                    {Number(room.price).toLocaleString()} <span className="text-[10px] text-slate-400 not-italic ml-1">đ/tháng</span>
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase mt-6 pt-6 border-t border-slate-50 tracking-widest">
                     <span className="flex items-center gap-2">
                        <Maximize size={16} className="text-blue-500" /> {room.area} M²
                     </span>
                     <Building2 size={16} className="opacity-30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
             <Home size={64} className="text-slate-100" />
             <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Không có dữ liệu phòng phù hợp</p>
          </div>
        )}
      </div>

      {/* MODAL (Dùng chung cho Tạo mới & Sửa) */}
      {(branchId || user?.branchId) && (
        <RoomModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          branchId={branchId || Number(user?.branchId)} 
          initialData={editingRoom} // 👈 Truyền dữ liệu cũ để Form tự điền
        />
      )}
    </>
  );
}

export default function AdminRoomListPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}>
      <RoomListContent />
    </Suspense>
  );
}