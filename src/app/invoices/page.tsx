'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { branchApi, Branch } from '@/services/branch.api';
import { 
  Loader2, Plus, Send, CheckCircle, Trash2, 
  MapPin, Building2, Search, Calendar, Wallet 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { contractApi } from '@/services/contract.api';

export default function InvoicesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  
  // State quản lý dữ liệu
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State lọc đa chi nhánh - Mặc định theo chi nhánh của Admin nếu có
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy filter hiện tại: Ưu tiên branchId trong Token, nếu không có mới lấy từ Dropdown (dành cho Super Admin)
      const currentBranchFilter = user?.branchId || selectedBranch;

      // Gọi API lấy dữ liệu song song
      const [invoicesData, branchesData] = await Promise.all([
        invoiceApi.getAll(currentBranchFilter),
        branchApi.getAll()
      ]);

      // Lọc bỏ các hóa đơn đã xóa mềm
      const activeInvoices = invoicesData.filter((inv: any) => !inv.deletedAt);

      if (isAdmin) {
        // Đối với Admin: Hiển thị kết quả đã được lọc từ Backend
        setInvoices(activeInvoices);
      } else {
        // Đối với Cư dân: Chỉ lấy hóa đơn thuộc các phòng mình đang thuê ACTIVE
        const allContracts = await contractApi.getAll();
        const myActiveRoomIds = allContracts
           .filter(c => c.userId === user?.id && c.status === 'ACTIVE')
           .map(c => c.roomId);

        const myInvoices = activeInvoices.filter(inv => myActiveRoomIds.includes(inv.roomId));
        setInvoices(myInvoices);
      }
      setBranches(branchesData);
    } catch (error) { 
      console.error('Lỗi khi tải dữ liệu hóa đơn:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  // Tự động tải lại dữ liệu mỗi khi có sự thay đổi về chi nhánh hoặc thông tin User
  useEffect(() => { 
    if (user) {
      fetchData();
    }
  }, [selectedBranch, user]);

  const getBranchName = (branchId?: number) => {
    if (!branchId) return 'Hệ thống SmartHouse';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : 'Đang cập nhật...';
  };

  const handleCreate = async (data: any) => {
    try {
      // Tự động gán branchId của Admin khi tạo hóa đơn
      const payload = { ...data, branchId: user?.branchId || data.branchId };
      await invoiceApi.create(payload);
      alert('Lập hóa đơn thành công! Hệ thống đang gửi mail thông báo cho cư dân.');
      setIsModalOpen(false);
      fetchData();
    } catch (error) { 
      alert('Lỗi khi lập hóa đơn. Vui lòng kiểm tra lại chỉ số điện nước.'); 
    }
  };

  const handleConfirmPayment = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Xác nhận cư dân đã đóng tiền cho hóa đơn này?')) {
       try {
         await invoiceApi.confirmPayment(id);
         fetchData();
       } catch (error) {
         alert('Lỗi xác nhận thanh toán.');
       }
    }
  };

  const handleSendNotification = async (e: any, id: number) => {
    e.stopPropagation();
    try {
      await invoiceApi.sendNotification(id);
      alert('Đã gửi mail nhắc nợ thành công!');
    } catch (error) { 
      alert('Gửi mail thất bại. Vui lòng kiểm tra cấu hình mail server.'); 
    }
  };

  const handleDelete = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Bạn có chắc muốn xóa hóa đơn này? Dữ liệu sẽ được đưa vào thùng rác.')) {
       try {
         await invoiceApi.delete(id);
         fetchData();
       } catch (error) { 
         alert('Không thể xóa hóa đơn này.'); 
       }
    }
  };

  // Logic tìm kiếm nhanh trên danh sách
  const filteredInvoices = invoices.filter(inv => 
    inv.room?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header với bộ lọc đa chi nhánh */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Tài chính & Hóa đơn</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Building2 size={14} className="text-blue-500" />
              SmartHouse AI - {user?.branchId ? getBranchName(user.branchId) : 'Quản lý toàn bộ hệ thống'}
            </p>
          </div>

          <div className="flex gap-4">
            {/* Thanh tìm kiếm nhanh */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-300" size={16} />
              <input 
                type="text"
                placeholder="Tìm số phòng..."
                className="pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 w-40 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Dropdown lọc chi nhánh (Chỉ hiện cho Super Admin - người không bị gán branchId cố định) */}
            {isAdmin && !user?.branchId && (
              <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
                <Building2 size={16} className="text-blue-500" />
                <select 
                  className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent cursor-pointer"
                  value={selectedBranch || ''}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tất cả các cơ sở</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {isAdmin && (
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
                <Plus size={16} /> Lập hóa đơn mới
              </button>
            )}
          </div>
        </div>

        {/* Bảng hiển thị dữ liệu hóa đơn */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-6 py-5">Phòng / Cơ sở</th>
                <th className="px-6 py-5 text-center">Kỳ thanh toán</th>
                <th className="px-6 py-5">Chỉ số Điện</th>
                <th className="px-6 py-5 text-right">Tổng tiền</th>
                <th className="px-6 py-5 text-center">Trạng thái</th>
                <th className="px-6 py-5 text-right pr-8">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-blue-500 font-bold uppercase flex items-center gap-1">
                          <MapPin size={10} /> {getBranchName(inv.room?.branchId)}
                        </span>
                        <span className="text-sm font-black text-slate-800 tracking-tighter">PHÒNG {inv.room?.roomNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-600 text-[10px] font-black uppercase tracking-tighter">
                        <Calendar size={12} /> {inv.month}/{inv.year}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                         <span className="text-blue-600 text-xs font-black">{inv.newElectricity - inv.oldElectricity} kWh</span>
                         <span className="text-[9px] text-slate-300 italic">Số cũ: {inv.oldElectricity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-base font-black text-slate-900 tracking-tighter">
                            {Number(inv.totalAmount).toLocaleString()} <span className="text-[10px] text-slate-400 ml-0.5">đ</span>
                          </span>
                          {inv.status === 'PAID' && <span className="text-[8px] text-green-500 uppercase font-black tracking-widest">Đã quyết toán</span>}
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${
                        inv.status === 'PAID' 
                        ? 'bg-green-50 text-green-600 border-green-100' 
                        : 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                      }`}>
                        {inv.status === 'PAID' ? 'Đã thu' : 'Nợ phí'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right pr-8" onClick={(e) => e.stopPropagation()}>
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-2">
                           {inv.status !== 'PAID' && (
                              <>
                                <button onClick={(e) => handleSendNotification(e, inv.id)} className="p-2 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-50 bg-blue-50/30" title="Gửi nhắc nợ">
                                   <Send size={14} />
                                </button>
                                <button onClick={(e) => handleConfirmPayment(e, inv.id)} className="p-2 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-50 bg-emerald-50/30" title="Xác nhận đã đóng tiền">
                                   <CheckCircle size={14} />
                                </button>
                              </>
                           )}
                           <button onClick={(e) => handleDelete(e, inv.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hủy hóa đơn">
                              <Trash2 size={14} />
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 text-blue-600 font-black text-[10px] uppercase">
                           <Wallet size={14} /> Chi tiết
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-24 text-slate-400 text-xs uppercase font-black italic tracking-widest">
                    Không tìm thấy dữ liệu thanh toán nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <InvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate} 
      />
    </div>
  );
}