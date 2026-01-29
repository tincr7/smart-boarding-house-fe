'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api';
import { roomApi, Room } from '@/services/room.api';
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, Plus, Search, Home as HomeIcon, 
  MapPin, Trash2, Building2, Calendar
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth(); // Lấy thông tin Admin đang đăng nhập
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // State lọc đa chi nhánh: Mặc định theo chi nhánh của Admin
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Admin cơ sở sẽ luôn lọc theo branchId của họ
      const currentBranchFilter = user?.branchId || selectedBranch;

      const [contractsData, branchesData, roomsData] = await Promise.all([
        contractApi.getAll(undefined, currentBranchFilter), // Truyền branchId vào API
        branchApi.getAll(),
        roomApi.getAll(currentBranchFilter)
      ]);

      const activeContracts = contractsData.filter((c: any) => !c.deletedAt);

      if (isAdmin) {
        setContracts(activeContracts);
      } else {
        // Cư dân chỉ thấy hợp đồng của chính mình
        setContracts(activeContracts.filter(c => c.userId === user?.id));
      }
      setBranches(branchesData);
      setRooms(roomsData);
    } catch (error) {
      console.error("Lỗi tải dữ liệu hợp đồng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchData(); 
  }, [selectedBranch, user]);

  const handleTerminate = async (e: React.MouseEvent, id: number, tenantName: string) => {
    e.stopPropagation();
    if (confirm(`Bạn có chắc muốn THANH LÝ hợp đồng của "${tenantName}"?`)) {
      try {
        await contractApi.delete(id);
        setContracts(prev => prev.filter(c => c.id !== id));
        alert('Thanh lý hợp đồng thành công!');
      } catch (error) {
        alert('Không thể thanh lý hợp đồng này!');
      }
    }
  };

  const getBranchName = (contract: Contract) => {
    // Ưu tiên lấy từ dữ liệu lồng nhau (nested) đã sửa ở interface
    if (contract.room?.branch?.name) return contract.room.branch.name;
    
    const bId = contract.room?.branchId || rooms.find(r => r.id === contract.roomId)?.branchId;
    const branch = branches.find(b => b.id === Number(bId));
    return branch ? branch.name : 'Chưa xác định';
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const term = searchTerm.toLowerCase();
      const matchName = contract.user?.fullName?.toLowerCase().includes(term);
      const matchRoom = contract.room?.roomNumber?.toLowerCase().includes(term);
      const matchSearch = !searchTerm || matchName || matchRoom;
      const matchStatus = filterStatus === 'ALL' || contract.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, filterStatus]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Hợp đồng Cư dân</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Building2 size={14} className="text-blue-500" />
              SmartHouse AI - {user?.branchId ? `Cơ sở ${getBranchName({room: {branchId: user.branchId}} as any)}` : 'Quản lý toàn bộ hệ thống'}
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Bộ lọc chi nhánh cho Super Admin */}
            {isAdmin && !user?.branchId && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                <Building2 size={16} className="text-slate-400" />
                <select 
                  className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent cursor-pointer"
                  value={selectedBranch || ''}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tất cả cơ sở</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}

            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Lập hợp đồng
              </button>
            )}
          </div>
        </div>

        {/* Thanh tìm kiếm & Lọc trạng thái */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="TÌM TÊN KHÁCH HOẶC MÃ PHÒNG..." 
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-[10px] font-black uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="bg-slate-50 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-transparent focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">TẤT CẢ TRẠNG THÁI</option>
            <option value="ACTIVE">ĐANG HIỆU LỰC</option>
            <option value="TERMINATED">ĐÃ THANH LÝ</option>
            <option value="EXPIRED">HẾT HẠN</option>
          </select>
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-8 py-5">Đối tác cư dân</th>
                <th className="px-8 py-5">Vị trí phòng</th>
                <th className="px-8 py-5">Thời hạn hợp đồng</th>
                <th className="px-8 py-5">Tài chính</th>
                <th className="px-8 py-5 text-right pr-12">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr 
                    key={contract.id} 
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-black text-sm">
                          {contract.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{contract.user?.fullName}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{contract.user?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-500" /> {getBranchName(contract)} 
                        </span>
                        <span className="font-black text-blue-600 text-xs flex items-center gap-1.5">
                          <HomeIcon size={12} /> PHÒNG {contract.room?.roomNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-tighter border border-slate-100">
                          <Calendar size={12} className="text-slate-400" />
                          {contract.startDate && format(new Date(contract.startDate), 'dd/MM/yyyy')} 
                          <span className="mx-1 text-slate-300">→</span>
                          {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'Vô thời hạn'}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-black text-slate-800 tracking-tighter">{Number(contract.deposit).toLocaleString()} <span className="text-[10px] text-slate-400 ml-0.5 uppercase">đ</span></p>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tiền cọc bảo đảm</span>
                    </td>
                    <td className="px-8 py-6 text-right pr-12" onClick={(e) => e.stopPropagation()}>
                       {isAdmin && (
                          <button 
                            onClick={(e) => handleTerminate(e, contract.id, contract.user?.fullName || '')}
                            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm"
                            title="Thanh lý hợp đồng"
                          >
                             <Trash2 size={18} />
                          </button>
                       )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="text-center py-24 text-slate-400 font-black uppercase text-[10px] italic tracking-widest">Không có dữ liệu hợp đồng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <ContractModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={async (data) => { 
          // Tự động gán branchId khi tạo hợp đồng mới
          const payload = { ...data, branchId: user?.branchId || data.branchId };
          await contractApi.create(payload); 
          fetchData(); 
        }} 
      />
    </div>
  );
}