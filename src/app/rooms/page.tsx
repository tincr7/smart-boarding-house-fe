'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Branch, branchApi } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import BranchModal from '@/components/rooms/ranchModal';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MapPin, Building, Plus, Edit, Trash2, Archive } from 'lucide-react';

export default function BranchListPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchApi.getAll();
      // LỌC XÓA MỀM: Chỉ hiện chi nhánh chưa bị xóa
      const activeBranches = data.filter((b: any) => !b.deletedAt);
      setBranches(activeBranches);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleCreate = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation();
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  // XỬ LÝ XÓA MỀM
  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    // Thay đổi thông báo để người dùng biết là dữ liệu được lưu trữ
    if (confirm(`Bạn có chắc chắn muốn đưa khu trọ "${name}" vào danh sách lưu trữ không?`)) {
      try {
        await branchApi.delete(id);
        
        // CẬP NHẬT UI TỨ THÌ: Biến mất ngay không cần đợi load lại toàn bộ
        setBranches(prev => prev.filter(b => b.id !== id));
        
        alert('Đã chuyển khu trọ vào mục lưu trữ thành công!');
      } catch (error) {
        alert('Xóa thất bại. Kiểm tra xem khu trọ có phòng đang hoạt động không.');
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    if (editingBranch) {
      await branchApi.update(editingBranch.id, data);
    } else {
      await branchApi.create(data);
    }
    setIsModalOpen(false);
    fetchBranches(); 
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Khu Trọ</h1>
            <p className="text-slate-500 mt-1">Hệ thống quản lý chuỗi nhà trọ tích hợp</p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              {/* Nút xem thùng rác chi nhánh (Option) */}
              <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl border border-slate-200 transition-all">
                <Archive size={20} />
              </button>
              <button 
                onClick={handleCreate}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                <Plus size={20} /> Thêm Khu Trọ
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {branches.map((branch) => (
              <div 
                key={branch.id}
                onClick={() => router.push(`/rooms/${branch.id}`)}
                className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1.5 transition-all group relative"
              >
                <div className="h-48 bg-slate-100 relative">
                  {branch.image ? (
                    <img src={branch.image} alt={branch.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                      <Building size={48} className="opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {isAdmin && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <button 
                        onClick={(e) => handleEdit(e, branch)}
                        className="p-2.5 bg-white/95 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, branch.id, branch.name)}
                        className="p-2.5 bg-white/95 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Xóa mềm (Lưu trữ)"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}  
                </div>

                <div className="p-6">
                  <h3 className="font-black text-xl text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1 uppercase tracking-tight">
                    {branch.name}
                  </h3>
                  <div className="flex items-start gap-2 text-slate-500 text-xs mb-6 min-h-[32px] font-medium leading-relaxed">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-blue-500" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quản lý bởi</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 uppercase">
                      {branch.manager || 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isAdmin && (
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