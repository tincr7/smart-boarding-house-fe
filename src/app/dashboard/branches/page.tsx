'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Branch, branchApi } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MapPin, Building, Plus, Edit, Trash2, ShieldCheck, Home } from 'lucide-react';
import BranchModal from '@/components/rooms/ranchModal'; // Giữ nguyên đường dẫn của bạn (lưu ý typo 'ranchModal')
import Breadcrumbs from '@/components/shared/Breadcrumbs';

export default function DashboardBranchesPage() {
  const { user, isAdmin } = useAuth(); 
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchApi.getAll();
      
      let activeBranches = data.filter((b: any) => !b.deletedAt);

      if (user?.branchId) {
        activeBranches = activeBranches.filter(b => Number(b.id) === Number(user.branchId));
        
        if (activeBranches.length === 1) {
          router.push(`/dashboard/rooms?branchId=${user.branchId}`); 
          return;
        }
      }

      setBranches(activeBranches);
    } catch (error) {
      console.error("Lỗi tải danh sách chi nhánh:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchBranches(); 
  }, [user]);

  const handleCreate = () => { 
    setEditingBranch(null); 
    setIsModalOpen(true); 
  };
  
  const handleEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (confirm(`Hệ thống AI sẽ đưa khu trọ "${name}" vào mục lưu trữ. Xác nhận?`)) {
      try {
        await branchApi.delete(id);
        setBranches(prev => prev.filter(b => b.id !== id));
        alert('Đã chuyển vào lưu trữ thành công!');
      } catch (error) {
        alert('Lỗi: Khu trọ đang có phòng hoạt động hoặc cư dân lưu trú.');
      }
    }
  };

  // 🔥 FIX QUAN TRỌNG: Lọc sạch dữ liệu trước khi gửi để tránh lỗi trùng ID
  const handleFormSubmit = async (data: any) => {
    try {
      // 1. Tạo payload thủ công để đảm bảo KHÔNG dính trường 'id' rác từ form
      const payload = {
        name: data.name.trim(),
        address: data.address.trim(),
        manager: data.manager.trim(),
        image: data.image || '', // Đảm bảo gửi image nếu có
      };

      if (editingBranch) {
        // Update: Cần ID, lấy từ state editingBranch
        await branchApi.update(editingBranch.id, payload);
        alert('Cập nhật hồ sơ khu trọ thành công!');
      } else {
        // Create: TUYỆT ĐỐI KHÔNG GỬI ID. Payload ở trên đã sạch.
        const res = await branchApi.create(payload);
        console.log("✅ Kết quả tạo chi nhánh:", res);
        alert('Khởi tạo khu trọ mới thành công!');
      }
      
      setIsModalOpen(false);
      fetchBranches(); // Load lại dữ liệu từ server
    } catch (error: any) {
      // Xử lý hiển thị lỗi chi tiết từ Backend
      const errorMsg = error.response?.data?.message || 'Lỗi khi đồng bộ dữ liệu chi nhánh.';
      console.error("❌ Lỗi API:", error.response?.data);
      alert(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang quét dữ liệu hệ thống...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8 selection:bg-blue-100">
      
      {/* TÍCH HỢP BREADCRUMBS */}
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'Quản trị hệ thống' }
          ]} 
        />
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">
            Quản lý Chi Nhánh
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            {user?.branchId ? `Phạm vi vận hành: Cơ sở ${user.branchId}` : 'Toàn quyền SmartHouse System'}
          </p>
        </div>
        
        {isAdmin && !user?.branchId && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Khởi tạo chi nhánh
          </button>
        )}
      </div>
      
      {/* LIST BRANCHES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {branches.map((branch) => (
          <div 
            key={branch.id}
            onClick={() => router.push(`/dashboard/rooms?branchId=${branch.id}`)} 
            className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-2 transition-all duration-500 group relative flex flex-col"
          >
            <div className="h-56 rounded-[1.5rem] bg-slate-100 relative overflow-hidden mb-6">
              {branch.image ? (
                <img src={branch.image} alt={branch.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-200">
                  <Building size={64} />
                </div>
              )}
              
              {isAdmin && !user?.branchId && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                  <button onClick={(e) => handleEdit(e, branch)} className="p-3 bg-white/95 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white shadow-xl transition-colors"><Edit size={16} /></button>
                  <button onClick={(e) => handleDelete(e, branch.id, branch.name)} className="p-3 bg-white/95 text-red-500 rounded-xl hover:bg-red-500 hover:text-white shadow-xl transition-colors"><Trash2 size={16} /></button>
                </div>
              )}  
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 text-emerald-500 font-black text-[9px] uppercase tracking-widest mb-2 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                <ShieldCheck size={12} className="fill-emerald-500/20" /> Hệ thống Online
              </div>
              <h3 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">
                {branch.name}
              </h3>
              <div className="flex items-start gap-2 text-slate-400 text-xs font-bold uppercase mb-8">
                <MapPin size={16} className="shrink-0 mt-0.5 text-blue-500" />
                <span className="line-clamp-2 leading-relaxed">{branch.address}</span>
              </div>
              
              <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                 <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Phụ trách</p>
                    <p className="text-[10px] font-black text-slate-700 uppercase">{branch.manager || 'Tổng quản lý'}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-full text-slate-300 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-[-45deg] transition-all shadow-sm">
                    <Home size={20} />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <BranchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} initialData={editingBranch} />
    </div>
  );
}