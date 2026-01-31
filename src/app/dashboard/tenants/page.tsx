'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import TenantModal from '@/components/tenants/TenantModal';
import { userApi, User } from '@/services/user.api';
import FaceRegistrationModal from '@/components/tenants/FaceRegistrationModal';
import FaceVerifyModal from '@/components/tenants/FaceVerifyModal'; 
import { branchApi, Branch } from '@/services/branch.api'; 
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Search, Plus, Trash2, 
  User as UserIcon, ScanFace, ShieldCheck,
  Lock, Unlock, Building2, Mail, Phone, Camera, ChevronDown
} from 'lucide-react';

export default function AdminTenantsPage() {
  const { user: currentUser } = useAuth();
  const [tenants, setTenants] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | string>(''); 
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(''); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: number, fullName: string} | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const currentBranchFilter = currentUser?.branchId || (selectedBranchId ? Number(selectedBranchId) : undefined);

      const [usersData, branchesData] = await Promise.all([
        userApi.getAll(currentBranchFilter),
        branchApi.getAll()
      ]);

      setTenants(usersData.filter((u: any) => u.role === 'TENANT' && !u.deletedAt));
      setBranches(branchesData);

      if (currentBranchFilter) {
        const currentBranch = branchesData.find(b => Number(b.id) === Number(currentBranchFilter));
        const dbDeviceId = currentBranch?.devices?.[0]?.id;
        setSelectedDeviceId(dbDeviceId || (Number(currentBranchFilter) === 1 ? 'WEB_CAM_GIANG' : `CAM_${currentBranchFilter}`));
      } else {
        setSelectedDeviceId('');
      }

    } catch (error) {
      console.error("Lỗi đồng bộ SmartHouse Security:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedBranchId]);

  useEffect(() => { 
    if (currentUser) fetchData(); 
  }, [currentUser, fetchData]);

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? 'KHÓA' : 'MỞ KHÓA';
    if (confirm(`Xác nhận ${action} định danh cư dân "${user.fullName}"?`)) {
      try {
        await userApi.updateStatus(user.id, !user.isActive);
        fetchData(); 
      } catch (error) {
        alert('Lỗi thao tác bảo mật hệ thống.');
      }
    }
  };

  const handleCreate = async (data: any) => {
    try {
      const payload = { ...data, branchId: currentUser?.branchId || selectedBranchId || data.branchId };
      await userApi.create(payload);
      setIsModalOpen(false);
      fetchData(); 
    } catch (error) {
      alert('Email hoặc SĐT đã tồn tại trên hệ thống SmartHouse.');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Chuyển cư dân "${name}" vào danh sách lưu trữ an ninh?`)) {
      try {
        await userApi.delete(id);
        fetchData();
      } catch (error) {
        alert('Cư dân đang có hợp đồng hiệu lực, không thể xóa.');
      }
    }
  };

  const handleOpenGlobalFaceVerify = () => {
    if (!selectedDeviceId) {
       alert("CẢNH BÁO: CHƯA XÁC ĐỊNH ĐƯỢC CAMERA ĐỊNH DANH CỦA CƠ SỞ!");
       return;
    }
    setSelectedUser(null); 
    setIsVerifyModalOpen(true);
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter(user => 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)
    );
  }, [tenants, searchTerm]);

  return (
    <> {/* GIẢI QUYẾT LỖI JSX PARENT ELEMENT */}
      <div className="p-8 space-y-8 selection:bg-blue-100">
        
        {/* TÍCH HỢP BREADCRUMBS */}
        <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Breadcrumbs 
            items={[
              { label: 'Quản trị hệ thống', href: '/dashboard/branches' },
              { label: 'Nhân khẩu nội khu' }
            ]} 
          />
        </div>

        {/* --- SMART AI HEADER --- */}
        <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-8 border-b border-slate-100 pb-10">
          <div>
             <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                <ShieldCheck size={18} className="fill-blue-50" /> Identity & Access Management
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic leading-none mb-8">Hồ sơ Cư dân</h1>
             
             <div className="flex flex-wrap items-center gap-4">
                {/* Bộ chọn chi nhánh */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
                    <Building2 size={16} />
                  </div>
                  <select 
                    value={selectedBranchId || currentUser?.branchId || ''}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    disabled={!!currentUser?.branchId} 
                    className="pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 appearance-none text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm transition-all cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">LỌC THEO CƠ SỞ VẬN HÀNH</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>

                {/* Gate ID Indicator */}
                <div className="flex items-center gap-4 bg-slate-900 px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 group hover:border-blue-500/50 transition-colors">
                  <div className="relative">
                    <Camera size={18} className="text-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">
                    Security Gate: <span className="text-emerald-400">{selectedDeviceId || 'Scanning...'}</span>
                  </span>
                </div>
             </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleOpenGlobalFaceVerify}
              className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 shadow-xl shadow-emerald-200/50 transition-all active:scale-95 group"
            >
              <ScanFace size={22} className="group-hover:scale-110 transition-transform" /> Xác thực Cổng
            </button>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl shadow-slate-200/50 transition-all active:scale-95 group"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform" /> Thêm Cư dân
            </button>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 group">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Tìm kiếm cư dân theo tên, email hoặc số điện thoại..." 
              className="w-full pl-16 pr-6 py-5 bg-slate-50 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-[11px] font-black uppercase tracking-[0.1em]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <tr>
                  <th className="px-10 py-7">Hồ sơ Cư dân AI</th>
                  <th className="px-10 py-7 text-center">Trạng thái định danh</th>
                  <th className="px-10 py-7 text-right pr-14">Thao tác an ninh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={3} className="text-center py-40"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></td></tr>
                ) : filteredTenants.length > 0 ? filteredTenants.map((user) => {
                  const hasFaceData = user.faceDescriptor && user.faceDescriptor.length > 0;
                  return (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-all group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                             <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all shadow-md ${user.isActive ? 'bg-white border-slate-100 group-hover:border-blue-400' : 'bg-red-50 border-red-200'}`}>
                               {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-[1.5rem]" /> : <UserIcon size={24} className="text-slate-300" />}
                             </div>
                             {!user.isActive && <div className="absolute -top-1 -right-1 bg-red-600 p-1.5 rounded-full border-2 border-white shadow-lg"><Lock size={10} className="text-white" /></div>}
                          </div>
                          <div>
                            <p className={`font-black text-base uppercase italic tracking-tighter leading-none mb-2 ${user.isActive ? 'text-slate-800' : 'text-red-600'}`}>{user.fullName}</p>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                               <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5"><Mail size={12} className="text-blue-500" /> {user.email}</span>
                               <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5"><Phone size={12} className="text-blue-500" /> {user.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                        <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${user.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                          {user.isActive ? 'Access Granted' : 'Access Revoked'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right pr-14">
                        <div className="flex justify-end gap-3">
                          <button 
                             onClick={() => { setSelectedUser(user); setIsFaceModalOpen(true); }}
                             className={`p-4 rounded-2xl transition-all shadow-lg border-2 ${hasFaceData ? 'bg-emerald-500 border-emerald-400 text-white hover:bg-slate-900 hover:border-slate-800' : 'bg-white border-blue-200 text-blue-600 animate-pulse hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                             title="Cập nhật FaceID"
                          >
                             <ScanFace size={22} />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`p-4 rounded-2xl border-2 transition-all shadow-sm ${user.isActive ? 'bg-white border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200' : 'bg-red-50 border-red-200 text-red-600'}`}
                            title={user.isActive ? 'Khóa quyền truy cập' : 'Cấp lại quyền'}
                          >
                            {user.isActive ? <Unlock size={22} /> : <Lock size={22} />}
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id, user.fullName)} 
                            className="p-4 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                            title="Lưu trữ hồ sơ"
                          >
                            <Trash2 size={22} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan={3} className="text-center py-40 flex flex-col items-center gap-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-100"><UserIcon size={64} /></div>
                    <p className="font-black text-slate-300 uppercase text-xs tracking-[0.4em] italic">Chưa có cư dân đăng ký</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODALS --- */}
        <TenantModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
        
        {isFaceModalOpen && selectedUser && (
          <FaceRegistrationModal 
            user={selectedUser} 
            onClose={() => setIsFaceModalOpen(false)} 
            onSuccess={() => fetchData()} 
          />
        )}
        
        {isVerifyModalOpen && (
          <FaceVerifyModal 
            user={null} 
            deviceId={selectedDeviceId} 
            onClose={() => setIsVerifyModalOpen(false)} 
          />
        )}
      </div>
    </>
  );
}