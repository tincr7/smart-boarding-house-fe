'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { 
  ArrowLeft, Loader2, Maximize, MapPin, 
  Building2, ShieldCheck, CheckCircle2
} from 'lucide-react';

interface PageProps {
  params: Promise<{ branchId: string; id: string }>;
}

export default function PublicRoomDetailPage({ params }: PageProps) {
  const resolvedParams = use(params); 
  const router = useRouter();
  
  const branchId = Number(resolvedParams.branchId);
  const roomId = Number(resolvedParams.id);

  const [room, setRoom] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || !branchId) return;
      try {
        setLoading(true);
        const [roomData, branchData] = await Promise.all([
          roomApi.getDetail(roomId),
          branchApi.getDetail(branchId),
        ]);
        setRoom(roomData);
        setCurrentBranch(branchData);
      } catch (error) {
        console.error("Lỗi tải dữ liệu phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [roomId, branchId]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tải thông tin phòng...</p>
    </div>
  );

  if (!room) return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 font-black uppercase tracking-widest mb-4">Không tìm thấy phòng</p>
        <button onClick={() => router.back()} className="text-blue-600 font-bold text-xs uppercase underline">Quay lại</button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 selection:bg-blue-100">
      {/* HEADER IMAGE SECTION */}
      <div className="h-[55vh] relative bg-slate-900 overflow-hidden">
         {room.image ? (
            <img src={room.image} className="w-full h-full object-cover opacity-70" alt="Room Cover" />
         ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 font-black uppercase tracking-[0.5em] bg-slate-800">No Image</div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
         
         <button 
          onClick={() => router.push(`/branches/${branchId}`)}
          className="absolute top-8 left-8 bg-white/10 backdrop-blur-md hover:bg-white hover:text-slate-900 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 z-20 shadow-2xl border border-white/10"
        >
          <ArrowLeft size={16} /> Quay lại chi nhánh
        </button>

        <div className="absolute bottom-12 left-4 md:left-10 max-w-4xl z-10">
           <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-3">
              <ShieldCheck size={16} className="fill-emerald-400/20" /> SmartHouse Verified Property
           </div>
           <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-4 leading-none">Phòng {room.roomNumber}</h1>
           <p className="text-slate-300 font-bold text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 bg-black/30 w-fit px-4 py-2 rounded-xl backdrop-blur-md">
              <MapPin size={14} className="text-blue-500"/> {currentBranch?.name} — {currentBranch?.address}
           </p>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-10">
         
         {/* TÍCH HỢP BREADCRUMBS 3 CẤP */}
         <div className="mb-8 p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 inline-flex items-center">
           <Breadcrumbs 
             items={[
               { label: 'Phòng trống', href: '/rooms' },
               { label: currentBranch?.name || 'Chi nhánh', href: `/branches/${branchId}` },
               { label: `P.${room.roomNumber}` }
             ]} 
           />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* THÔNG TIN CHI TIẾT PHÒNG */}
            <div className="lg:col-span-2 space-y-8">
               <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10 pb-10 border-b border-slate-50">
                     <div className="space-y-2">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Giá thuê trọn gói</span>
                        <p className="text-3xl font-black text-blue-600 tracking-tighter italic">
                           {Number(room.price).toLocaleString()} <span className="text-xs italic">đ/t</span>
                        </p>
                     </div>
                     <div className="space-y-2">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Không gian</span>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-2">
                           <Maximize size={24} className="text-blue-500" /> {room.area} <span className="text-xs">m²</span>
                        </p>
                     </div>
                     <div className="space-y-2">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tình trạng</span>
                        <div>
                           <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                              room.status === 'AVAILABLE' 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                              : 'bg-red-50 text-red-600 border-red-100'
                           }`}>
                              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${room.status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {room.status === 'AVAILABLE' ? 'Sẵn sàng dọn vào' : 'Hiện đã hết phòng'}
                           </span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                        <Building2 size={18} className="text-blue-600"/> Tiện ích tích hợp cao cấp
                     </h3>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {room.utilities?.length > 0 ? (
                           room.utilities.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-blue-100 transition-all group">
                                 <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 group-hover:scale-125 transition-transform" />
                                 <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{item}</span>
                              </div>
                           ))
                        ) : (
                           <p className="text-xs text-slate-400 italic">Đang cập nhật danh sách tiện ích...</p>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* SIDEBAR BOOKING & CONTACT */}
            <div className="lg:relative">
               <div className="bg-slate-900 rounded-[3rem] p-10 text-white sticky top-24 shadow-2xl shadow-blue-900/20 border border-white/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="relative z-10">
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Giữ phòng ngay</h3>
                     <p className="text-slate-400 text-[10px] font-black leading-relaxed uppercase tracking-[0.2em] mb-10">
                        Liên hệ trực tiếp quản lý chi nhánh để nhận ưu đãi và tham quan phòng thực tế.
                     </p>
                     
                     <div className="space-y-4 mb-10">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-colors">
                           <div>
                              <span className="block text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Quản lý trực tòa nhà</span>
                              <p className="text-sm font-bold uppercase tracking-tight">{currentBranch?.manager || 'SmartHouse Team'}</p>
                           </div>
                           <ShieldCheck size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
                        </div>
                     </div>
                     <p className="text-[8px] text-center text-slate-500 font-black uppercase tracking-widest mt-8">
                        Hệ thống vận hành bởi SmartHouse AI
                     </p>
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}