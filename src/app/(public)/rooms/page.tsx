'use client';

import { useEffect, useState } from 'react';
import { roomApi, Room } from '@/services/room.api';
import { Home, MapPin, Loader2, Search, Building2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Component Breadcrumbs

export default function AllRoomsPublicPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        // Gọi API lấy toàn bộ phòng
        const data = await roomApi.getAll();
        setRooms(data.filter((r: any) => !r.deletedAt));
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(r => 
    r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.branch?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tìm phòng trống...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 selection:bg-blue-100">
      <div className="max-w-7xl mx-auto">
        
        {/* TÍCH HỢP BREADCRUMBS */}
        <div className="mb-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm inline-flex items-center">
           <Breadcrumbs 
             items={[
               { label: 'Tất cả phòng trống' }
             ]} 
           />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] block">SmartHouse System</span>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
              Danh sách phòng
            </h1>
          </div>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Tìm số phòng hoặc chi nhánh..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all text-xs font-bold uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredRooms.map((room) => (
              <Link 
                href={`/rooms/${room.branchId}/${room.id}`} 
                key={room.id} 
                className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-2 transition-all duration-500 flex flex-col"
              >
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  {room.image ? (
                    <img src={room.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200"><Home size={48} /></div>
                  )}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-lg ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {room.status === 'AVAILABLE' ? 'Sẵn sàng' : 'Đã thuê'}
                  </div>
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black uppercase italic text-slate-900 group-hover:text-blue-600 transition-colors">P.{room.roomNumber}</h3>
                  <p className="text-blue-600 font-black text-xl mt-1 italic">{Number(room.price).toLocaleString()} <span className="text-[10px] tracking-normal">đ/t</span></p>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                       <Building2 size={14} className="text-blue-500" />
                       <span className="line-clamp-1">{room.branch?.name}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:rotate-[-45deg]">
                       <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4 shadow-sm">
             <Search size={48} className="text-slate-100" />
             <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Không tìm thấy phòng phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
}