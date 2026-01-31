'use client';

import { useEffect, useState, use } from 'react'; // Sử dụng 'use' để xử lý params chuẩn Next.js mới
import { useRouter } from 'next/navigation';
import { Contract, contractApi } from '@/services/contract.api';
import { Loader2, ArrowLeft, FileText, ShieldCheck, Building2, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TenantContractDetail({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(resolvedParams.id);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await contractApi.getDetail(id);
        
        // Bảo mật: Nếu hợp đồng không phải của user -> Chặn truy cập trái phép
        if (user && data.userId !== user.id) {
            router.push('/my-room/contracts');
            return;
        }
        setContract(data);
      } catch (error) { 
        console.error("Lỗi tải chi tiết hợp đồng:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    if (user && id) fetchDetail();
  }, [id, user, router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang giải mã hồ sơ...</p>
    </div>
  );

  if (!contract) return (
    <div className="text-center p-20">
      <p className="font-black text-slate-400 uppercase text-xs mb-4">Không tìm thấy dữ liệu hợp đồng</p>
      <button onClick={() => router.push('/my-room/contracts')} className="text-blue-600 font-bold text-xs uppercase underline">Quay lại danh sách</button>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto min-h-screen bg-slate-50 selection:bg-blue-100">
      
      {/* TÍCH HỢP BREADCRUMBS 4 CẤP */}
      <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'My Room', href: '/my-room' },
            { label: 'Hợp đồng', href: '/my-room/contracts' },
            { label: `Hồ sơ #${contract.id}` }
          ]} 
        />
      </div>

      <button 
        onClick={() => router.push('/my-room/contracts')} 
        className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 mb-8 transition-colors group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-14 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none -rotate-12 translate-x-10 -translate-y-10">
            <FileText size={300} />
         </div>

         {/* Header Hợp đồng */}
         <div className="text-center border-b border-slate-100 pb-10 mb-10 relative z-10">
            <div className="flex items-center justify-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-6">
               <ShieldCheck size={18} className="fill-blue-50" /> Chứng thực SmartHouse Digital Contract
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter">
               Hợp đồng thuê nhà
            </h1>
            <div className="flex items-center justify-center gap-4">
               <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ID: {contract.id}
               </span>
               <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                 contract.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
               }`}>
                  {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
               </span>
            </div>
         </div>

         {/* Thông tin pháp lý */}
         <div className="space-y-8 relative z-10">
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 group hover:border-blue-100 transition-all">
               <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600"/> Bên cho thuê (Bên A)
               </h3>
               <p className="text-lg font-black text-slate-800 uppercase italic leading-none mb-2">
                  {contract.branch?.name || contract.room?.branch?.name}
               </p>
               <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400"/> {contract.branch?.address || contract.room?.branch?.address}
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 px-4">
               <div className="border-b border-dashed border-slate-200 py-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Phòng đăng ký thuê</span>
                  <span className="text-2xl font-black text-blue-600 italic uppercase">Phòng {contract.room?.roomNumber}</span>
               </div>
               <div className="border-b border-dashed border-slate-200 py-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Đơn giá thuê cố định</span>
                  <span className="text-2xl font-black text-slate-900">{Number(contract.room?.price).toLocaleString()} <span className="text-sm">đ/tháng</span></span>
               </div>
               <div className="border-b border-dashed border-slate-200 py-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Ngày bắt đầu hiệu lực</span>
                  <span className="text-lg font-black text-slate-800">{format(new Date(contract.startDate), 'dd/MM/yyyy')}</span>
               </div>
               <div className="border-b border-dashed border-slate-200 py-2">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Ngày kết thúc dự kiến</span>
                  <span className="text-lg font-black text-slate-800">
                     {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'Hợp đồng dài hạn'}
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="mt-8 flex justify-center">
         <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.4em]">SmartHouse AI — Hệ thống quản lý tài sản số</p>
      </div>
    </div>
  );
}