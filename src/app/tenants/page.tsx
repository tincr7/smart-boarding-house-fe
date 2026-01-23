'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import TenantModal from '@/components/tenants/TenantModal';
import { userApi, User } from '@/services/user.api';
import FaceRegistrationModal from '@/components/tenants/FaceRegistrationModal';
import FaceVerifyModal from '@/components/tenants/FaceVerifyModal'; 
import { contractApi, Contract } from '@/services/contract.api';
import { 
  Loader2, Search, Plus, Trash2, Home as HomeIcon, 
  Phone, Mail, User as UserIcon, ScanFace, ShieldCheck, Archive
} from 'lucide-react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: number, fullName: string} | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, contractsData] = await Promise.all([
        userApi.getAll(),
        contractApi.getAll()
      ]);

      // LỌC XÓA MỀM: Chỉ lấy những cư dân chưa bị xóa (deletedAt === null)
      const tenantList = usersData.filter((u: any) => u.role === 'TENANT' && !u.deletedAt); 
      setTenants(tenantList);
      setContracts(contractsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (data: any) => {
    try {
      await userApi.create(data);
      alert('Thêm cư dân thành công!');
      fetchData(); 
    } catch (error) {
      alert('Lỗi khi thêm cư dân.');
    }
  };

  // CẬP NHẬT HÀM XÓA MỀM
  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn đưa cư dân "${name}" vào danh sách lưu trữ?`)) {
      try {
        // Gọi API xóa mềm (Backend gán deletedAt)
        await userApi.delete(id);
        
        // Cập nhật State cục bộ để biến mất ngay lập tức trên UI
        setTenants(prev => prev.filter(t => t.id !== id));
        
        alert('Đã xóa mềm thành công!');
      } catch (error) {
        alert('Không thể xóa cư dân này.');
      }
    }
  };

  const handleOpenFaceRegistration = (user: User) => {
    setSelectedUser({ id: user.id, fullName: user.fullName });
    setIsFaceModalOpen(true);
  };

  const handleOpenFaceVerify = (user: User) => {
    setSelectedUser({ id: user.id, fullName: user.fullName });
    setIsVerifyModalOpen(true);
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);

  const getCurrentRoom = (userId: number) => {
    const activeContract = contracts.find(c => 
      c.userId === userId && c.status === 'ACTIVE'
    );

    if (activeContract && activeContract.room) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-bold border border-green-200">
          <HomeIcon size={14} /> {activeContract.room.roomNumber}
        </span>
      );
    }
    return <span className="text-slate-400 text-sm italic">Chưa thuê phòng</span>;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Quản lý Cư dân</h1>
             <p className="text-slate-500 text-sm mt-1">Hệ thống định danh AI & Quản lý lưu trú</p>
          </div>
          <div className="flex gap-3">
            {/* Nút Thùng rác (Demo tính năng lưu trữ) */}
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100">
               <Archive size={20} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              <Plus size={20} /> Thêm Cư dân
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên, SĐT, email cư dân..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-400 font-medium">
            Hiển thị {filteredTenants.length} cư dân đang hoạt động
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Thông tin cư dân</th>
                <th className="px-6 py-4">Liên lạc</th>
                <th className="px-6 py-4">Tình trạng phòng</th>
                <th className="px-6 py-4 text-center">Hành động AI & Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((user) => {
                  const hasFaceData = user.faceDescriptor && user.faceDescriptor.length > 0;
                  
                  return (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                            {user.avatar ? (
                               <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                            ) : (
                               <UserIcon size={20} className="text-slate-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{user.fullName}</p>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Mã: {user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <Phone size={12} className="text-blue-500" /> {user.phone || 'Chưa cập nhật'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail size={12} className="text-slate-300" /> {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getCurrentRoom(user.id)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                             onClick={() => handleOpenFaceRegistration(user)}
                             className={`p-2 rounded-xl transition-all border shadow-sm ${
                               hasFaceData 
                               ? 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100' 
                               : 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 animate-pulse'
                             }`}
                             title="Đăng ký FaceID"
                          >
                             <ScanFace size={18} />
                          </button>

                          {hasFaceData && (
                            <button 
                               onClick={() => handleOpenFaceVerify(user)}
                               className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl shadow-sm transition-all"
                               title="Thử nghiệm mở cửa AI"
                            >
                               <ShieldCheck size={18} />
                            </button>
                          )}

                          <button 
                             onClick={() => handleDelete(user.id, user.fullName)}
                             className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all border border-transparent"
                             title="Xóa cư dân (Soft Delete)"
                          >
                             <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                 <tr><td colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center text-slate-400">
                      <UserIcon size={48} className="mb-2 opacity-20" />
                      <p className="font-medium">Không tìm thấy cư dân nào hoạt động</p>
                    </div>
                 </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <TenantModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
      
      {isFaceModalOpen && selectedUser && (
        <FaceRegistrationModal 
          user={selectedUser}
          onClose={() => setIsFaceModalOpen(false)}
          onSuccess={() => {
            setIsFaceModalOpen(false);
            fetchData(); 
          }}
        />
      )}

      {isVerifyModalOpen && selectedUser && (
        <FaceVerifyModal 
          user={selectedUser}
          onClose={() => setIsVerifyModalOpen(false)}
        />
      )}
    </div>
  );
}