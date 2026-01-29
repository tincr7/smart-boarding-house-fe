'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { userApi } from '@/services/user.api';
import { roomApi } from '@/services/room.api';
import { contractApi } from '@/services/contract.api';
import { invoiceApi } from '@/services/invoice.api';
import { useAuth } from '@/context/AuthContext'; // MỚI: Dùng AuthContext để lọc chi nhánh
import { 
  Loader2, RefreshCcw, Trash2, User, Home, FileText, Receipt, ArchiveRestore, Building2 
} from 'lucide-react';

type TabType = 'USERS' | 'ROOMS' | 'CONTRACTS' | 'INVOICES';

export default function RecycleBinPage() {
  const { user: currentUser } = useAuth(); // Lấy thông tin người dùng hiện tại
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeletedData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let result: any[] = []; 
      // Lấy branchId từ user hiện tại để gửi lên API
      const branchId = currentUser.branchId || undefined;
      
      if (activeTab === 'USERS') result = await userApi.getDeleted(branchId);
      if (activeTab === 'ROOMS') result = await roomApi.getDeleted(branchId);
      if (activeTab === 'CONTRACTS') result = await contractApi.getDeleted(branchId);
      if (activeTab === 'INVOICES') result = await invoiceApi.getDeleted(branchId);
      
      setData(result);
    } catch (error) {
      console.error("Lỗi tải thùng rác:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeletedData(); }, [activeTab, currentUser]);

  const handleRestore = async (id: number) => {
    if (!confirm('Bạn có chắc muốn KHÔI PHỤC bản ghi này về trạng thái hoạt động?')) return;
    try {
      if (activeTab === 'USERS') await userApi.restore(id);
      if (activeTab === 'ROOMS') await roomApi.restore(id);
      if (activeTab === 'CONTRACTS') await contractApi.restore(id);
      if (activeTab === 'INVOICES') await invoiceApi.restore(id);
      
      alert('Khôi phục dữ liệu thành công!');
      fetchDeletedData();
    } catch (error) { alert('Lỗi: Không thể khôi phục bản ghi.'); }
  };

  const handleHardDelete = async (id: number) => {
    if (!confirm('CẢNH BÁO: Hành động này sẽ XÓA VĨNH VIỄN khỏi cơ sở dữ liệu và không thể hoàn tác!')) return;
    try {
      if (activeTab === 'USERS') await userApi.hardDelete(id);
      if (activeTab === 'ROOMS') await roomApi.hardDelete(id);
      if (activeTab === 'CONTRACTS') await contractApi.hardDelete(id);
      if (activeTab === 'INVOICES') await invoiceApi.hardDelete(id);
      
      alert('Đã xóa vĩnh viễn dữ liệu.');
      fetchDeletedData();
    } catch (error) { alert('Lỗi: Không thể xóa vĩnh viễn.'); }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3 italic">
              <ArchiveRestore size={36} className="text-blue-600" /> Thùng rác hệ thống
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <Building2 size={12} className="text-blue-400" />
              Phạm vi: {currentUser?.branchId ? `Dữ liệu chi nhánh ${currentUser.branchId}` : 'Toàn bộ hệ thống SmartHouse'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-[1.8rem] border border-slate-200 w-fit shadow-sm">
          {[
            { id: 'USERS', label: 'Cư dân', icon: User },
            { id: 'ROOMS', label: 'Phòng trọ', icon: Home },
            { id: 'CONTRACTS', label: 'Hợp đồng', icon: FileText },
            { id: 'INVOICES', label: 'Hóa đơn', icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách dữ liệu */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-5">Thông tin đối tượng</th>
                <th className="px-8 py-5">Nhãn thời gian xóa</th>
                <th className="px-8 py-5 text-center">Thao tác phục hồi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-24"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-800 font-black text-sm uppercase tracking-tight">
                          {item.fullName || item.roomNumber || (item.month ? `Hóa đơn Tháng ${item.month}` : `Hợp đồng #${item.id}`)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-blue-500 uppercase px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">ID: {item.id}</span>
                          {item.branchId && (
                            <span className="text-[9px] font-black text-slate-400 uppercase">Cơ sở: {item.branchId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-600 uppercase">
                            {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('vi-VN') : '--'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            Lúc {item.deletedAt ? new Date(item.deletedAt).toLocaleTimeString('vi-VN') : '--'}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleRestore(item.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest border border-emerald-100 shadow-sm active:scale-95"
                        >
                          <RefreshCcw size={14} /> Khôi phục
                        </button>
                        <button 
                          onClick={() => handleHardDelete(item.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest border border-red-100 shadow-sm active:scale-95"
                        >
                          <Trash2 size={14} /> Xóa vĩnh viễn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-32">
                    <div className="flex flex-col items-center opacity-20">
                      <ArchiveRestore size={80} className="mb-4 text-slate-300" />
                      <p className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-400">Kho lưu trữ trống</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}