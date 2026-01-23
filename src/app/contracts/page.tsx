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
  Loader2, 
  Plus, 
  Search, 
  Home as HomeIcon,
  Filter,
  XCircle,
  MapPin,
  Trash2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [rooms, setRooms] = useState<Room[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsData, branchesData, roomsData] = await Promise.all([
        contractApi.getAll(),
        branchApi.getAll(),
        roomApi.getAll()
      ]);

      // LỌC DỮ LIỆU SẠCH (Soft Delete)
      const activeContracts = contractsData.filter((c: any) => !c.deletedAt);

      if (isAdmin) {
        setContracts(activeContracts);
      } else {
        setContracts(activeContracts.filter(c => c.userId === user?.id));
      }
      setBranches(branchesData);
      setRooms(roomsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // HÀM XỬ LÝ THANH LÝ HỢP ĐỒNG (SOFT DELETE)
  const handleTerminate = async (e: React.MouseEvent, id: number, tenantName: string) => {
    e.stopPropagation(); // Chặn chuyển trang chi tiết
    if (confirm(`Bạn có chắc muốn THANH LÝ hợp đồng của khách "${tenantName}"? Phòng sẽ được giải phóng về trạng thái Trống.`)) {
      try {
        await contractApi.delete(id); // Gọi API DELETE (Soft Delete)
        setContracts(prev => prev.filter(c => c.id !== id));
        alert('Thanh lý hợp đồng thành công!');
      } catch (error) {
        alert('Không thể thanh lý hợp đồng này!');
      }
    }
  };

  const getBranchName = (contract: Contract) => {
    let bId = contract.room?.branchId;
    if (!bId && contract.roomId) {
      const roomInfo = rooms.find(r => r.id === contract.roomId);
      if (roomInfo) bId = roomInfo.branchId;
    }
    const branch = branches.find(b => b.id === Number(bId));
    return branch ? branch.name : '---';
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
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quản lý Hợp đồng</h1>
            <p className="text-slate-500 text-xs mt-1 font-bold italic">
              Đồ án Quản lý Nhà trọ thông minh - Đại học Thủy Lợi
            </p>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} /> Lập hợp đồng mới
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm tên khách, số phòng..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* ... Select filter status giữ nguyên ... */}
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-6 py-4 text-center">Mã HĐ</th>
                <th className="px-6 py-4">Khách thuê</th>
                <th className="px-6 py-4">Chi nhánh / Phòng</th>
                <th className="px-6 py-4">Thời hạn</th>
                <th className="px-6 py-4">Tài chính</th>
                <th className="px-6 py-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr 
                    key={contract.id} 
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                    className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 text-center">
                       <span className="text-xs font-black text-slate-400">#{contract.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm">
                          {contract.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{contract.user?.fullName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{contract.user?.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          <MapPin size={12} className="text-blue-500" /> {getBranchName(contract)} 
                        </div>
                        <div className="flex items-center gap-1.5 font-black text-blue-600 text-xs">
                          <HomeIcon size={12} /> PHÒNG {contract.room?.roomNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-[11px] font-bold text-slate-600">
                          {contract.startDate && format(new Date(contract.startDate), 'dd/MM/yyyy')} 
                          <span className="mx-2 text-slate-300">→</span>
                          {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : 'Vô thời hạn'}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-black text-slate-800">{Number(contract.deposit).toLocaleString()} đ</p>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Tiền cọc</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                         {isAdmin && (
                            <button 
                              onClick={(e) => handleTerminate(e, contract.id, contract.user?.fullName || '')}
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Thanh lý hợp đồng"
                            >
                               <Trash2 size={18} />
                            </button>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-bold uppercase text-xs">Không có dữ liệu hợp đồng</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <ContractModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={async (data) => { await contractApi.create(data); fetchData(); }} 
      />
    </div>
  );
}