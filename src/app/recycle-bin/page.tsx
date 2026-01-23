'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { userApi } from '@/services/user.api';
import { roomApi } from '@/services/room.api';
import { contractApi } from '@/services/contract.api';
import { invoiceApi } from '@/services/invoice.api';
import { 
  Loader2, RefreshCcw, Trash2, User, Home, FileText, Receipt, ArchiveRestore 
} from 'lucide-react';

type TabType = 'USERS' | 'ROOMS' | 'CONTRACTS' | 'INVOICES';

export default function RecycleBinPage() {
  const [activeTab, setActiveTab] = useState<TabType>('USERS');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

const fetchDeletedData = async () => {
  setLoading(true);
  try {
    // Ép kiểu cho result là mảng any hoặc mảng chung của các Interface
    let result: any[] = []; 
    
    if (activeTab === 'USERS') result = await userApi.getDeleted();
    if (activeTab === 'ROOMS') result = await roomApi.getDeleted();
    if (activeTab === 'CONTRACTS') result = await contractApi.getDeleted();
    if (activeTab === 'INVOICES') result = await invoiceApi.getDeleted();
    
    setData(result);
  } catch (error) {
    console.error("Lỗi tải thùng rác:", error);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchDeletedData(); }, [activeTab]);

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
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
            <ArchiveRestore size={36} className="text-blue-600" /> Thùng rác hệ thống
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase mt-1 tracking-[0.2em] italic">
            Phân hiệu Đại học Thủy Lợi - Quản lý lưu trữ dữ liệu
          </p>
        </div>

        {/* Tab Switcher - Điều hướng mượt mà */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-[1.5rem] border border-slate-200 w-fit shadow-sm">
          {[
            { id: 'USERS', label: 'Cư dân', icon: User },
            { id: 'ROOMS', label: 'Phòng trọ', icon: Home },
            { id: 'CONTRACTS', label: 'Hợp đồng', icon: FileText },
            { id: 'INVOICES', label: 'Hóa đơn', icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Bảng hiển thị dữ liệu đã xóa */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-5">Thông tin bản ghi</th>
                <th className="px-8 py-5">Thời gian xóa</th>
                <th className="px-8 py-5 text-center">Hành động quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
              ) : data.length > 0 ? (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-black text-base uppercase tracking-tight">
                          {item.fullName || item.roomNumber || `Hợp đồng #${item.id}` || `Hóa đơn tháng ${item.month}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Hệ thống: {item.id}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                         {item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : 'Không rõ ngày xóa'}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleRestore(item.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-green-100 shadow-sm active:scale-95"
                        >
                          <RefreshCcw size={14} /> Khôi phục
                        </button>
                        <button 
                          onClick={() => handleHardDelete(item.id)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest border border-red-100 shadow-sm active:scale-95"
                        >
                          <Trash2 size={14} /> Xóa vĩnh viễn
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-24">
                    <div className="flex flex-col items-center text-slate-200">
                      <ArchiveRestore size={64} className="mb-4 opacity-10" />
                      <p className="font-black text-xs uppercase tracking-[0.3em] text-slate-300">Thùng rác đang trống</p>
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