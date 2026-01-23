'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  AlertTriangle, 
  MapPin, 
  Building, 
  Calendar, 
  User, 
  FileText,
  Download,
  Trash2,
  Archive
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const id = Number(params.id);

  const [contract, setContract] = useState<Contract | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const contractData = await contractApi.getDetail(id);
      
      // Kiểm tra nếu hợp đồng đã bị xóa mềm
      if (contractData.deletedAt) {
        alert('Hợp đồng này đã được đưa vào kho lưu trữ.');
        router.push('/contracts');
        return;
      }

      setContract(contractData);

      if (contractData.room?.branchId) {
        const branchData = await branchApi.getDetail(contractData.room.branchId);
        setBranch(branchData);
      }
    } catch (error) {
      console.error(error);
      alert('Không thể tải thông tin hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) fetchDetail(); }, [id]);

  const handleUpdate = async (data: any) => {
    try {
      await contractApi.update(id, data);
      alert('Cập nhật thành công!');
      fetchDetail();
    } catch (error) {
      alert('Lỗi khi cập nhật.');
    }
  };

  // 1. LOGIC THANH LÝ (Chỉ đổi trạng thái TERMINATED)
  const handleTerminate = async () => {
    if (!confirm('Bạn có chắc chắn muốn THANH LÝ hợp đồng này? Phòng sẽ được chuyển về trạng thái TRỐNG.')) return;
    try {
      await contractApi.terminate(id);
      alert('Đã thanh lý hợp đồng thành công!');
      fetchDetail();
    } catch (error: any) {
      alert('Thất bại khi thanh lý.');
    }
  };

  // 2. LOGIC XÓA MỀM (Ẩn hoàn toàn vào kho lưu trữ)
  const handleDelete = async () => {
    if (!confirm('CẢNH BÁO: Bạn có chắc muốn đưa hợp đồng này vào KHO LƯU TRỮ? Bản ghi sẽ bị ẩn khỏi danh sách chính.')) return;
    try {
      await contractApi.delete(id); // Gọi hàm delete (Soft Delete) trong service
      alert('Đã đưa hợp đồng vào mục lưu trữ.');
      router.push('/contracts');
    } catch (error) {
      alert('Không thể xóa hợp đồng này.');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!contract) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy hợp đồng</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/contracts')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-widest transition-all group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10 overflow-hidden relative">
              {/* Trang trí background */}
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <FileText size={200} />
              </div>

              <div className="flex justify-between items-start mb-10 border-b border-slate-100 pb-10">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">HỢP ĐỒNG #{contract.id}</h1>
                  <span className={`inline-flex items-center px-5 py-2 rounded-2xl text-[10px] font-black border-2 tracking-widest shadow-sm ${
                      contract.status === 'ACTIVE' 
                        ? 'bg-green-500 text-white border-green-400' 
                        : 'bg-slate-800 text-white border-slate-700'
                    }`}>
                    {contract.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : 'ĐÃ THANH LÝ'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày lập</p>
                  <p className="font-black text-slate-900 text-lg">{contract.createdAt ? format(new Date(contract.createdAt), 'dd/MM/yyyy') : '---'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border-2 border-blue-100 shadow-inner">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Building size={16} /> Thông tin lưu trú
                  </h3>
                  <div className="space-y-4 text-sm font-bold">
                    <div className="flex justify-between border-b border-blue-100 pb-2"><span className="text-blue-400">Phòng:</span> <span className="text-blue-900">{contract.room?.roomNumber}</span></div>
                    <div className="flex justify-between border-b border-blue-100 pb-2"><span className="text-blue-400">Đơn giá:</span> <span className="text-blue-900">{Number(contract.room?.price).toLocaleString()} đ/tháng</span></div>
                    <div className="pt-2">
                      <p className="font-black text-blue-900 text-base mb-1 uppercase tracking-tight">{branch?.name || '---'}</p>
                      <p className="text-[11px] text-blue-600/70 flex items-start gap-1 font-medium leading-relaxed">
                        <MapPin size={14} className="shrink-0" /> {branch?.address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <User size={16} /> Thông tin khách hàng
                  </h3>
                  <div className="space-y-4 text-sm font-bold">
                    <div className="flex justify-between border-b border-slate-200/50 pb-2"><span className="text-slate-400">Chủ hộ:</span> <span className="text-slate-900">{contract.user?.fullName}</span></div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2"><span className="text-slate-400">Liên hệ:</span> <span className="text-slate-900">{contract.user?.phone}</span></div>
                    <div className="flex justify-between pb-2"><span className="text-slate-400">Email:</span> <span className="text-slate-900 lowercase">{contract.user?.email}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                 <div className="p-6 bg-slate-50 rounded-2xl text-center border-2 border-transparent hover:border-slate-200 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày bắt đầu</p>
                    <p className="font-black text-slate-900">{format(new Date(contract.startDate), 'dd/MM/yyyy')}</p>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-2xl text-center border-2 border-transparent hover:border-slate-200 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày kết thúc</p>
                    <p className="font-black text-slate-900">{contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'Vô thời hạn'}</p>
                 </div>
                 <div className="p-6 bg-yellow-50 rounded-2xl text-center border-2 border-yellow-200 shadow-sm">
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Tiền đặt cọc</p>
                    <p className="font-black text-yellow-800 text-xl">{Number(contract.deposit).toLocaleString()} đ</p>
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <FileText size={20} /> Tài liệu đính kèm
              </h3>
              {contract.scanImage ? (
                <div className="relative group overflow-hidden rounded-3xl border-4 border-slate-50 shadow-inner">
                   <img src={contract.scanImage} alt="Hợp đồng" className="w-full grayscale hover:grayscale-0 transition-all duration-500" />
                   <a href={contract.scanImage} target="_blank" rel="noreferrer" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all shadow-2xl flex items-center gap-2">
                     <Download size={18} /> Xem ảnh gốc
                   </a>
                </div>
              ) : (
                <div className="h-40 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                  <FileText size={48} className="mb-2 opacity-20" />
                  <p className="font-black text-xs uppercase tracking-widest">Chưa có bản scan</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="font-black text-slate-900 mb-8 uppercase text-xs tracking-widest border-b pb-4">Quản trị hệ thống</h3>
              <div className="space-y-4">
                {contract.status === 'ACTIVE' && isAdmin && (
                  <>
                    <button onClick={() => setIsEditModalOpen(true)} className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl hover:border-blue-500 hover:text-blue-600 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3">
                      <Edit size={18} /> Cập nhật thông tin
                    </button>
                    <button onClick={handleTerminate} className="w-full py-4 bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-2xl hover:bg-orange-100 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3">
                      <AlertTriangle size={18} /> Thanh lý hợp đồng
                    </button>
                  </>
                )}
                {isAdmin && (
                  <button onClick={handleDelete} className="w-full py-4 bg-red-50 text-red-600 border-2 border-red-100 rounded-2xl hover:bg-red-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3">
                    <Trash2 size={18} /> Đưa vào kho lưu trữ
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden">
               <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12">
                  <Archive size={100} />
               </div>
               <h4 className="font-black text-blue-400 mb-4 text-xs uppercase tracking-widest">Ghi chú vận hành</h4>
               <ul className="text-[11px] text-slate-400 space-y-3 font-bold uppercase leading-relaxed">
                 <li className="flex gap-2"><span>•</span> Kiểm tra hiện trạng phòng trước khi thanh lý</li>
                 <li className="flex gap-2"><span>•</span> Chốt số điện/nước cuối cùng</li>
                 <li className="flex gap-2"><span>•</span> Hoàn trả tiền cọc (nếu có)</li>
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