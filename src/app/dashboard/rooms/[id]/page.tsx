'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { roomApi } from '@/services/room.api';
import { branchApi, Branch } from '@/services/branch.api';
import { statsApi } from '@/services/stats.api'; 
import RoomModal from '@/components/rooms/RoomModal';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, Loader2, Edit,
  Maximize, DollarSign, MapPin, Archive, 
  CheckCircle2, PlayCircle, Building2, ShieldCheck, Activity, Users
} from 'lucide-react';

export default function AdminRoomDetailPage() {
  const { user, isAdmin } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  const roomId = Number(params.id);

  const [room, setRoom] = useState<any>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const roomData = await roomApi.getDetail(roomId);
      
      if (user?.branchId && Number(user.branchId) !== roomData.branchId) {
        alert('⛔ BẠN KHÔNG CÓ QUYỀN TRUY CẬP PHÒNG THUỘC CƠ SỞ KHÁC!');
        router.push('/dashboard/rooms');
        return;
      }

      if (roomData.deletedAt) {
        alert('⚠️ Phòng này đang nằm trong thùng rác.');
        router.push('/dashboard/rooms');
        return;
      }

      const branchData = await branchApi.getDetail(roomData.branchId);

      setRoom(roomData);
      setCurrentBranch(branchData);

      const currentTenantId = roomData.contracts?.[0]?.userId;
      if (currentTenantId) {
        const logsData = await statsApi.getRecentAccessLogs(20, roomData.branchId);
        setAccessLogs(logsData.filter((log: any) => log.userId === currentTenantId));
      }

    } catch (error) {
      console.error("Lỗi tải chi tiết phòng:", error);
    } finally {
      setLoading(false);
    }
  }, [roomId, user, router]);

  useEffect(() => {
    if (roomId && user) fetchData();
  }, [roomId, user, fetchData]);

  const handleUpdate = async (data: any) => {
    try {
      await roomApi.update(roomId, data);
      alert('✅ Cập nhật dữ liệu phòng thành công!');
      fetchData(); 
      setIsEditModalOpen(false);
    } catch (error) {
      alert('❌ Lỗi cập nhật.');
    }
  };

  const handleDelete = async () => {
    if (confirm(`⚠️ XÁC NHẬN ĐƯA PHÒNG P.${room?.roomNumber} VÀO THÙNG RÁC?`)) {
      try {
        await roomApi.delete(roomId); 
        alert('✅ Đã chuyển vào thùng rác.');
        router.push(`/dashboard/rooms?branchId=${room.branchId}`);
      } catch (error) {
        alert('❌ Lỗi: Không thể xóa phòng đang có hợp đồng.');
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang đồng bộ dữ liệu phòng...</p>
    </div>
  );

  if (!room) return (
    <div className="h-screen flex items-center justify-center text-slate-400 font-black uppercase text-xs">
      Dữ liệu phòng không tồn tại hoặc đã bị xóa.
    </div>
  );

  return (
    <> {/* Bọc Fragment để xử lý lỗi JSX Parent Element */}
      <div className="p-8 bg-slate-50 min-h-screen selection:bg-blue-100">
        
        {/* TÍCH HỢP BREADCRUMBS 3 CẤP */}
        <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Breadcrumbs 
            items={[
              { label: 'Chi nhánh', href: '/dashboard/branches' },
              { label: currentBranch?.name || 'Phòng', href: `/dashboard/rooms?branchId=${room.branchId}` },
              { label: `P.${room.roomNumber}` }
            ]} 
          />
        </div>

        <button 
          onClick={() => router.push(`/dashboard/rooms?branchId=${room.branchId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-10 font-black uppercase text-[10px] tracking-[0.2em] transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          Quay lại danh sách quản lý
        </button>

        <div className="max-w-6xl mx-auto space-y-10">
          {/* HERO SECTION - MEDIA & SMART CAMERA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden h-[450px] relative group">
              {room.image ? (
                <img src={room.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Room" />
              ) : (
                <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200 font-black uppercase tracking-widest">No Media Found</div>
              )}
              <div className="absolute top-6 left-6">
                <span className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-2xl border-2 ${
                  room.status === 'AVAILABLE' ? 'bg-emerald-500 border-emerald-400' : 'bg-red-500 border-red-400'
                }`}>
                  {room.status === 'AVAILABLE' ? '🍃 Sẵn sàng' : '🏠 Đã bàn giao'}
                </span>
              </div>
            </div>

            {/* LIVE CAMERA FEED */}
            <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 overflow-hidden h-[450px] relative group">
              {room.video ? (
                <video src={room.video} controls className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center text-slate-700">
                   <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                      <PlayCircle size={40} />
                   </div>
                   <p className="font-black uppercase text-[10px] tracking-[0.3em]">Cảm biến Camera Offline</p>
                </div>
              )}
              <div className="absolute top-6 left-6 pointer-events-none">
                <span className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5">
                  <Activity size={14} className="animate-pulse" /> AI Security Monitoring
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* CỘT TRÁI: CHI TIẾT TÀI SẢN */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[3.5rem] p-10 md:p-14 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none -rotate-12 translate-x-10 -translate-y-10">
                  <Building2 size={300} />
                </div>

                <div className="flex justify-between items-start mb-10 border-b border-slate-50 pb-10 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                      <ShieldCheck size={18} className="fill-blue-50" /> SmartHouse Verified Unit
                    </div>
                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">P.{room.roomNumber}</h1>
                    <p className="text-slate-400 font-black text-[10px] mt-6 uppercase tracking-[0.2em] flex items-center gap-2 bg-slate-50 w-fit px-3 py-1.5 rounded-lg">
                       <MapPin size={16} className="text-blue-500" /> {currentBranch?.name} — {currentBranch?.address}
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex gap-3">
                      <button onClick={() => setIsEditModalOpen(true)} className="p-5 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
                        <Edit size={22} />
                      </button>
                      <button onClick={handleDelete} className="p-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm active:scale-95">
                        <Archive size={22} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
                   <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100 flex flex-col justify-center">
                      <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Giá niêm yết</span>
                      <p className="text-4xl font-black text-slate-900 italic tracking-tighter">
                        {Number(room.price).toLocaleString()} <span className="text-sm">đ/t</span>
                      </p>
                   </div>
                   <div className="p-8 bg-purple-50/50 rounded-[2rem] border border-purple-100 flex flex-col justify-center">
                      <span className="block text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Diện tích sử dụng</span>
                      <p className="text-4xl font-black text-slate-900 italic tracking-tighter flex items-center gap-3">
                        <Maximize size={32} className="text-purple-500" /> {room.area} <span className="text-sm">m²</span>
                      </p>
                   </div>
                </div>

                <div className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative z-10">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Tiện ích tích hợp</h3>
                   <div className="flex flex-wrap gap-3">
                      {room.utilities?.map((item: string, idx: number) => (
                         <span key={idx} className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all cursor-default shadow-sm">
                           {item}
                         </span>
                      ))}
                   </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: QUẢN LÝ CƯ DÂN & AN NINH */}
            <div className="space-y-8">
              {/* THẺ CƯ DÂN HIỆN TẠI */}
              {room.contracts?.[0]?.user ? (
                <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl shadow-slate-300 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <Users className="absolute -right-6 -bottom-6 text-white/5 w-48 h-48 group-hover:rotate-12 transition-transform duration-700" />
                  
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8 relative">Cư dân đang thuê</h3>
                  <div className="relative space-y-4">
                    <p className="text-3xl font-black uppercase italic tracking-tighter leading-none">{room.contracts[0].user.fullName}</p>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hotline</p>
                      <p className="text-sm font-black text-blue-400">{room.contracts[0].user.phone}</p>
                    </div>
                    <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                       <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-xl border border-emerald-500/20">
                          FaceID Verified
                       </span>
                       <Activity size={20} className="text-slate-700" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-12 rounded-[3.5rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center justify-center gap-4">
                   <div className="p-6 bg-slate-50 rounded-full text-slate-100">
                      <Users size={48} />
                   </div>
                   <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em]">Sẵn sàng đón khách</p>
                </div>
              )}

              {/* NHẬT KÝ RA VÀO SMART LOGS */}
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <Activity size={18} className="text-blue-500" /> Smart Logs Activity
                </h3>
                <div className="space-y-6 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
                  {accessLogs.length > 0 ? accessLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{log.user?.fullName}</p>
                          <p className="text-[9px] text-slate-400 font-bold italic tracking-tighter">
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 size={16} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )) : (
                    <div className="text-center py-10 flex flex-col items-center gap-3">
                       <ShieldCheck size={32} className="text-slate-100" />
                       <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Hệ thống bảo mật an toàn</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-10">
           <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">SmartHouse AI Technology Monitoring System — #RM{room.id}</p>
        </div>
      </div>
      
      {isAdmin && room.branchId && (
        <RoomModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSubmit={handleUpdate} 
          branchId={room.branchId} 
          initialData={room} 
        />
      )}
    </>
  );
}