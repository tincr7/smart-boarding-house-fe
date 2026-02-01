'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { contractApi } from '@/services/contract.api';
import { invoiceApi } from '@/services/invoice.api';
import { 
  Home, Receipt, ShieldCheck, 
  MapPin, Calendar, Wallet, ArrowRight, Loader2,
  Zap, Droplets, Info
} from 'lucide-react';
import Link from 'next/link';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export default function MyRoomDashboard() {
  const { user } = useAuth();
  const [myContract, setMyContract] = useState<any>(null);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  
  const [currentMetrics, setCurrentMetrics] = useState({ electric: 0, water: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        
        // 1. Lấy hợp đồng Active
        const allContracts = await contractApi.getAll();
        const active = allContracts.find((c: any) => c.userId === user.id && c.status === 'ACTIVE');
        setMyContract(active);

        // 2. Lấy danh sách hóa đơn
        const allInvoices = await invoiceApi.getAll();

        if (active) {
          // Lọc hóa đơn của phòng này
          const myInvoices = allInvoices.filter((inv: any) => 
             inv.roomId === active.roomId && !inv.deletedAt
          );

          // a. Lọc hóa đơn chưa thanh toán
          const unpaid = myInvoices.filter((inv: any) => inv.status !== 'PAID');
          setUnpaidInvoices(unpaid);

          // b. Lấy chỉ số điện nước mới nhất
          if (myInvoices.length > 0) {
             // Sort giảm dần theo ID để lấy cái mới nhất
             const sortedInvoices = myInvoices.sort((a: any, b: any) => b.id - a.id);
             
             // 🔥 FIX CHÍNH XÁC: Dùng tên trường từ JSON bạn gửi (newElectricity, newWater)
             const latestInvoice: any = sortedInvoices[0];
             
             setCurrentMetrics({
                electric: latestInvoice.newElectricity || 0, 
                water: latestInvoice.newWater || 0
             });
          }
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu cá nhân:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyData();
  }, [user]);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đang khởi tạo không gian của bạn...</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-8 selection:bg-blue-100">
      
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs items={[{ label: 'My Room' }]} />
      </div>

      {/* BANNER */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-14 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
         <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none -rotate-12 translate-x-10 -translate-y-10">
            <Home size={250} />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] mb-6">
               <ShieldCheck size={18} className="fill-blue-400/10" /> Verified Resident
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4 leading-none">
               Chào {user?.fullName?.split(' ').pop()},
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-md bg-white/5 w-fit px-4 py-2 rounded-lg backdrop-blur-sm">
               Khu vực quản lý dành riêng cho cư dân SmartHouse
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INFO CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-8">
           {myContract ? (
             <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/50 group">
                <div className="flex justify-between items-start mb-10 pb-10 border-b border-slate-50">
                   <div>
                      <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Phòng đang lưu trú</h2>
                      <p className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none group-hover:text-blue-600 transition-colors">
                        P.{myContract.room?.roomNumber}
                      </p>
                   </div>
                   <div className="text-right">
                      <div className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                         Active
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={14} className="text-blue-500"/> Cơ sở
                      </span>
                      <p className="text-sm font-black text-slate-700 uppercase italic truncate">
                        {myContract.room?.branch?.name || 'SmartHouse System'}
                      </p>
                   </div>
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500"/> Ngày nhận
                      </span>
                      <p className="text-sm font-black text-slate-700 italic">
                        {new Date(myContract.startDate).toLocaleDateString('vi-VN')}
                      </p>
                   </div>
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Wallet size={14} className="text-blue-500"/> Giá thuê
                      </span>
                      <p className="text-sm font-black text-blue-600 italic uppercase">
                        {Number(myContract.room?.price).toLocaleString()} đ/T
                      </p>
                   </div>
                </div>

                <div className="mt-10 pt-10 border-t border-slate-50 flex justify-end">
                   <Link href={`/my-room/contracts/${myContract.id}`} className="group/btn flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-all">
                      Xem hồ sơ pháp lý <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                   </Link>
                </div>
             </div>
           ) : (
             <div className="bg-white rounded-[3rem] p-16 text-center border-4 border-dashed border-slate-50 flex flex-col items-center gap-4">
                <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                  <Info size={48} />
                </div>
                <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Hợp đồng của bạn đang chờ phê duyệt</p>
             </div>
           )}

           {/* CHỈ SỐ ĐIỆN NƯỚC */}
           <div className="grid grid-cols-2 gap-6">
              <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                    <Zap size={80} />
                 </div>
                 <Zap className="mb-6" size={32} />
                 <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Chỉ số điện (Mới nhất)</p>
                 <p className="text-4xl font-black italic tracking-tighter">
                    {/* Hiển thị chỉ số điện */}
                    {currentMetrics.electric > 0 ? currentMetrics.electric : '--'} <span className="text-sm font-medium not-italic opacity-70">kWh</span>
                 </p>
              </div>
              <div className="bg-cyan-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-cyan-200 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                    <Droplets size={80} />
                 </div>
                 <Droplets className="mb-6" size={32} />
                 <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Chỉ số nước (Mới nhất)</p>
                 <p className="text-4xl font-black italic tracking-tighter">
                    {/* Hiển thị chỉ số nước */}
                    {currentMetrics.water > 0 ? currentMetrics.water : '--'} <span className="text-sm font-medium not-italic opacity-70">m³</span>
                 </p>
              </div>
           </div>
        </div>

        {/* HÓA ĐƠN CỘT PHẢI */}
        <div className="space-y-8">
           <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/50 h-full flex flex-col">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                 <Receipt size={20} className="text-blue-600" /> Hóa đơn chờ
              </h3>
              
              <div className="space-y-5 flex-1">
                 {unpaidInvoices.length > 0 ? unpaidInvoices.map((inv) => (
                    <Link key={inv.id} href={`/my-room/invoices/${inv.id}`}>
                       <div className="p-6 rounded-[2rem] bg-red-50/50 border border-red-100 hover:bg-white hover:shadow-xl hover:shadow-red-500/10 transition-all group border-l-4 border-l-red-500">
                          <div className="flex justify-between items-center mb-3">
                             <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Tháng {inv.month}/{inv.year}</span>
                             <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all">
                                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                             </div>
                          </div>
                          <p className="text-2xl font-black text-slate-900 italic">{Number(inv.totalAmount).toLocaleString()} <span className="text-xs">đ</span></p>
                       </div>
                    </Link>
                 )) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                       <ShieldCheck size={48} className="text-emerald-100" />
                       <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Tài chính an toàn</p>
                    </div>
                 )}
              </div>

              {unpaidInvoices.length > 0 && (
                <div className="mt-10 pt-8 border-t border-slate-50">
                   <Link href="/my-room/invoices" className="block text-center py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                      Thanh toán tất cả
                   </Link>
                </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}