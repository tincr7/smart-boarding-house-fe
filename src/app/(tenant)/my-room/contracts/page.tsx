'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contract, contractApi } from '@/services/contract.api';
import { Loader2, Calendar, MapPin, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export default function MyContractsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyContracts = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // ⚠️ LƯU Ý: Tốt nhất Backend nên có API riêng như contractApi.getMyContracts()
        // Hiện tại đang lấy tất cả rồi lọc Client -> Tạm chấp nhận được với quy mô nhỏ
        const allContracts = await contractApi.getAll();
        
        // Lọc: Chỉ lấy hợp đồng có userId trùng với user đang đăng nhập
        const myData = allContracts.filter((c: any) => c.userId === user.id);
        
        // Sắp xếp: Hợp đồng mới nhất lên đầu
        const sortedData = myData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setContracts(sortedData);
      } catch (error) { 
        console.error("Lỗi tải hợp đồng:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchMyContracts();
  }, [user]);

  return (
    <> {/* Bọc Fragment để tránh lỗi JSX Parent Element */}
      <div className="p-6 md:p-10 max-w-5xl mx-auto selection:bg-blue-100 min-h-screen">
        
        {/* Breadcrumbs */}
        <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Breadcrumbs 
            items={[
              { label: 'My Room', href: '/my-room' },
              { label: 'Hồ sơ thuê phòng' }
            ]} 
          />
        </div>

        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
               <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                  Hợp đồng của tôi
               </h1>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] ml-5">Quản lý hồ sơ pháp lý & thời hạn lưu trú</p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
             <ShieldCheck size={16} className="text-emerald-500" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SmartHouse Verified</span>
          </div>
        </div>

        {/* List Contracts */}
        <div className="space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : contracts.length > 0 ? (
            contracts.map((contract) => (
              <div 
                key={contract.id} 
                onClick={() => router.push(`/my-room/contracts/${contract.id}`)}
                className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between group gap-6"
              >
                {/* Left Info */}
                <div className="flex items-center gap-6">
                  <div className={`p-5 rounded-[1.5rem] transition-all duration-500 ${
                    contract.status === 'ACTIVE' 
                    ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6 shadow-sm' 
                    : 'bg-slate-100 text-slate-400'
                  }`}>
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors leading-none mb-2">
                      P.{contract.room?.roomNumber}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 tracking-wider bg-slate-50 w-fit px-2 py-1 rounded-md">
                      <MapPin size={12} className="text-blue-500" /> 
                      {contract.branch?.name || contract.room?.branch?.name || 'Chi nhánh SmartHouse'}
                    </p>
                  </div>
                </div>

                {/* Right Info */}
                <div className="flex items-center justify-between md:justify-end gap-6 md:gap-10 border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                   <div className="text-left md:text-right">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Hiệu lực</p>
                      <p className="text-xs font-black text-slate-700 flex items-center gap-2">
                        {format(new Date(contract.startDate), 'dd/MM/yyyy')} 
                        <ArrowRight size={12} className="text-slate-300" />
                        {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : '...'}
                      </p>
                   </div>
                   
                   <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                        contract.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                          {contract.status === 'ACTIVE' ? 'Đang thuê' : 'Đã trả'}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                          <ArrowRight size={18} className="group-hover:-rotate-45 transition-transform duration-300" />
                      </div>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4 group hover:border-blue-200 transition-colors">
              <div className="p-6 bg-slate-50 rounded-full text-slate-300 group-hover:text-blue-400 transition-colors">
                <FileText size={56} />
              </div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Bạn chưa có hợp đồng nào</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}