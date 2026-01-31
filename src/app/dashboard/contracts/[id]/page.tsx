'use client';

import { useEffect, useState, useCallback, use } from 'react'; // Sử dụng 'use' để xử lý params chuẩn Next.js mới
import { useRouter } from 'next/navigation';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi, CreateContractDto } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { 
  Loader2, ArrowLeft, Edit,
  FileText, Archive, ShieldCheck, Building2, User, Printer
} from 'lucide-react';
import { format } from 'date-fns';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminContractDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user: currentUser, isAdmin } = useAuth();
  const id = Number(resolvedParams.id);

  const [contract, setContract] = useState<Contract | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const contractData = await contractApi.getDetail(id);
      
      const branchIdOfContract = contractData.room?.branchId || contractData.branchId;
      if (currentUser?.branchId && branchIdOfContract !== Number(currentUser.branchId)) {
        alert('⛔ Bạn không có quyền truy cập hợp đồng này!');
        router.push('/dashboard/contracts');
        return;
      }

      setContract(contractData);
      
      if (contractData.branch) {
        setBranch(contractData.branch as Branch);
      } else if (contractData.room?.branch) {
        setBranch(contractData.room.branch as Branch);
      } else if (branchIdOfContract) {
        const branchData = await branchApi.getDetail(branchIdOfContract);
        setBranch(branchData);
      }
    } catch (error) { 
      console.error("Lỗi tải chi tiết:", error); 
    } finally { 
      setLoading(false); 
    }
  }, [id, currentUser, router]);

  useEffect(() => { if (id && currentUser) fetchDetail(); }, [id, currentUser, fetchDetail]);

  const handleUpdate = async (data: any) => {
    try {
      const updatePayload: Partial<CreateContractDto> & { branchId?: number } = {
        roomId: Number(data.roomId),
        userId: Number(data.userId),
        deposit: Number(data.deposit),
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        branchId: Number(contract?.branchId || data.branchId)
      };
      await contractApi.update(id, updatePayload);
      alert('✅ Cập nhật hồ sơ thành công!');
      await fetchDetail(); 
      setIsEditModalOpen(false);
    } catch (error: any) { alert('❌ Lỗi cập nhật dữ liệu'); }
  };

  const handleTerminateAndTrash = async () => {
    if (!confirm('⚠️ XÁC NHẬN THANH LÝ & XÓA?\nHợp đồng sẽ chấm dứt và chuyển vào thùng rác.')) return;
    try {
      await contractApi.delete(id); 
      alert('✅ Đã thanh lý hoàn tất!');
      router.push('/dashboard/contracts'); 
    } catch (error) { alert('❌ Lỗi thanh lý'); }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang truy xuất hồ sơ pháp lý...</p>
    </div>
  );

  if (!contract) return (
    <div className="text-center p-20">
      <p className="font-black text-slate-400 uppercase text-xs mb-4">Hợp đồng không tồn tại hoặc đã bị xóa</p>
      <button onClick={() => router.push('/dashboard/contracts')} className="text-blue-600 font-bold uppercase text-xs underline">Quay lại danh sách</button>
    </div>
  );

  const isActive = contract.status === 'ACTIVE';

  return (
    <div className="p-8 space-y-8 selection:bg-blue-100">
      
      {/* TÍCH HỢP BREADCRUMBS 3 CẤP */}
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'Hợp đồng', href: '/dashboard/contracts' },
            { label: `Hồ sơ #${contract.id}` }
          ]} 
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <button 
          onClick={() => router.push('/dashboard/contracts')} 
          className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 group transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
        </button>

        <button 
           onClick={() => window.print()} 
           className="w-fit bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-slate-100 flex items-center gap-2 hover:bg-slate-50 transition-all"
        >
           <Printer size={16} /> Xuất bản in
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* VIEW HỢP ĐỒNG */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-10 md:p-16 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none -rotate-12 translate-x-10 -translate-y-10">
                <FileText size={350} />
              </div>
              
              <div className="flex justify-between items-start mb-12 border-b border-slate-50 pb-12 relative z-10">
                 <div>
                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                       <ShieldCheck size={18} className="fill-blue-50" /> SmartHouse Verified
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 uppercase italic tracking-tighter leading-none">
                      Hợp đồng #{contract.id}
                    </h1>
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border tracking-widest uppercase shadow-sm ${
                      isActive ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {isActive ? 'Đang hiệu lực' : 'Đã thanh lý'}
                    </span>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày khởi tạo</p>
                    <p className="font-black text-2xl text-slate-800 italic">
                      {contract.createdAt ? format(new Date(contract.createdAt), 'dd/MM/yyyy') : '---'}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 <div className="bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100 group hover:bg-blue-50 transition-all">
                    <h3 className="font-black text-blue-600 uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                      <Building2 size={18}/> Đối tượng Thuê
                    </h3>
                    <p className="text-xl font-black text-slate-800 uppercase italic mb-2 leading-none">P.{contract.room?.roomNumber}</p>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{branch?.name}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase truncate">{branch?.address}</p>
                 </div>
                 
                 <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group hover:bg-white transition-all hover:shadow-lg hover:shadow-slate-100">
                    <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                      <User size={18} className="text-blue-500" /> Chủ thể cư dân
                    </h3>
                    <p className="text-xl font-black text-slate-800 uppercase italic mb-2 leading-none">{contract.user?.fullName}</p>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{contract.user?.phone}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-1 truncate">{contract.user?.email}</p>
                 </div>
              </div>

              <div className="mt-12 pt-10 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiền đặt cọc</span>
                    <p className="text-sm font-black text-slate-800 uppercase">{Number(contract.deposit).toLocaleString()} đ</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giá thuê cố định</span>
                    <p className="text-sm font-black text-slate-800 uppercase">{Number(contract.room?.price).toLocaleString()} đ</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bắt đầu</span>
                    <p className="text-sm font-black text-slate-800 uppercase">{format(new Date(contract.startDate), 'dd/MM/yyyy')}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kết thúc</span>
                    <p className="text-sm font-black text-slate-800 uppercase">{contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : '---'}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* ADMIN CONTROLS */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
             
             <h3 className="font-black text-blue-400 mb-8 uppercase text-[10px] tracking-[0.3em] flex items-center gap-2 relative z-10">
                <ShieldCheck size={16} /> Bảng điều khiển hồ sơ
             </h3>
             
             <div className="space-y-4 relative z-10">
                {isActive && isAdmin ? (
                  <>
                    <button 
                      onClick={() => setIsEditModalOpen(true)} 
                      className="w-full py-5 bg-white/10 border border-white/10 rounded-2xl hover:bg-white hover:text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                    >
                      <Edit size={16} className="group-hover:rotate-12 transition-transform" /> Chỉnh sửa hồ sơ
                    </button>
                    <button 
                      onClick={handleTerminateAndTrash} 
                      className="w-full py-5 bg-red-600/10 border border-red-600/20 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                    >
                      <Archive size={16} /> Thanh lý hợp đồng
                    </button>
                  </>
                ) : (
                  <div className="text-center py-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hồ sơ đã ở trạng thái đóng</p>
                    <p className="text-[8px] text-slate-600 uppercase mt-1">Không thể can thiệp dữ liệu</p>
                  </div>
                )}
             </div>
          </div>
          
          <div className="p-6 text-center">
             <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.4em]">SmartHouse Digital Archiving</p>
          </div>
        </div>
      </div>
      
      <ContractModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSubmit={handleUpdate} 
        initialData={contract} 
      />
    </div>
  );
}