'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InvoiceModal from '@/components/invoices/InvoiceModal';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { branchApi, Branch } from '@/services/branch.api';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { 
  Loader2, Plus, Send, CheckCircle, Trash2, 
  MapPin, Building2, Search, Calendar, WalletCards
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminInvoicesPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentBranchFilter = user?.branchId || selectedBranch;

      const [invoicesData, branchesData] = await Promise.all([
        invoiceApi.getAll(currentBranchFilter),
        branchApi.getAll()
      ]);

      const activeInvoices = invoicesData.filter((inv: any) => !inv.deletedAt);
      setInvoices(activeInvoices);
      setBranches(branchesData);
    } catch (error) { 
      console.error('Lỗi tải dữ liệu hóa đơn:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (user) fetchData();
  }, [selectedBranch, user]);

  const getBranchName = (branchId?: number) => {
    if (!branchId) return 'Toàn hệ thống';
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : '...';
  };

  const handleCreate = async (data: any) => {
    try {
      const payload = { ...data, branchId: user?.branchId || data.branchId };
      await invoiceApi.create(payload);
      alert('Lập hóa đơn thành công!');
      setIsModalOpen(false);
      fetchData();
    } catch (error) { 
      alert('Lỗi khi lập hóa đơn.'); 
    }
  };

  const handleConfirmPayment = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Xác nhận cư dân đã đóng tiền?')) {
       try {
         await invoiceApi.confirmPayment(id);
         fetchData();
       } catch (error) { alert('Lỗi xác nhận.'); }
    }
  };

  const handleSendNotification = async (e: any, id: number) => {
    e.stopPropagation();
    try {
      await invoiceApi.sendNotification(id);
      alert('Đã gửi mail nhắc nợ!');
    } catch (error) { alert('Gửi mail thất bại.'); }
  };

  const handleDelete = async (e: any, id: number) => {
    e.stopPropagation();
    if(confirm('Chuyển hóa đơn vào thùng rác?')) {
       try {
         await invoiceApi.delete(id);
         fetchData();
       } catch (error) { alert('Lỗi xóa.'); }
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.room?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 selection:bg-blue-100">
      
      {/* TÍCH HỢP BREADCRUMBS */}
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'Quản trị hệ thống', href: '/dashboard/branches' },
            { label: 'Quản lý Thu Chi' }
          ]} 
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">
            Hóa đơn & Dòng tiền
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Vận hành tài chính hệ thống SmartHouse
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Tìm số phòng..."
              className="pl-12 pr-6 py-4 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all text-[10px] font-black uppercase w-full md:w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdmin && !user?.branchId && (
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <Building2 size={16} className="text-blue-500" />
              <select 
                className="text-[10px] font-black uppercase outline-none bg-transparent cursor-pointer"
                value={selectedBranch || ''}
                onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Tất cả cơ sở --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Lập hóa đơn mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-6">Đối tượng phòng</th>
                <th className="px-8 py-6 text-center">Kỳ thu chi</th>
                <th className="px-8 py-6 text-right">Tổng thanh toán</th>
                <th className="px-8 py-6 text-center">Trạng thái</th>
                <th className="px-8 py-6 text-right pr-12">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-24"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => router.push(`/dashboard/invoices/${inv.id}`)} 
                    className="hover:bg-blue-50/30 cursor-pointer group transition-colors"
                  >
                    <td className="px-8 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">
                          <WalletCards size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-300 font-black uppercase tracking-wider mb-1">{getBranchName(inv.room?.branchId)}</span>
                          <span className="text-sm font-black text-slate-800 italic uppercase">Phòng {inv.room?.roomNumber}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <span className="px-4 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black tracking-widest text-slate-500 uppercase">
                        T.{inv.month} — {inv.year}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-right">
                      <span className="text-lg font-black text-slate-900 italic tracking-tighter">
                        {Number(inv.totalAmount).toLocaleString()} <span className="text-xs">đ</span>
                      </span>
                    </td>
                    <td className="px-8 py-7 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black border tracking-widest uppercase shadow-sm ${
                        inv.status === 'PAID' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                      }`}>
                        {inv.status === 'PAID' ? 'Hoàn tất' : 'Chưa thu'}
                      </span>
                    </td>
                    <td className="px-8 py-7 text-right pr-12" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-3">
                        {inv.status !== 'PAID' && (
                          <>
                            <button 
                              onClick={(e) => handleSendNotification(e, inv.id)} 
                              className="p-3 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-50 shadow-sm transition-all" 
                              title="Gửi mail nhắc nợ"
                            >
                              <Send size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleConfirmPayment(e, inv.id)} 
                              className="p-3 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-50 shadow-sm transition-all" 
                              title="Xác nhận đã thu tiền"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => handleDelete(e, inv.id)} 
                          className="p-3 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" 
                          title="Xóa hóa đơn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center flex flex-col items-center gap-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-100"><WalletCards size={64} /></div>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Không tìm thấy dữ liệu hóa đơn tương ứng</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <InvoiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}