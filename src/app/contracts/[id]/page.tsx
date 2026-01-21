'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api'; // Import API Chi nhánh
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, 
  ArrowLeft, 
  Printer, 
  Edit, 
  AlertTriangle, 
  MapPin, 
  Building, 
  Calendar, 
  User, 
  FileText,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const id = Number(params.id);

  const [contract, setContract] = useState<Contract | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null); // State lưu thông tin Chi nhánh
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Hàm tải dữ liệu
  const fetchDetail = async () => {
    try {
      setLoading(true);
      
      // 1. Lấy chi tiết hợp đồng trước
      const contractData = await contractApi.getDetail(id);
      setContract(contractData);

      // 2. Nếu trong thông tin phòng có branchId, gọi tiếp API lấy chi nhánh
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

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleUpdate = async (data: any) => {
    try {
      await contractApi.update(id, data);
      alert('Cập nhật thành công!');
      fetchDetail();
    } catch (error) {
      console.error(error);
      alert('Lỗi khi cập nhật.');
    }
  };

  const handleTerminate = async () => {
    const isConfirmed = confirm(
      'CẢNH BÁO: Bạn có chắc chắn muốn thanh lý hợp đồng này?\n\n' +
      '- Hợp đồng sẽ chuyển sang trạng thái "ĐÃ KẾT THÚC".\n' +
      '- Phòng sẽ được trả về trạng thái "TRỐNG".'
    );
    if (!isConfirmed) return;

    try {
      await contractApi.terminate(id);
      alert('Đã thanh lý hợp đồng thành công!');
      fetchDetail();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Có lỗi xảy ra.';
      alert(`Thất bại: ${message}`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!contract) return <div className="min-h-screen flex items-center justify-center">Không tìm thấy hợp đồng</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        {/* Nút Quay lại & In ấn */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/contracts')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} /> Quay lại danh sách
          </button>
          {/* <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 font-medium">
              <Printer size={16} /> In Hợp đồng
            </button>
          </div> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cột Trái: Thông tin chính */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Thông tin Hợp đồng & Chi nhánh */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">Hợp đồng thuê phòng #{contract.id}</h1>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      contract.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {contract.status === 'ACTIVE' ? 'ĐANG HIỆU LỰC' : 'ĐÃ KẾT THÚC'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Ngày tạo</p>
                  <p className="font-medium text-slate-900">{contract.createdAt ? format(new Date(contract.createdAt), 'dd/MM/yyyy') : '---'}</p>
                </div>
              </div>

              {/* Thông tin Chi nhánh & Phòng */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Building size={16} /> Thông tin Phòng & Chi nhánh
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-blue-600/70">Phòng:</span> <span className="font-bold text-blue-900">{contract.room?.roomNumber}</span></p>
                    <p className="flex justify-between"><span className="text-blue-600/70">Giá thuê:</span> <span className="font-bold text-blue-900">{Number(contract.room?.price).toLocaleString()} đ</span></p>
                    
                    {/* --- HIỂN THỊ CHI NHÁNH & ĐỊA CHỈ --- */}
                    <div className="pt-2 mt-2 border-t border-blue-200/50">
                      <p className="font-bold text-blue-900 mb-1">{branch ? branch.name : 'Đang tải tên chi nhánh...'}</p>
                      <p className="text-xs text-blue-800/70 flex items-start gap-1">
                        <MapPin size={12} className="shrink-0 mt-0.5" /> 
                        {branch ? branch.address : 'Đang tải địa chỉ...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <User size={16} /> Bên thuê (Khách hàng)
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span className="text-slate-500">Họ tên:</span> <span className="font-bold text-slate-900">{contract.user?.fullName}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">SĐT:</span> <span className="font-medium text-slate-900">{contract.user?.phone}</span></p>
                    <p className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900">{contract.user?.email}</span></p>
                  </div>
                </div>
              </div>

              {/* Thời hạn & Tiền cọc */}
              <div className="grid grid-cols-3 gap-4 text-center">
                 <div className="p-4 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Calendar size={12} /> Bắt đầu</p>
                    <p className="font-bold text-slate-900">{format(new Date(contract.startDate), 'dd/MM/yyyy')}</p>
                 </div>
                 <div className="p-4 border border-slate-100 rounded-lg">
                    <p className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Calendar size={12} /> Kết thúc</p>
                    <p className="font-bold text-slate-900">{format(new Date(contract.endDate), 'dd/MM/yyyy')}</p>
                 </div>
                 <div className="p-4 border border-slate-100 rounded-lg bg-yellow-50 border-yellow-100">
                    <p className="text-xs text-yellow-600 mb-1 font-bold">Tiền đặt cọc</p>
                    <p className="font-bold text-yellow-800">{Number(contract.deposit).toLocaleString()} đ</p>
                 </div>
              </div>
            </div>

            {/* Card 2: Hình ảnh hợp đồng (ĐÃ SỬA ĐỂ HIỂN THỊ) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={20} /> Bản scan hợp đồng
              </h3>
              
              {contract.scanImage ? (
                <div className="relative group">
                   <img 
                     src={contract.scanImage} 
                     alt="Hợp đồng scan" 
                     className="w-full rounded-lg border border-slate-200 shadow-sm" 
                   />
                   <a 
                     href={contract.scanImage} 
                     target="_blank" 
                     rel="noreferrer"
                     className="absolute top-4 right-4 bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Download size={16} /> Tải ảnh gốc
                   </a>
                </div>
              ) : (
                <div className="h-40 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <FileText size={40} className="mb-2 opacity-20" />
                  <p>Chưa có hình ảnh hợp đồng</p>
                </div>
              )}
            </div>
          </div>

          {/* Cột Phải: Actions */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Hành động</h3>
              
              <div className="space-y-3">
                
                {contract.status === 'ACTIVE' && (
                  <>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full py-3 px-4 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Edit size={18} /> Chỉnh sửa thông tin
                    </button>
                    )}
                    {isAdmin && (
                    <button 
                      onClick={handleTerminate}
                      className="w-full py-3 px-4 bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={18} /> Thanh lý hợp đồng
                    </button>
                    )}
                  </>
                )}
                
                
                {contract.status !== 'ACTIVE' && (
                   <p className="text-center text-sm text-slate-500 italic py-2">
                     Hợp đồng này đã kết thúc, không thể chỉnh sửa.
                   </p>
                )}
              </div>
            </div>
            
            {/* Note hướng dẫn */}
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
               <h4 className="font-bold text-blue-800 mb-2 text-sm">Lưu ý quản lý</h4>
               <ul className="text-xs text-blue-700/80 space-y-2 list-disc pl-4">
                 <li>Kiểm tra kỹ tiền cọc trước khi thanh lý.</li>
                 <li>Đảm bảo đã thu đủ tiền điện nước tháng cuối.</li>
                 <li>Bản scan hợp đồng giúp đối chiếu khi có tranh chấp.</li>
               </ul>
            </div>
          </div>

        </div>

        {/* Modal Sửa */}
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