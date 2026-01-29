'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Branch, branchApi } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import BranchModal from '@/components/rooms/ranchModal'; // Đảm bảo đúng chính tả file của bạn (ranchModal)
import { useAuth } from '@/context/AuthContext';
import { Loader2, MapPin, Building, Plus, Edit, Trash2, ShieldCheck, LayoutDashboard } from 'lucide-react';

export default function BranchListPage() {
  const { user, isAdmin } = useAuth(); // Lấy user để kiểm tra branchId
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchApi.getAll();
      
      // LỌC DỮ LIỆU: Chỉ hiện chi nhánh chưa bị xóa
      let activeBranches = data.filter((b: any) => !b.deletedAt);

      // PHÂN QUYỀN: Nếu Admin bị gán cứng chi nhánh, chỉ hiện duy nhất chi nhánh đó
      if (user?.branchId) {
        activeBranches = activeBranches.filter(b => b.id === user.branchId);
        
        // Nếu chỉ có 1 chi nhánh quản lý, tự động chuyển hướng vào Dashboard chi nhánh đó để giảm thao tác
        if (activeBranches.length === 1) {
          router.push(`/dashboard`); 
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
    if (confirm(`Bạn có chắc muốn đưa khu trọ "${name}" vào mục lưu trữ?`)) {
      try {
        await branchApi.delete(id);
        setBranches(prev => prev.filter(b => b.id !== id));
        alert('Đã chuyển vào mục lưu trữ thành công!');
      } catch (error) {
        alert('Không thể xóa. Vui lòng kiểm tra các phòng đang hoạt động.');
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingBranch) {
        await branchApi.update(editingBranch.id, data);
        alert('Cập nhật khu trọ thành công!');
      } else {
        await branchApi.create(data);
        alert('Thêm khu trọ mới thành công!');
      }
      setIsModalOpen(false);
      fetchBranches(); 
    } catch (error) {
      alert('Lỗi khi lưu thông tin khu trọ.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Quản lý Hệ thống</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              {user?.branchId ? 'Phạm vi quản lý: Cơ sở được chỉ định' : 'Phạm vi quản lý: Toàn chuỗi hệ thống'}
            </p>
          </div>
          
          {/* Chỉ Super Admin mới được thêm khu trọ mới */}
          {isAdmin && !user?.branchId && (
            <button 
              onClick={handleCreate}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              <Plus size={18} /> Thêm Khu Trọ mới
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map((branch) => (
            <div 
              key={branch.id}
              onClick={() => router.push(`/dashboard`)}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all group relative"
            >
              <div className="h-56 bg-slate-100 relative">
                {branch.image ? (
                  <img src={branch.image} alt={branch.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <Building size={64} className="text-slate-200" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">
                    <ShieldCheck size={14} /> Cơ sở hoạt động
                  </div>
                  <h3 className="font-black text-2xl text-white uppercase tracking-tighter line-clamp-1">
                    {branch.name}
                  </h3>
                </div>

                {isAdmin && !user?.branchId && (
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={(e) => handleEdit(e, branch)}
                      className="p-3 bg-white text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-xl"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, branch.id, branch.name)}
                      className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}  
              </div>

              <div className="p-8">
                <div className="flex items-start gap-3 text-slate-500 text-xs mb-8 min-h-[40px] font-bold leading-relaxed uppercase tracking-tight">
                  <MapPin size={16} className="shrink-0 text-blue-500" />
                  <span className="line-clamp-2">{branch.address}</span>
                </div>
                
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quản lý</span>
                      <span className="text-xs font-black text-slate-800 uppercase italic">
                        {branch.manager || 'Chưa chỉ định'}
                      </span>
                   </div>
                   <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <LayoutDashboard size={20} />
                   </div>
                </div>
              </div>
            </div>
          ))}

          {branches.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase tracking-widest italic">Không có khu trọ nào trong phạm vi quản lý</p>
            </div>
          )}
        </div>

        {isAdmin && !user?.branchId && (
          <BranchModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleFormSubmit}
            initialData={editingBranch}
          />
        )}
      </main>
    </div>
  );
}