'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Contract, contractApi } from '@/services/contract.api';
import { Loader2, Calendar, MapPin, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs

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
        const allContracts = await contractApi.getAll();
        // Lọc: Chỉ lấy hợp đồng CỦA TÔI
        const myData = allContracts.filter((c: any) => c.userId === user.id);
        setContracts(myData);
      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchMyContracts();
  }, [user]);

  return (
    <div className="p-8 max-w-5xl mx-auto selection:bg-blue-100">
      
      {/* TÍCH HỢP BREADCRUMBS */}
      <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'My Room', href: '/my-room' },
            { label: 'Hợp đồng thuê phòng' }
          ]} 
        />
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-2 h-8 bg-blue-600 rounded-full" />
           <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
              Hợp đồng của tôi
           </h1>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest ml-5">Hồ sơ thuê phòng và pháp lý cư dân</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Đang truy xuất hồ sơ...</p>
          </div>
        ) : contracts.length > 0 ? (
          contracts.map((contract) => (
            <div 
              key={contract.id} 
              onClick={() => router.push(`/my-room/contracts/${contract.id}`)}
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl transition-colors ${
                  contract.status === 'ACTIVE' 
                  ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' 
                  : 'bg-slate-100 text-slate-400'
                }`}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg uppercase italic group-hover:text-blue-600 transition-colors">
                    Phòng {contract.room?.roomNumber}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1 mt-1 tracking-wider">
                    <MapPin size={12} className="text-blue-500" /> 
                    {contract.branch?.name || contract.room?.branch?.name || 'Chi nhánh SmartHouse'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:gap-8">
                 <div className="text-right hidden sm:block border-r border-slate-100 pr-8">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Thời hạn thuê</p>
                    <p className="text-xs font-black text-slate-700">
                      {format(new Date(contract.startDate), 'dd/MM/yyyy')} 
                      <span className="mx-2 text-slate-300">→</span>
                      {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : '...'}
                    </p>
                 </div>
                 
                 <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                   contract.status === 'ACTIVE' 
                   ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                   : 'bg-slate-50 text-slate-400 border border-slate-100'
                 }`}>
                    {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                 </div>
                 
                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
            <div className="p-5 bg-slate-50 rounded-full text-slate-200">
              <FileText size={48} />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Bạn chưa có hợp đồng ký kết nào</p>
          </div>
        )}
      </div>
    </div>
  );
}