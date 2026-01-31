'use client';

import { useEffect, useState } from 'react';
import { userApi } from '@/services/user.api';
import { roomApi } from '@/services/room.api';
import { contractApi } from '@/services/contract.api';
import { invoiceApi } from '@/services/invoice.api';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { 
  Loader2, RefreshCcw, Trash2, User, Home, FileText, Receipt, ArchiveRestore, Building2 
} from 'lucide-react';

type TabType = 'USERS' | 'ROOMS' | 'CONTRACTS' | 'INVOICES';

export default function AdminRecycleBinPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('CONTRACTS');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeletedData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let result: any[] = []; 
      const branchId = currentUser.branchId ? Number(currentUser.branchId) : undefined;
      
      if (activeTab === 'USERS') result = await userApi.getDeleted(branchId);
      if (activeTab === 'ROOMS') result = await roomApi.getDeleted(branchId);
      if (activeTab === 'CONTRACTS') result = await contractApi.getDeleted(branchId);
      if (activeTab === 'INVOICES') result = await invoiceApi.getDeleted(branchId);
      
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Lỗi tải thùng rác:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeletedData(); }, [activeTab, currentUser]);

  const handleRestore = async (id: number) => {
    if (!confirm('Hệ thống sẽ khôi phục bản ghi này về trạng thái hoạt động. Xác nhận?')) return;
    try {
      if (activeTab === 'USERS') await userApi.restore(id);
      if (activeTab === 'ROOMS') await roomApi.restore(id);
      if (activeTab === 'CONTRACTS') await contractApi.restore(id);
      if (activeTab === 'INVOICES') await invoiceApi.restore(id);
      
      alert('✅ Khôi phục thành công!');
      fetchDeletedData();
    } catch (error: any) { 
      const msg = error.response?.data?.message || 'Lỗi khôi phục.';
      alert(`❌ Lỗi: ${msg}`); 
    }
  };

  const handleHardDelete = async (id: number) => {
    if (!confirm('CẢNH BÁO: Thao tác xóa vĩnh viễn không thể hoàn tác. Bạn chắc chắn?')) return;
    try {
      if (activeTab === 'USERS') await userApi.hardDelete(id);
      if (activeTab === 'ROOMS') await roomApi.hardDelete(id);
      if (activeTab === 'CONTRACTS') await contractApi.hardDelete(id);
      if (activeTab === 'INVOICES') await invoiceApi.hardDelete(id);
      
      alert('✅ Đã xóa vĩnh viễn dữ liệu.');
      fetchDeletedData();
    } catch (error) { alert('❌ Lỗi hệ thống.'); }
  };

  return (
    <> {/* Fragment bọc ngoài để tránh lỗi JSX Parent Element */}
      <div className="p-8 space-y-8 selection:bg-blue-100">
        
        {/* TÍCH HỢP BREADCRUMBS */}
        <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Breadcrumbs 
            items={[
              { label: 'Quản trị hệ thống', href: '/dashboard/branches' },
              { label: 'Thùng rác' }
            ]} 
          />
        </div>

        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4 leading-none mb-3">
              <ArchiveRestore size={44} className="text-blue-600 drop-shadow-sm" /> 
              Thùng rác hệ thống
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
              <Building2 size={12} className="text-blue-500" />
              Phạm vi quản lý: {currentUser?.branchId ? `Cơ sở ${currentUser.branchId}` : 'Toàn bộ SmartHouse'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 bg-white p-2 rounded-[1.8rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            {[
              { id: 'CONTRACTS', label: 'Hợp đồng', icon: FileText },
              { id: 'USERS', label: 'Cư dân', icon: User },
              { id: 'ROOMS', label: 'Phòng trọ', icon: Home },
              { id: 'INVOICES', label: 'Hóa đơn', icon: Receipt },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 ${
                  activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-400/20' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? 'text-blue-400' : ''} /> 
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách dữ liệu đã xóa */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b">
                <tr>
                  <th className="px-10 py-6">Chứng từ & Thông tin lưu trữ</th>
                  <th className="px-10 py-6">Thời điểm xóa</th>
                  <th className="px-10 py-6 text-center">Lệnh thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-32"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-2">
                          {activeTab === 'CONTRACTS' && (
                            <div className="flex flex-col">
                              <span className="text-slate-900 font-black text-base uppercase italic tracking-tighter flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                                <FileText size={16} className="text-blue-500"/> {item.user?.fullName || 'Bản ghi rỗng'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                Mã phòng: <span className="text-slate-600 font-black italic">P.{item.room?.roomNumber || '---'}</span>
                              </span>
                            </div>
                          )}
                          {activeTab === 'USERS' && (
                            <div className="flex flex-col">
                               <span className="text-slate-900 font-black text-base uppercase italic">{item.fullName}</span>
                               <span className="text-[10px] text-slate-400 font-bold tracking-tight">{item.email}</span>
                            </div>
                          )}
                          {activeTab === 'ROOMS' && (
                             <div className="flex flex-col">
                                <span className="text-slate-900 font-black text-base uppercase italic">Phòng {item.roomNumber}</span>
                                <span className="text-[10px] text-blue-600 font-black uppercase">{Number(item.price).toLocaleString()} đ</span>
                             </div>
                          )}
                           {activeTab === 'INVOICES' && (
                             <div className="flex flex-col">
                                <span className="text-slate-900 font-black text-base uppercase italic leading-none">Hóa đơn T{item.month}/{item.year}</span>
                                <span className="text-[10px] text-emerald-600 font-black mt-1">{Number(item.totalAmount).toLocaleString()} đ</span>
                             </div>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[8px] font-black text-slate-400 uppercase px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 tracking-widest">Digital ID: {item.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col border-l-2 border-slate-100 pl-4">
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                              {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString('vi-VN') : '--'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold italic">
                              {item.deletedAt ? new Date(item.deletedAt).toLocaleTimeString('vi-VN') : '--'}
                            </span>
                         </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex justify-center gap-4">
                          <button 
                            onClick={() => handleRestore(item.id)} 
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest border border-emerald-100 shadow-sm active:scale-95"
                          >
                            <RefreshCcw size={14} /> Khôi phục
                          </button>
                          <button 
                            onClick={() => handleHardDelete(item.id)} 
                            className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest border border-red-100 shadow-sm active:scale-95"
                          >
                            <Trash2 size={14} /> Xóa vĩnh viễn
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-40 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <ArchiveRestore size={100} className="mb-6 text-slate-200" />
                        <p className="font-black text-[11px] uppercase tracking-[0.5em] text-slate-300">Dữ liệu lưu trữ sạch sẽ</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}