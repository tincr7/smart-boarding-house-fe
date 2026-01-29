'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import TenantModal from '@/components/tenants/TenantModal';
import { userApi, User } from '@/services/user.api';
import FaceRegistrationModal from '@/components/tenants/FaceRegistrationModal';
import FaceVerifyModal from '@/components/tenants/FaceVerifyModal'; 
import { contractApi, Contract } from '@/services/contract.api';
import { useAuth } from '@/context/AuthContext'; // MỚI: Dùng AuthContext để lấy branchId
import { 
  Loader2, Search, Plus, Trash2, Home as HomeIcon, 
  User as UserIcon, ScanFace, ShieldCheck,
  Lock, Unlock, Building2,
  Mail,
  Phone
} from 'lucide-react';

export default function TenantsPage() {
  const { user: currentUser } = useAuth(); // Lấy thông tin Admin đang đăng nhập
  const [tenants, setTenants] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: number, fullName: string} | null>(null);

  // 1. Tải dữ liệu lọc theo chi nhánh của Admin
  const fetchData = async () => {
    try {
      setLoading(true);
      // Lấy branchId từ user hiện tại trong AuthContext
      const branchId = currentUser?.branchId || undefined;

      const [usersData, contractsData] = await Promise.all([
        userApi.getAll(branchId), // Gửi branchId lên để lọc User
        contractApi.getAll(undefined, branchId) // Gửi branchId lên để lọc Contract
      ]);

      // Lọc danh sách Tenant (Backend đã lọc chi nhánh, FE lọc role & deletedAt)
      const tenantList = usersData.filter((u: any) => u.role === 'TENANT' && !u.deletedAt); 
      setTenants(tenantList);
      setContracts(contractsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu cư dân:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (currentUser) fetchData(); 
  }, [currentUser]); // Load lại khi thông tin User đăng nhập khả dụng

  // 2. Xử lý Khóa/Mở khóa tài khoản
  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? 'KHÓA' : 'MỞ KHÓA';
    if (confirm(`Bạn có chắc chắn muốn ${action} tài khoản của cư dân "${user.fullName}"?`)) {
      try {
        await userApi.updateStatus(user.id, !user.isActive);
        alert(`Đã ${action} tài khoản thành công!`);
        fetchData(); 
      } catch (error) {
        alert('Lỗi thao tác. Vui lòng kiểm tra lại quyền hạn.');
      }
    }
  };

  const handleCreate = async (data: any) => {
    try {
      // Tự động gán chi nhánh hiện tại cho cư dân mới nếu Admin thuộc một chi nhánh cố định
      const payload = { 
        ...data, 
        branchId: currentUser?.branchId || data.branchId 
      };
      await userApi.create(payload);
      alert('Thêm cư dân thành công!');
      setIsModalOpen(false);
      fetchData(); 
    } catch (error) {
      alert('Lỗi khi thêm cư dân. Vui lòng kiểm tra email hoặc SĐT trùng lặp.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn đưa cư dân "${name}" vào danh sách lưu trữ?`)) {
      try {
        await userApi.delete(id);
        fetchData();
        alert('Đã chuyển cư dân vào kho lưu trữ!');
      } catch (error) {
        alert('Không thể thực hiện xóa.');
      }
    }
  };

  const handleOpenFaceRegistration = (user: User) => {
    setSelectedUser({ id: user.id, fullName: user.fullName });
    setIsFaceModalOpen(true);
  };

  const handleOpenGlobalFaceVerify = () => {
    setSelectedUser(null); 
    setIsVerifyModalOpen(true);
  };

  // --- Tìm kiếm & Lọc ---
  const filteredTenants = useMemo(() => {
    return tenants.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    );
  }, [tenants, searchTerm]);

  const getCurrentRoom = (userId: number) => {
    const activeContract = contracts.find(c => c.userId === userId && c.status === 'ACTIVE');
    if (activeContract && activeContract.room) {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black border border-blue-100 uppercase tracking-tighter w-fit">
            <HomeIcon size={12} /> {activeContract.room.roomNumber}
          </span>
          {activeContract.room.branch && (
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Building2 size={10} /> {activeContract.room.branch.name}
            </span>
          )}
        </div>
      );
    }
    return <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest italic">Chưa có hợp đồng</span>;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
             <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Quản lý Cư dân</h1>
             <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">
               Hệ thống định danh: {currentUser?.branchId ? `Chi nhánh ${currentUser.branchId}` : 'Toàn hệ thống'}
             </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleOpenGlobalFaceVerify}
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
            >
              <ShieldCheck size={18} /> Xác thực Cổng
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all active:scale-95"
            >
              <Plus size={18} /> Thêm Cư dân
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="TÌM THEO TÊN, EMAIL HOẶC SỐ ĐIỆN THOẠI..." 
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs font-bold uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-5">Hồ sơ Cư dân</th>
                <th className="px-8 py-5">Phòng & Cơ sở</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
                <th className="px-8 py-5 text-right">Quản lý AI & Bảo mật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredTenants.length > 0 ? filteredTenants.map((user) => {
                const hasFaceData = user.faceDescriptor && user.faceDescriptor.length > 0;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${user.isActive ? 'border-slate-100' : 'border-red-100 bg-red-50'}`}>
                            {user.avatar ? (
                              <img src={user.avatar} className="w-full h-full rounded-2xl object-cover" alt="" />
                            ) : (
                              <UserIcon size={20} className={user.isActive ? 'text-slate-300' : 'text-red-300'} />
                            )}
                          </div>
                          {!user.isActive && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-white shadow-sm">
                              <Lock size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-black text-sm uppercase tracking-tight ${user.isActive ? 'text-slate-800' : 'text-red-600'}`}>
                            {user.fullName}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                              <Mail size={10} /> {user.email}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                              <Phone size={10} /> {user.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">{getCurrentRoom(user.id)}</td>
                    <td className="px-8 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 ${
                        user.isActive 
                        ? 'bg-green-50 border-green-100 text-green-600' 
                        : 'bg-red-50 border-red-100 text-red-600'
                      }`}>
                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-2">
                        <button 
                           onClick={() => handleOpenFaceRegistration(user)}
                           className={`p-3 rounded-xl border-2 transition-all ${hasFaceData ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-blue-600 bg-blue-50 border-blue-100 animate-pulse shadow-lg shadow-blue-50'}`}
                           title="Đăng ký FaceID"
                        >
                           <ScanFace size={18} />
                        </button>

                        <button 
                           onClick={() => handleToggleStatus(user)}
                           className={`p-3 rounded-xl border-2 transition-all ${user.isActive ? 'text-slate-400 border-slate-100 hover:text-red-600 hover:border-red-200 hover:bg-red-50' : 'text-red-600 bg-red-50 border-red-200 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'}`}
                           title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                           {user.isActive ? <Unlock size={18} /> : <Lock size={18} />}
                        </button>

                        <button onClick={() => handleDelete(user.id, user.fullName)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                           <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-slate-400 text-xs font-black uppercase italic tracking-widest">
                    Không có cư dân nào tại chi nhánh này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <TenantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate} 
      />
      
      {isFaceModalOpen && selectedUser && (
        <FaceRegistrationModal 
          user={selectedUser} 
          onClose={() => setIsFaceModalOpen(false)} 
          onSuccess={() => { setIsFaceModalOpen(false); fetchData(); }} 
        />
      )}
      
      {isVerifyModalOpen && (
        <FaceVerifyModal 
          user={selectedUser} 
          onClose={() => setIsVerifyModalOpen(false)} 
        />
      )}
    </div>
  );
}