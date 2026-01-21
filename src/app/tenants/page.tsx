'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import TenantModal from '@/components/tenants/TenantModal'; // Đảm bảo bạn đã có component này
import { userApi, User } from '@/services/user.api';
import { contractApi, Contract } from '@/services/contract.api'; // Import API hợp đồng để tra cứu phòng
import { Loader2, Search, Plus, Trash2, Home as HomeIcon, Phone, Mail, User as UserIcon } from 'lucide-react';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]); // State lưu hợp đồng để tra cứu
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Tải dữ liệu: Gọi song song User và Contract
  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, contractsData] = await Promise.all([
        userApi.getAll(),
        contractApi.getAll()
      ]);

      // Lọc: Chỉ lấy những user có role là TENANT
      const tenantList = usersData.filter((u: any) => u.role === 'TENANT'); 
      
      setTenants(tenantList);
      setContracts(contractsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Xử lý thêm mới
  const handleCreate = async (data: any) => {
    try {
      await userApi.create(data);
      alert('Thêm cư dân thành công!');
      fetchData(); 
    } catch (error) {
      alert('Lỗi khi thêm cư dân.');
    }
  };

  // 3. Xử lý xóa
  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa cư dân "${name}"?\nLưu ý: Chỉ nên xóa khi họ đã thanh lý hết hợp đồng và thanh toán xong hóa đơn.`)) {
      try {
        await userApi.delete(id);
        alert('Đã xóa thành công!');
        fetchData();
      } catch (error) {
        alert('Không thể xóa cư dân này (Có thể do đang có Hợp đồng hoặc Hóa đơn liên quan).');
      }
    }
  };

  // 4. Logic tìm kiếm
  const filteredTenants = useMemo(() => {
    return tenants.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tenants, searchTerm]);

  // 5. Helper function: Tìm phòng đang ở (Dựa vào danh sách contracts đã tải)
  const getCurrentRoom = (userId: number) => {
    // Tìm hợp đồng ACTIVE của user này trong danh sách contracts
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
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
             <h1 className="text-2xl font-bold text-slate-900">Quản lý Cư dân</h1>
             <p className="text-slate-500 text-sm mt-1">Danh sách tất cả người thuê trọ trong hệ thống</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> Thêm Cư dân
          </button>
        </div>

        {/* Toolbar (Search) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên, số điện thoại, email..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* List Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Cư dân</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4">Phòng đang ở</th>
                <th className="px-6 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden border border-slate-200">
                          {user.avatar ? (
                             <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                             <UserIcon size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.fullName}</p>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">ID: {user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                         <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} className="text-blue-500" /> {user.phone || '---'}
                         </div>
                         <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} className="text-orange-500" /> {user.email}
                         </div>
                      </div>
                    </td>
                    
                    {/* Cột Phòng đang ở */}
                    <td className="px-6 py-4">
                      {getCurrentRoom(user.id)}
                    </td>
                    
                    {/* Cột Hành động (Xóa) */}
                    <td className="px-6 py-4 text-center">
                      <button 
                         onClick={() => handleDelete(user.id, user.fullName)}
                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                         title="Xóa cư dân"
                      >
                         <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                 <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">
                       Không tìm thấy cư dân nào phù hợp.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal thêm mới */}
      <TenantModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate} 
      />
    </div>
  );
}