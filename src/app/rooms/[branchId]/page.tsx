'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import RoomModal from '@/components/rooms/RoomModal'; // Import Modal
import { Loader2, Search, Maximize, Plus, ArrowLeft, MapPin } from 'lucide-react';

export default function RoomListPage() {
  
  const { isAdmin } = useAuth();const params = useParams();
  const router = useRouter();
  const branchId = Number(params.branchId);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State cho Modal & Search
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  const [filterPrice, setFilterPrice] = useState('ALL');

  // Hàm load dữ liệu (Tách ra để tái sử dụng)
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Gọi song song 2 API: Lấy list phòng & Lấy thông tin chi nhánh
      const [allRooms, branchData] = await Promise.all([
        roomApi.getAll(),
        branchApi.getDetail(branchId) // Gọi API lấy chi tiết
      ]);

      const branchRooms = allRooms.filter(r => r.branchId === branchId);
      setRooms(branchRooms);
      setCurrentBranch(branchData); // Lưu thông tin chi nhánh
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (branchId) fetchData();
  }, [branchId]);

  

  // Xử lý tạo phòng mới
  const handleCreateRoom = async (data: any) => {
    await roomApi.create(data);
    // Sau khi tạo xong thì load lại danh sách
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
              {/* Hiển thị Tên chi nhánh thay vì chữ "Danh sách phòng" chung chung */}
              <h1 className="text-2xl font-bold text-slate-900">
                {currentBranch ? currentBranch.name : 'Đang tải...'}
              </h1>
              
              {/* 3. HIỂN THỊ ĐỊA CHỈ Ở ĐÂY */}
              <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {currentBranch ? currentBranch.address : 'Đang tải địa chỉ...'}
              </p>
            </div>
            {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
            >
              <Plus size={18} /> Thêm phòng
            </button>
            )}
          </div>

          {/* Bộ lọc */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm mã phòng..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm text-slate-700 cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="AVAILABLE">Phòng trống</option>
              <option value="OCCUPIED">Đã thuê</option>
              
            </select>
            <select 
              className="px-3 py-2 border border-slate-200 rounded-lg outline-none text-sm text-slate-700 cursor-pointer"
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
            >
              <option value="ALL">Tất cả mức giá</option>
              <option value="LOW">Dưới 3 triệu</option>
              <option value="HIGH">Trên 3 triệu</option>
            </select>
          </div>
        </div>

        {/* Grid hiển thị */}
        {loading ? (
          <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredRooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => router.push(`/rooms/${branchId}/${room.id}`)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
              >
                <div className="h-40 bg-slate-100 relative">
                  {room.image ? (
                     <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Image</div>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold text-white shadow-sm ${
                    room.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {room.status === 'AVAILABLE' ? 'Trống' : 'Đã thuê'}
                  </span>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600">
                    {room.roomNumber}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-bold text-blue-600">
                      {Number(room.price).toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Maximize size={12} /> {room.area} m²
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredRooms.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-500">
                Chưa có phòng nào. Hãy thêm phòng mới!
              </div>
            )}
          </div>
        )}

        {/* Modal Thêm Phòng */}
        <RoomModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateRoom}
          branchId={branchId} // Truyền branchId vào để biết thêm phòng cho chi nhánh nào
        />
      </main>
    </div>
  );
}