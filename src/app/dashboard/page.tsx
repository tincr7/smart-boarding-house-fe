'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { statsApi, DashboardData, Branch } from '@/services/stats.api';
import { useAuth } from '@/context/AuthContext'; // MỚI: Dùng AuthContext để lấy thông tin chi nhánh
import { 
  Loader2, Home, Users, Wallet, DoorOpen, 
  Activity, UserCheck, Building2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#3b82f6', '#e2e8f0'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth(); // Lấy user từ AuthContext
  const [data, setData] = useState<DashboardData | null>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  // MẶC ĐỊNH: Nếu là Admin chi nhánh, lấy branchId của họ. Nếu là Super Admin, để undefined.
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Admin cơ sở chỉ được phép xem dữ liệu của chính mình
      const currentBranchFilter = user?.branchId || selectedBranch;

      const [statsResult, logsResult, branchesResult] = await Promise.all([
        statsApi.getDashboardStats(currentBranchFilter),
        statsApi.getRecentAccessLogs(10, currentBranchFilter),
        statsApi.getAllBranches() 
      ]);
      
      setData(statsResult);
      setAccessLogs(logsResult);
      setBranches(branchesResult);
    } catch (error) {
      console.error('Lỗi tải dữ liệu Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedBranch, user]); // Chạy lại khi user đăng nhập hoặc đổi chi nhánh

  const revenueData = data?.finance.chartData || [];
  const occupancyData = [
    { name: 'Đã thuê', value: data?.overview.rooms.rented || 0 },
    { name: 'Phòng trống', value: data?.overview.rooms.available || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Bảng Điều Khiển</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 italic">
              Vận hành: {user?.branchId ? `Cơ sở ${branches.find(b => b.id === user.branchId)?.name}` : 'Toàn hệ thống SmartHouse'}
            </p>
          </div>
          
          <div className="flex gap-4">
            {/* CHỈ HIỂN THỊ BỘ LỌC NẾU LÀ SUPER ADMIN (Không có branchId trong Token) */}
            {isAdmin && !user?.branchId && (
              <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all">
                <Building2 size={16} className="text-blue-500" />
                <select 
                  className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent cursor-pointer"
                  value={selectedBranch || ''}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tất cả các cơ sở</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-lg text-xs font-black uppercase tracking-widest text-white">
              Tháng {data?.finance.month}/{data?.finance.year}
            </div>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Tổng số phòng" value={data?.overview.rooms.total} icon={Home} color="bg-blue-600" />
          <StatCard title="Phòng hiện trống" value={data?.overview.rooms.available} icon={DoorOpen} color="bg-emerald-500" />
          <StatCard title="Cư dân nội khu" value={data?.overview.tenants} icon={Users} color="bg-violet-600" />
          <StatCard title="Doanh thu dự tính" value={`${data?.finance.revenue.toLocaleString('vi-VN')} đ`} icon={Wallet} color="bg-orange-500" />
        </div>

        {/* Các biểu đồ (giữ nguyên cấu trúc Recharts của bạn) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Biểu đồ Doanh thu */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
             {/* ... (Phần Recharts BarChart giữ nguyên) */}
          </div>

          {/* Biểu đồ Tỷ lệ lấp đầy */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center">
             {/* ... (Phần Recharts PieChart giữ nguyên) */}
          </div>
        </div>

        {/* NHẬT KÝ RA VÀO THỜI GIAN THỰC */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          {/* ... (Phần bảng nhật ký giữ nguyên) */}
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
      <div className={`${color} p-4 rounded-2xl text-white shadow-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{title}</p>
        <h4 className="text-xl font-black text-slate-900 mt-1 tracking-tighter">{value}</h4>
      </div>
    </div>
  );
}