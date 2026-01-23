'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { branchApi, Branch } from '@/services/branch.api';
import { Loader2, Plus, Send, CheckCircle, Trash2, MapPin, MailCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { contractApi } from '@/services/contract.api';

export default function InvoicesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesData, branchesData] = await Promise.all([
        invoiceApi.getAll(),
        branchApi.getAll()
      ]);

      // 1. LỌC DỮ LIỆU SẠCH (Ẩn các hóa đơn đã xóa mềm)
      const activeInvoices = invoicesData.filter((inv: any) => !inv.deletedAt);

      if (isAdmin) {
        setInvoices(activeInvoices);
      } else {
        const allContracts = await contractApi.getAll();
        const myActiveRoomIds = allContracts
           .filter(c => c.userId === user?.id && c.status === 'ACTIVE')
           .map(c => c.roomId);

        const myInvoices = activeInvoices.filter(inv => myActiveRoomIds.includes(inv.roomId));
        setInvoices(myInvoices);
      }
      setBranches(branchesData);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getBranchName = (branchId: number) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '---';
  };

  const handleCreate = async (data: any) => {
    try {
      await invoiceApi.create(data);
      alert('Lập hóa đơn thành công! Hệ thống đang tự động gửi Email cho cư dân.');
      fetchData();
    } catch (error) { alert('Lỗi khi lập hóa đơn.'); }
  };

  const handleConfirmPayment = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Xác nhận đã thu tiền cho hóa đơn này?')) {
       await invoiceApi.confirmPayment(id);
       fetchData();
    }
  };

  // 2. TÍCH HỢP GỬI THÔNG BÁO THẬT QUA MAIL
  const handleSendNotification = async (e: any, id: number) => {
    e.stopPropagation();
    try {
      await invoiceApi.sendNotification(id);
      alert('Đã gửi mail nhắc nợ thành công đến cư dân!');
    } catch (error) { alert('Gửi mail thất bại. Vui lòng kiểm tra lại cấu hình SMTP.'); }
  };

  // 3. XỬ LÝ XÓA MỀM (Soft Delete)
  const handleDelete = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Bạn có chắc muốn đưa hóa đơn này vào kho lưu trữ? (Dùng khi nhập sai số điện/nước)')) {
       try {
         await invoiceApi.delete(id);
         setInvoices(prev => prev.filter(inv => inv.id !== id)); // UI cập nhật ngay lập tức
         alert('Đã chuyển hóa đơn vào mục lưu trữ.');
       } catch (error) { alert('Không thể xóa hóa đơn này.'); }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Hóa đơn & Tiền điện nước</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic">
              Đại học Thủy Lợi - Quản lý trọ thông minh
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
              <Plus size={20} /> Lập hóa đơn mới
            </button>
          )}
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-6 py-5">Khu vực / Phòng</th>
                <th className="px-6 py-5">Tháng/Năm</th>
                <th className="px-6 py-5">Chỉ số Điện</th>
                <th className="px-6 py-5">Chỉ số Nước</th>
                <th className="px-6 py-5 text-right">Tổng thanh toán</th>
                <th className="px-6 py-5 text-center">Trạng thái</th>
                <th className="px-6 py-5 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)} className="hover:bg-blue-50/30 cursor-pointer transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 uppercase">
                        <MapPin size={10} className="text-blue-500" /> {getBranchName(inv.room?.branchId)}
                      </span>
                      <span className="text-lg font-black text-slate-800">PHÒNG {inv.room?.roomNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-slate-600 text-xs uppercase tracking-tight">Tháng {inv.month}/{inv.year}</td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                       <span className="text-blue-600 text-sm font-black">{inv.newElectricity - inv.oldElectricity} kWh</span>
                       <span className="text-[10px] text-slate-300 italic">{inv.oldElectricity} → {inv.newElectricity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                       <span className="text-cyan-600 text-sm font-black">{inv.newWater - inv.oldWater} m³</span>
                       <span className="text-[10px] text-slate-300 italic">{inv.oldWater} → {inv.newWater}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right text-xl font-black text-slate-900 tracking-tighter">
                    {Number(inv.totalAmount).toLocaleString()} <span className="text-xs text-slate-400 font-bold">đ</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                      inv.status === 'PAID' 
                      ? 'bg-green-500 text-white border-green-400' 
                      : 'bg-red-500 text-white border-red-400'
                    }`}>
                      {inv.status === 'PAID' ? 'Đã thu' : 'Nợ phí'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {isAdmin ? (
                      <div className="flex items-center justify-center gap-2">
                         {inv.status !== 'PAID' && (
                            <>
                              <button onClick={(e) => handleSendNotification(e, inv.id)} className="p-2.5 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm border border-blue-50" title="Gửi Mail Nhắc Nợ">
                                 <Send size={16} />
                              </button>
                              <button onClick={(e) => handleConfirmPayment(e, inv.id)} className="p-2.5 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm border border-green-50" title="Xác nhận Thu Tiền">
                                 <CheckCircle size={16} />
                              </button>
                            </>
                         )}
                         <button onClick={(e) => handleDelete(e, inv.id)} className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent" title="Xóa mềm">
                            <Trash2 size={16} />
                         </button>
                      </div>
                    ) : (
                      <span className="text-slate-200">---</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}