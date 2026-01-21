'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Branch, branchApi } from '@/services/branch.api';
import Sidebar from '@/components/shared/Sidebar';
import BranchModal from '@/components/rooms/ranchModal';
import { useAuth } from '@/context/AuthContext';
import { Loader2, MapPin, Building, Plus, Edit, Trash2 } from 'lucide-react';

export default function BranchListPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // Hàm load dữ liệu
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchApi.getAll();
      setBranches(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Xử lý Mở Modal Thêm
  const handleCreate = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  // Xử lý Mở Modal Sửa
  const handleEdit = (e: React.MouseEvent, branch: Branch) => {
    e.stopPropagation(); // Chặn click lan ra thẻ cha (không navigate)
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  // Xử lý Xóa
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Chặn click lan ra thẻ cha
    if (confirm('Bạn có chắc chắn muốn xóa khu trọ này không? Hành động này không thể hoàn tác.')) {
      try {
        await branchApi.delete(id);
        fetchBranches(); // Load lại danh sách
      } catch (error) {
        alert('Xóa thất bại. Có thể khu trọ đang có phòng hoạt động.');
      }
    }
  };

  // Xử lý Submit Form (Create hoặc Update)
  const handleFormSubmit = async (data: any) => {
    if (editingBranch) {
      // Logic Sửa
      await branchApi.update(editingBranch.id, data);
    } else {
      // Logic Thêm
      await branchApi.create(data);
    }
    fetchBranches(); 
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Khu Trọ</h1>
            <p className="text-slate-500 mt-1">Danh sách các chi nhánh nhà trọ của bạn</p>
          </div>
          {isAdmin && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> Thêm Khu Trọ
          </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <div 
                key={branch.id}
                onClick={() => router.push(`/rooms/${branch.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group relative"
              >
                {/* Image Cover */}
                <div className="h-48 bg-slate-100 relative">
                  {branch.image ? (
                    <img src={branch.image} alt={branch.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                      <Building size={48} className="opacity-50" />
                    </div>
                  )}
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                  
                  {/* Nút Action (Chỉ hiện khi hover hoặc trên mobile) */}
                  {isAdmin ? (
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    
                    <button 
                      onClick={(e) => handleEdit(e, branch)}
                      className="p-2 bg-white/90 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, branch.id)}
                      className="p-2 bg-white/90 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  ) : (
                    <span className="text-xs text-slate-400">Chỉ xem</span>
                  )}  
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {branch.name}
                  </h3>
                  <div className="flex items-start gap-2 text-slate-500 text-sm mb-4 min-h-[40px]">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Quản lý</div>
                    <div className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                      {branch.manager}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Component */}
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