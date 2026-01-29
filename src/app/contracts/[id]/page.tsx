'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, ArrowLeft, Edit, MapPin, Building, 
  Calendar, User, FileText, Download, Trash2, 
  Archive, ShieldCheck, Building2
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAdmin } = useAuth(); // Lấy thông tin Admin hiện tại
  const id = Number(params.id);

  const [contract, setContract] = useState<Contract | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const contractData = await contractApi.getDetail(id);
      
      // 1. KIỂM TRA PHÂN QUYỀN ĐA CHI NHÁNH
      const branchIdOfContract = contractData.room?.branchId;
      if (currentUser?.branchId && branchIdOfContract !== currentUser.branchId) {
        alert('Bạn không có quyền truy cập hợp đồng thuộc chi nhánh khác!');
        router.push('/contracts');
        return;
      }

      if (contractData.deletedAt) {
        alert('Hợp đồng này đã được đưa vào kho lưu trữ.');
        router.push('/contracts');
        return;
      }

      setContract(contractData);

      // Ưu tiên lấy branch lồng từ contract hoặc gọi API nếu thiếu
      if (contractData.room?.branch) {
        setBranch(contractData.room.branch);
      } else if (branchIdOfContract) {
        const branchData = await branchApi.getDetail(branchIdOfContract);
        setBranch(branchData);
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết hợp đồng:", error);
      alert('Không thể tải thông tin hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id && currentUser) fetchDetail(); }, [id, currentUser]);

  const handleUpdate = async (data: any) => {
    try {
      await contractApi.update(id, data);
      alert('Cập nhật hợp đồng thành công!');
      fetchDetail();
      setIsEditModalOpen(false);
    } catch (error) {
      alert('Lỗi khi cập nhật.');
    }
  };

  // LOGIC THANH LÝ & XÓA MỀM (SOFT DELETE)
  const handleDelete = async () => {
    if (!confirm('CẢNH BÁO: Bạn có chắc muốn THANH LÝ hợp đồng này? Hồ sơ sẽ được đưa vào KHO LƯU TRỮ và phòng sẽ được giải phóng.')) return;
    try {
      await contractApi.delete(id); 
      alert('Hợp đồng đã được thanh lý và lưu trữ thành công!');
      router.push('/contracts');
    } catch (error) {
      alert('Không thể thực hiện thanh lý hợp đồng này.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!contract) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase text-xs text-slate-400 bg-slate-50 tracking-widest italic">
      Dữ liệu hợp đồng không khả dụng
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.push('/contracts')} 
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Quay lại danh sách quản lý
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-12 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <FileText size={250} />
              </div>

              <div className="flex justify-between items-start mb-12 border-b border-slate-50 pb-12">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-4">
                    <ShieldCheck size={16} /> Chứng thực SmartHouse AI
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter italic leading-none">
                    HỢP ĐỒNG #{contract.id}
                  </h1>
                  <span className={`inline-flex items-center px-6 py-2 rounded-2xl text-[10px] font-black border-2 tracking-widest shadow-xl ${
                      contract.status === 'ACTIVE' 
                        ? 'bg-green-500 text-white border-green-400' 
                        : 'bg-slate-800 text-white border-slate-700'
                    }`}>
                    {contract.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : 'ĐÃ KẾT THÚC'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày khởi tạo</p>
                  <p className="font-black text-slate-900 text-2xl tracking-tighter">
                    {contract.createdAt ? format(new Date(contract.createdAt), 'dd/MM/yyyy') : '---'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border-2 border-blue-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Building2 size={16} /> Thông tin vận hành
                  </h3>
                  <div className="space-y-5 text-xs font-black uppercase tracking-tight">
                    <div className="flex justify-between border-b border-blue-100 pb-3"><span className="text-blue-400">Mã Phòng:</span> <span className="text-blue-900">{contract.room?.roomNumber}</span></div>
                    <div className="flex justify-between border-b border-blue-100 pb-3"><span className="text-blue-400">Đơn giá:</span> <span className="text-blue-900">{Number(contract.room?.price).toLocaleString()} đ/tháng</span></div>
                    <div className="pt-4">
                      <p className="font-black text-blue-900 text-base mb-2 italic tracking-tighter">{branch?.name || '---'}</p>
                      <p className="text-[11px] text-blue-600/70 flex items-start gap-2 font-bold leading-relaxed">
                        <MapPin size={14} className="shrink-0" /> {branch?.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <User size={16} /> Đối tác cư dân
                  </h3>
                  <div className="space-y-5 text-xs font-black uppercase tracking-tight">
                    <div className="flex justify-between border-b border-slate-200/50 pb-3"><span className="text-slate-400">Chủ hộ:</span> <span className="text-slate-900">{contract.user?.fullName}</span></div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-3"><span className="text-slate-400">Số ĐT:</span> <span className="text-slate-900">{contract.user?.phone}</span></div>
                    <div className="flex justify-between pb-3"><span className="text-slate-400">Email:</span> <span className="text-slate-900 lowercase font-bold">{contract.user?.email}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                 <div className="p-8 bg-white rounded-3xl text-center border-2 border-slate-100 shadow-sm transition-all hover:border-blue-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Ngày bắt đầu</p>
                    <p className="font-black text-slate-900 uppercase text-xs">{format(new Date(contract.startDate), 'dd/MM/yyyy')}</p>
                 </div>
                 <div className="p-8 bg-white rounded-3xl text-center border-2 border-slate-100 shadow-sm transition-all hover:border-blue-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Ngày kết thúc</p>
                    <p className="font-black text-slate-900 uppercase text-xs">{contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'Vô thời hạn'}</p>
                 </div>
                 <div className="p-8 bg-orange-50 rounded-3xl text-center border-2 border-orange-200 shadow-xl shadow-orange-50">
                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-3">Khoản đặt cọc</p>
                    <p className="font-black text-orange-800 text-2xl tracking-tighter leading-none">{Number(contract.deposit).toLocaleString()} <span className="text-xs">đ</span></p>
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3">
                <FileText size={20} className="text-blue-500" /> Tài liệu đính kèm hệ thống
              </h3>
              {contract.scanImage ? (
                <div className="relative group overflow-hidden rounded-[2.5rem] border-8 border-slate-50 shadow-inner">
                   <img src={contract.scanImage} alt="Hợp đồng" className="w-full grayscale hover:grayscale-0 transition-all duration-700" />
                   <a href={contract.scanImage} target="_blank" rel="noreferrer" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-2xl flex items-center gap-3">
                     <Download size={20} /> Xem bản scan gốc
                   </a>
                </div>
              ) : (
                <div className="h-56 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <FileText size={64} className="mb-4 opacity-10" />
                  <p className="font-black text-[10px] uppercase tracking-[0.3em]">Chưa cập nhật bản quét</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h3 className="font-black text-slate-900 mb-10 uppercase text-[10px] tracking-[0.2em] border-b border-slate-50 pb-6">Thao tác quản trị</h3>
              <div className="space-y-4">
                {contract.status === 'ACTIVE' && isAdmin && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)} 
                    className="w-full py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl hover:border-blue-500 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
                  >
                    <Edit size={18} /> Cập nhật hồ sơ
                  </button>
                )}
                {isAdmin && (
                  <button 
                    onClick={handleDelete} 
                    className="w-full py-5 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl hover:bg-red-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-red-50"
                  >
                    <Trash2 size={18} /> Thanh lý hợp đồng
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-slate-900 text-white p-10 rounded-[3rem] relative overflow-hidden shadow-2xl shadow-slate-200">
               <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12">
                  <Archive size={150} />
               </div>
               <h4 className="font-black text-blue-400 mb-6 text-[10px] uppercase tracking-[0.2em]">Quy trình thanh lý</h4>
               <ul className="text-[11px] text-slate-400 space-y-4 font-black uppercase leading-relaxed tracking-tight">
                 <li className="flex gap-3"><span className="text-blue-500">01</span> Kiểm tra hiện trạng cơ sở vật chất</li>
                 <li className="flex gap-3"><span className="text-blue-500">02</span> Chốt số điện nước kỳ cuối</li>
                 <li className="flex gap-3"><span className="text-blue-500">03</span> Quyết toán tài chính & Tiền cọc</li>
                 <li className="flex gap-3"><span className="text-blue-500">04</span> Thu hồi thẻ từ & Định danh FaceID</li>
               </ul>
            </div>
          </div>
        </div>

        <ContractModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSubmit={handleUpdate} 
          initialData={contract} 
        />
      </main>
    </div>
  );
}