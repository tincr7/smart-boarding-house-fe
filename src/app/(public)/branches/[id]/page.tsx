'use client';

import { useEffect, useState, useMemo, use } from 'react'; // Thêm 'use' để xử lý params chuẩn Next.js mới
import { useRouter } from 'next/navigation';
import { Room, roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; 
import { 
  Loader2, Search, Maximize, ArrowLeft, 
  MapPin, Home, Building2, SlidersHorizontal
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicBranchDetailPage({ params }: PageProps) {
  const resolvedParams = use(params); // Unwrapping params
  const router = useRouter();
  const branchId = Number(resolvedParams.id);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrice, setFilterPrice] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [roomsData, branchData] = await Promise.all([
          roomApi.getAll(branchId), 
          branchApi.getDetail(branchId)
        ]);
        setRooms(roomsData.filter((r: any) => !r.deletedAt));
        setBranch(branchData);
      } catch (error) {
        console.error("Lỗi tải dữ liệu chi nhánh:", error);
      } finally {
        setLoading(false);
      }
    };
    if (branchId) fetchData();
  }, [branchId]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchName = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const price = Number(room.price);
      let matchPrice = true;
      if (filterPrice === 'LOW') matchPrice = price < 3000000;
      if (filterPrice === 'HIGH') matchPrice = price >= 3000000;
      return matchName && matchPrice;
    });
  }, [rooms, searchTerm, filterPrice]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
        Đang lấy danh sách phòng...
      </p>
    </div>
  );

  if (!branch) return (
    <div className="text-center p-20 flex flex-col items-center gap-4">
      <Building2 size={48} className="text-slate-200" />
      <p className="font-black uppercase tracking-widest text-slate-400">Không tìm thấy chi nhánh</p>
      <button onClick={() => router.push('/')} className="text-blue-600 font-bold uppercase text-xs underline">Về trang chủ</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white py-24 px-4 md:px-10 relative overflow-hidden">
        <button 
          onClick={() => router.push('/branches')} 
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all z-20 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
        >
           <ArrowLeft size={14} /> Hệ thống chi nhánh
        </button>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
           <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 italic leading-none">{branch.name}</h1>
           <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-widest flex items-center justify-center gap-2 bg-black/20 w-fit mx-auto px-4 py-1.5 rounded-lg backdrop-blur-sm">
              <MapPin size={18} className="text-blue-500"/> {branch.address}
           </p>
        </div>
        
        {branch.image && (
          <div className="absolute inset-0 z-0 opacity-20">
             <img src={branch.image} alt={branch.name} className="w-full h-full object-cover scale-105" />
          </div>
        )}
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        
        {/* TÍCH HỢP BREADCRUMBS */}
        <div className="mb-10 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm inline-flex items-center">
           <Breadcrumbs 
             items={[
               { label: 'Hệ thống chi nhánh', href: '/branches' },
               { label: branch.name }
             ]} 
           />
        </div>

        {/* FILTER & LIST */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
           <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Tìm số phòng (ví dụ: 101)..." 
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold uppercase text-xs shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <select 
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                className="pl-12 pr-10 py-4 bg-white border border-slate-100 rounded-2xl outline-none cursor-pointer font-bold uppercase text-[10px] tracking-widest shadow-sm appearance-none hover:border-blue-200"
              >
                <option value="ALL">Tất cả mức giá</option>
                <option value="LOW">Dưới 3.000.000 đ</option>
                <option value="HIGH">Trên 3.000.000 đ</option>
              </select>
           </div>
        </div>

        {/* ROOM GRID */}
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredRooms.map((room) => (
              <div 
                key={room.id}
                onClick={() => router.push(`/rooms/${branchId}/${room.id}`)}
                className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col"
              >
                  <div className="h-64 bg-slate-100 relative overflow-hidden">
                    {room.image ? (
                      <img src={room.image} alt={room.roomNumber} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={48} /></div>
                    )}
                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {room.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Hết phòng'}
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic group-hover:text-blue-600 transition-colors">Phòng {room.roomNumber}</h3>
                    <p className="text-blue-600 font-black text-2xl mt-2 italic">{Number(room.price).toLocaleString()} <span className="text-xs tracking-normal">đ/tháng</span></p>
                    <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2"><Maximize size={14} className="text-blue-500"/> {room.area} m²</span>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
             <Search size={48} className="text-slate-100" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Không tìm thấy phòng phù hợp trong chi nhánh này</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Thêm Icon ArrowRight cho thẩm mỹ
import { ArrowRight } from 'lucide-react';