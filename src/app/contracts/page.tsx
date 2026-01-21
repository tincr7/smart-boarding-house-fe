'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api';
import { roomApi, Room } from '@/services/room.api'; // 1. IMPORT THÊM ROOM API
import { useAuth } from '@/context/AuthContext';
import { 
  Loader2, 
  Plus, 
  Search, 
  Home as HomeIcon,
  Filter,
  XCircle,
  MapPin 
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [rooms, setRooms] = useState<Room[]>([]); // 2. THÊM STATE ROOMS
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    try {
      setLoading(true);
      // 3. GỌI 3 API CÙNG LÚC: Hợp đồng + Chi nhánh + Phòng
      const [contractsData, branchesData, roomsData] = await Promise.all([
        contractApi.getAll(),
        branchApi.getAll(),
        roomApi.getAll()
      ]);
      // LỌC DỮ LIỆU
    if (isAdmin) {
      setContracts(contractsData);
    } else {
      // Nếu là Tenant, chỉ lấy hợp đồng của chính mình
      const myContracts = contractsData.filter(c => c.userId === user?.id);
      setContracts(myContracts);
    }
      setContracts(contractsData);
      setBranches(branchesData);
      setRooms(roomsData); // Lưu danh sách phòng để tra cứu
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 4. HÀM TÌM TÊN CHI NHÁNH (LOGIC TRA CỨU CHÉO)
  const getBranchName = (contract: Contract) => {
    // Bước 1: Thử lấy branchId trực tiếp từ contract (nếu có)
    let bId = contract.room?.branchId;

    // Bước 2: Nếu không có, dùng roomId để tìm lại trong danh sách Rooms đầy đủ
    if (!bId && contract.roomId) {
      const roomInfo = rooms.find(r => r.id === contract.roomId);
      if (roomInfo) bId = roomInfo.branchId;
    }

    // Bước 3: Nếu vẫn không có ID thì chịu
    if (!bId) return '---';

    // Bước 4: Có ID rồi thì tìm tên Chi nhánh
    const branch = branches.find(b => b.id === Number(bId));
    return branch ? branch.name : '---';
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const term = searchTerm.toLowerCase();
      const matchName = contract.user?.fullName?.toLowerCase().includes(term);
      const matchPhone = contract.user?.phone?.includes(term);
      const matchRoom = contract.room?.roomNumber?.toLowerCase().includes(term);
      const matchSearch = !searchTerm || matchName || matchPhone || matchRoom;
      const matchStatus = filterStatus === 'ALL' || contract.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [contracts, searchTerm, filterStatus]);

  const handleCreate = async (data: any) => {
    await contractApi.create(data);
    fetchData(); 
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Hợp đồng</h1>
            <p className="text-slate-500 text-sm mt-1">
              Tổng số: <span className="font-bold text-blue-600">{filteredContracts.length}</span> hợp đồng
            </p>
          </div>
          {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
          >
            <Plus size={20} /> Tạo Hợp đồng mới
          </button>
          )}
        </div>

        {/* Filter Bar giữ nguyên */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm theo tên khách, SĐT, số phòng..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative min-w-[180px]">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <select 
              className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hiệu lực</option>
              <option value="TERMINATED">Đã kết thúc</option>
            </select>
          </div>
          {(searchTerm || filterStatus !== 'ALL') && (
            <button onClick={clearFilters} className="text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
              <XCircle size={16} /> Xóa lọc
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Mã HĐ</th>
                <th className="px-6 py-4">Khách thuê</th>
                <th className="px-6 py-4">Chi nhánh</th>
                <th className="px-6 py-4">Phòng</th>
                <th className="px-6 py-4">Thời hạn</th>
                <th className="px-6 py-4">Đặt cọc</th>
                <th className="px-6 py-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr 
                    key={contract.id} 
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 group-hover:text-blue-600 transition-colors">#{contract.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                          {contract.user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{contract.user?.fullName}</p>
                          <p className="text-xs text-slate-500">{contract.user?.phone}</p>
                        </div>
                      </div>
                    </td>

                    {/* 5. GỌI HÀM LẤY TÊN CHI NHÁNH MỚI */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 text-sm">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="font-medium">
                          {getBranchName(contract)} 
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium border border-slate-200">
                        <HomeIcon size={14} /> {contract.room?.roomNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {contract.startDate && format(new Date(contract.startDate), 'dd/MM/yyyy')} 
                      <br/> 
                      <span className="text-slate-400 text-xs">đến</span> {contract.endDate && format(new Date(contract.endDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {Number(contract.deposit).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        contract.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {contract.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã kết thúc'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search size={40} className="text-slate-200 mb-2" />
                      <p>Không tìm thấy hợp đồng nào phù hợp.</p>
                      <button onClick={clearFilters} className="text-blue-600 hover:underline mt-1 text-sm">Xóa bộ lọc</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <ContractModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate} 
      />
    </div>
  );
}