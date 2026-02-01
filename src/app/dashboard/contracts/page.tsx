'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ContractModal from '@/components/contracts/ContractModal';
import { Contract, contractApi } from '@/services/contract.api';
import { branchApi, Branch } from '@/services/branch.api';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { 
  Loader2, Plus, Search, Trash2, Building2, Calendar, RefreshCcw 
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminContractsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(
    user?.branchId ? Number(user.branchId) : undefined
  );

  // 1. Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const bId = selectedBranch ? Number(selectedBranch) : undefined;
      
      const requests: Promise<any>[] = [contractApi.getAll(undefined, bId)];
      
      if (branches.length === 0) {
        requests.push(branchApi.getAll());
      }

      const [contractsData, branchesData] = await Promise.all(requests);

      const safeContracts = Array.isArray(contractsData) 
        ? contractsData 
        : (contractsData?.data || []);

      setContracts(safeContracts);
      
      if (branchesData) {
        setBranches(branchesData.filter((b: any) => !b.deletedAt));
      }

    } catch (error) {
      console.error("❌ Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, branches.length]); 

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  // 2. Filter logic
  const filteredContracts = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];
    
    return contracts.filter(c => {
      const contractBranchId = c.branchId ?? c.room?.branchId;
      const matchBranch = !selectedBranch || Number(contractBranchId) === Number(selectedBranch);
      
      const term = searchTerm.toLowerCase();
      const userName = (c.user?.fullName || '').toLowerCase();
      const roomNum = (c.room?.roomNumber || '').toLowerCase();
      const contractId = String(c.id);
      
      const matchSearch = userName.includes(term) || roomNum.includes(term) || contractId.includes(term);

      const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
      
      return matchBranch && matchSearch && matchStatus;
    });
  }, [contracts, selectedBranch, searchTerm, filterStatus]);

  // 3. Xử lý xóa mềm
  const handleSoftDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('🗑️ CHUYỂN VÀO THÙNG RÁC?\n\nHợp đồng sẽ biến mất khỏi danh sách này.')) return;
    try {
      await contractApi.delete(id); 
      await fetchData(); 
      alert('✅ Đã chuyển vào thùng rác!');
    } catch (error) {
      alert('❌ Lỗi khi xóa!');
    }
  };

  const getBranchName = (c: Contract) => {
    if (c.branch?.name) return c.branch.name;
    const bId = c.branchId || c.room?.branchId;
    return branches.find(b => b.id === Number(bId))?.name || '---';
  };

  return (
    <div className="p-8 space-y-8 selection:bg-blue-100">
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'Quản trị hệ thống', href: '/dashboard/branches' },
            { label: 'Quản lý Hợp đồng' }
          ]} 
        />
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">
            Hồ sơ Hợp đồng
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Quản lý tính pháp lý và thời hạn cư dân
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button onClick={() => fetchData()} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-slate-500 active:scale-95" title="Tải lại dữ liệu">
             <RefreshCcw size={18} />
          </button>

          {isAdmin && !user?.branchId && (
            <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm group focus-within:ring-2 ring-blue-500/20 transition-all">
              <Building2 size={16} className="text-slate-400 group-focus-within:text-blue-600" />
              <select 
                className="text-[10px] font-black uppercase outline-none bg-transparent cursor-pointer min-w-[150px]"
                value={selectedBranch || ''}
                onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">-- Tất cả cơ sở --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Lập hợp đồng mới
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Tìm tên cư dân, số phòng hoặc ID..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-auto bg-slate-50 px-8 py-4 rounded-2xl text-[10px] font-black uppercase outline-none cursor-pointer border border-transparent hover:border-slate-200 transition-all"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">🔥 Đang hiệu lực</option>
          <option value="PENDING">⏳ Chờ duyệt</option>
          <option value="TERMINATED">🧊 Đã thanh lý</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b">
              <tr>
                <th className="px-10 py-6">Trạng thái</th>
                <th className="px-10 py-6">Chủ thể cư dân</th>
                <th className="px-10 py-6">Vị trí phòng</th>
                <th className="px-10 py-6">Thời hạn</th>
                <th className="px-10 py-6 text-right pr-14">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-24"><Loader2 className="animate-spin mx-auto text-blue-600" size={32} /></td></tr>
              ) : filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => {
                  let statusColor = 'bg-slate-100 text-slate-400 border-slate-200';
                  
                  // 🔥 FIX LỖI TẠI ĐÂY: Khai báo tường minh kiểu string
                  let statusLabel: string = contract.status; 
                  const status = contract.status as string;

                  if (status === 'ACTIVE') {
                    statusColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    statusLabel = 'Đang hiệu lực';
                  } else if (status === 'PENDING') {
                    statusColor = 'bg-yellow-50 text-yellow-600 border-yellow-100';
                    statusLabel = 'Chờ duyệt';
                  } else if (status === 'TERMINATED' || status === 'EXPIRED') {
                    statusColor = 'bg-red-50 text-red-500 border-red-100';
                    statusLabel = 'Đã kết thúc';
                  }

                  return (
                    <tr 
                      key={contract.id} 
                      onClick={() => router.push(`/dashboard/contracts/${contract.id}`)} 
                      className="hover:bg-blue-50/50 cursor-pointer group transition-colors"
                    >
                      <td className="px-10 py-7">
                        <span className={`px-4 py-1.5 rounded-full text-[8px] font-black border tracking-widest uppercase shadow-sm ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg group-hover:bg-blue-600 transition-colors">
                            {contract.user?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase italic leading-none mb-1">
                              {contract.user?.fullName || 'Chưa định danh'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-wider">{contract.user?.phone || '---'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider mb-1">
                          {getBranchName(contract)}
                        </span>
                        <span className="font-black text-blue-600 text-sm italic">
                          {contract.room ? `P.${contract.room.roomNumber}` : 'Đã xóa phòng'}
                        </span>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100">
                            <Calendar size={12} className="text-blue-500" />
                            {contract.startDate ? format(new Date(contract.startDate), 'dd/MM/yyyy') : '--'} 
                            <span className="text-slate-300">➜</span>
                            {contract.endDate ? format(new Date(contract.endDate), 'dd/MM/yyyy') : '∞'}
                        </div>
                      </td>
                      <td className="px-10 py-7 text-right pr-14" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                            <button 
                              onClick={(e) => handleSoftDelete(e, contract.id)} 
                              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Chuyển vào thùng rác"
                            >
                              <Trash2 size={18} />
                            </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center flex flex-col items-center gap-4">
                    <div className="p-6 bg-slate-50 rounded-full text-slate-100"><Building2 size={64} /></div>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                        {searchTerm ? 'Không tìm thấy kết quả' : 'Danh sách hợp đồng trống'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ContractModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={async (data) => { 
          try {
             const finalBranchId = user?.branchId || data.branchId || selectedBranch;
             
             if (!finalBranchId) {
                alert("⚠️ Vui lòng chọn Chi nhánh trước khi tạo hợp đồng!");
                return;
             }

             const payload = { ...data, branchId: Number(finalBranchId) };
             await contractApi.create(payload); 
             
             alert('✅ Tạo hợp đồng mới thành công!');
             setIsModalOpen(false);
             
             if (selectedBranch && Number(selectedBranch) !== Number(finalBranchId)) {
                if(confirm("Hợp đồng vừa tạo nằm ở chi nhánh khác. Bạn có muốn chuyển bộ lọc để xem ngay không?")) {
                    setSelectedBranch(Number(finalBranchId));
                } else {
                    fetchData(); 
                }
             } else {
                fetchData(); 
             }

          } catch (e) {
             console.error(e);
             alert("❌ Lỗi: Không thể tạo hợp đồng (Có thể phòng này đã có người thuê).");
          }
        }} 
      />
    </div>
  );
}