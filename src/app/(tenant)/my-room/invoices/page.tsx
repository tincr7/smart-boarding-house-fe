'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { contractApi } from '@/services/contract.api';
import { Loader2, Calendar, MapPin, Wallet, ArrowRight, ReceiptText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs

export default function MyInvoicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [allInvoices, allContracts] = await Promise.all([
          invoiceApi.getAll(),
          contractApi.getAll()
        ]);

        const myActiveRoomIds = allContracts
           .filter((c: any) => c.userId === user.id && c.status === 'ACTIVE')
           .map((c: any) => c.roomId);

        const myInvoices = allInvoices.filter((inv: any) => 
          myActiveRoomIds.includes(inv.roomId) && !inv.deletedAt
        );
        
        setInvoices(myInvoices);
      } catch (error) {
        console.error("Lỗi tải hóa đơn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyData();
  }, [user]);

  return (
    <div className="p-8 max-w-5xl mx-auto selection:bg-emerald-100">
      
      {/* TÍCH HỢP BREADCRUMBS */}
      <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'My Room', href: '/my-room' },
            { label: 'Hóa đơn dịch vụ' }
          ]} 
        />
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-2 h-8 bg-emerald-500 rounded-full" />
           <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Hóa đơn của tôi
           </h1>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-5">Quản lý chi phí và lịch sử thanh toán</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang truy xuất dữ liệu hóa đơn...</p>
          </div>
        ) : invoices.length > 0 ? (
          invoices.map((inv) => (
            <div 
              key={inv.id} 
              onClick={() => router.push(`/my-room/invoices/${inv.id}`)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200 transition-all cursor-pointer flex flex-col md:flex-row justify-between items-center gap-4 group"
            >
              <div className="flex items-center gap-5 w-full md:w-auto">
                <div className={`p-4 rounded-2xl transition-all duration-300 ${
                  inv.status === 'PAID' 
                  ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white' 
                  : 'bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white'
                }`}>
                  <Wallet size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg uppercase italic group-hover:text-emerald-600 transition-colors">
                    Kỳ thanh toán {inv.month}/{inv.year}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5 mt-1 tracking-wider">
                    <MapPin size={12} className="text-blue-500" /> Phòng {inv.room?.roomNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-50">
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Số tiền thanh toán</p>
                  <p className="text-xl font-black text-blue-600 italic">
                    {Number(inv.totalAmount).toLocaleString()} <span className="text-xs tracking-normal">đ</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  {inv.status === 'PAID' ? (
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200">
                      Hoàn tất
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse border border-red-200">
                      Thanh toán ngay
                    </span>
                  )}
                  
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                    <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
            <div className="p-5 bg-slate-50 rounded-full text-slate-200">
              <ReceiptText size={48} />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Hiện chưa có hóa đơn phát sinh</p>
          </div>
        )}
      </div>
    </div>
  );
}