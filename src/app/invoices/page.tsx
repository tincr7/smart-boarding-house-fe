'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { branchApi, Branch } from '@/services/branch.api'; // 1. IMPORT API CHI NHÁNH
import { Loader2, Plus, Send, CheckCircle, Trash2, MapPin } from 'lucide-react'; // Thêm icon MapPin
import { useAuth } from '@/context/AuthContext';
import { contractApi } from '@/services/contract.api';

export default function InvoicesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  // 2. STATE LƯU CHI NHÁNH
  const [branches, setBranches] = useState<Branch[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 3. GỌI SONG SONG 2 API
      const [invoicesData, branchesData] = await Promise.all([
        invoiceApi.getAll(),
        branchApi.getAll()
      ]);
      if (isAdmin) {
        setInvoices(invoicesData);
     } else {
        // LOGIC LỌC CHO TENANT
        // 1. Lấy danh sách hợp đồng của user
        // (Cách nhanh nhất là gọi api getProfile, user đã có mảng contracts nếu backend trả về, 
        // hoặc gọi contractApi.getAll rồi filter như bước 5)
        
        // Giả sử ta lọc client-side từ list invoicesData:
        // User chỉ xem được invoice nếu invoice đó thuộc phòng mà User đang có Hợp Đồng Active
        // Tuy nhiên, đơn giản nhất là backend lọc. Nếu frontend lọc:
        
        // Cách tạm thời: Gọi thêm contract của user này
        const allContracts = await contractApi.getAll();
        const myActiveRoomIds = allContracts
           .filter(c => c.userId === user?.id && c.status === 'ACTIVE')
           .map(c => c.roomId);

        const myInvoices = invoicesData.filter(inv => myActiveRoomIds.includes(inv.roomId));
        setInvoices(myInvoices);
     }
      
      setInvoices(invoicesData);
      setBranches(branchesData);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 4. HÀM TÌM TÊN CHI NHÁNH
  const getBranchName = (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '---';
  };

  const handleCreate = async (data: any) => {
    await invoiceApi.create(data);
    fetchData();
  };

  const handleConfirmPayment = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Xác nhận đã thu tiền cho hóa đơn này?')) {
       await invoiceApi.confirmPayment(id);
       fetchData();
    }
  };

  const handleSendNotification = async (e: any, id: number) => {
    e.stopPropagation();
    alert('Đang gửi thông báo đến cư dân...');
    await invoiceApi.sendNotification(id);
    alert('Đã gửi thông báo thành công!');
  };

  const handleDelete = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Bạn có chắc muốn xóa hóa đơn này không?')) {
       await invoiceApi.delete(id);
       fetchData();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Hóa đơn</h1>
          {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200">
            <Plus size={20} /> Lập hóa đơn mới
          </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                {/* 5. THÊM CỘT CHI NHÁNH */}
                <th className="px-4 py-4">Chi nhánh</th>
                <th className="px-4 py-4">Phòng</th>
                <th className="px-4 py-4">Tháng/Năm</th>
                <th className="px-4 py-4">Điện (Số)</th>
                <th className="px-4 py-4">Nước (Khối)</th>
                <th className="px-4 py-4 text-right">Tổng tiền</th>
                <th className="px-4 py-4 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : invoices.map((inv) => (
                <tr 
                  key={inv.id} 
                  onClick={() => router.push(`/invoices/${inv.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  {/* 6. HIỂN THỊ TÊN CHI NHÁNH */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 text-sm">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="font-medium truncate max-w-[150px]" title={getBranchName(inv.room?.branchId)}>
                          {getBranchName(inv.room?.branchId)}
                        </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 font-bold text-slate-900">{inv.room?.roomNumber}</td>
                  <td className="px-4 py-4 text-slate-600">Tháng {inv.month}/{inv.year}</td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex flex-col">
                       <span className="text-slate-900 font-medium">{inv.newElectricity - inv.oldElectricity} tiêu thụ</span>
                       <span className="text-xs text-slate-400">({inv.oldElectricity} - {inv.newElectricity})</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex flex-col">
                       <span className="text-slate-900 font-medium">{inv.newWater - inv.oldWater} tiêu thụ</span>
                       <span className="text-xs text-slate-400">({inv.oldWater} - {inv.newWater})</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-blue-600">
                    {Number(inv.totalAmount).toLocaleString()} đ
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      inv.status === 'PAID' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {inv.status === 'PAID' ? 'Đã thu tiền' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isAdmin ? (
                    <div className="flex items-center justify-center gap-2">
                       {inv.status !== 'PAID' && (
                          <>
                            <button onClick={(e) => handleSendNotification(e, inv.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Gửi thông báo">
                               <Send size={16} />
                            </button>
                            <button onClick={(e) => handleConfirmPayment(e, inv.id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Xác nhận thu tiền">
                               <CheckCircle size={16} />
                            </button>
                          </>
                       )}
                       <button onClick={(e) => handleDelete(e, inv.id)} className="p-2 text-red-400 hover:bg-red-50 rounded" title="Xóa">
                          <Trash2 size={16} />
                       </button>
                    </div>
                    ):(
                      <span className="text-xs text-slate-400">---</span>
                      )}
                  </td>
                </tr>
              ))}
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