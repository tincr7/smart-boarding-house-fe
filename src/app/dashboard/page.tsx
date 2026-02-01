'use client';

import { useEffect, useState, useMemo } from 'react';
import { statsApi, DashboardData, Branch, AccessLog } from '@/services/stats.api';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { 
  Loader2, Home, Users, Wallet, DoorOpen, 
  Activity, Building2, Calendar, TrendingUp 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format } from 'date-fns'; 

const COLORS = ['#3b82f6', '#e2e8f0'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  
  // States quản lý dữ liệu truy vấn từ CSDL
  const [data, setData] = useState<DashboardData | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  // ==========================================
  // 1. HÀM TẢI DỮ LIỆU TỪ CSDL (THAY THẾ SOCKET)
  // ==========================================
  const fetchAllDashboardData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const currentBranchFilter = user?.branchId || selectedBranch;
      
      // Truy vấn đồng thời: Thống kê, Nhật ký mới nhất, Danh sách chi nhánh
      const [statsResult, logsResult, branchesResult] = await Promise.all([
        statsApi.getDashboardStats(currentBranchFilter),
        statsApi.getRecentAccessLogs(10, currentBranchFilter),
        statsApi.getAllBranches() 
      ]);
      
      setData(statsResult);
      setAccessLogs(logsResult); // Luôn lấy 10 log mới nhất từ DB
      if (branches.length === 0) setBranches(branchesResult);
    } catch (error) {
      console.error('Lỗi truy vấn CSDL Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 2. CƠ CHẾ AUTO-REFRESH (POLLING)
  // ==========================================
  useEffect(() => {
    if (user) {
      // Tải dữ liệu lần đầu
      fetchAllDashboardData(true);

      // Thiết lập truy vấn định kỳ mỗi 20 giây để cập nhật "Real-time"
      const interval = setInterval(() => {
        fetchAllDashboardData(false); // Update ngầm, không hiện Loading xoay xoay
      }, 20000); 

      return () => clearInterval(interval);
    }
  }, [user, selectedBranch]);

  // Logic biểu đồ
  const occupancyData = useMemo(() => [
    { name: 'Đã thuê', value: data?.overview.rooms.rented || 0 },
    { name: 'Phòng trống', value: data?.overview.rooms.available || 0 },
  ], [data]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang truy vấn dữ liệu từ hệ thống...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Breadcrumbs */}
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs items={[{ label: 'Hệ thống SmartHouse', href: '/dashboard/branches' }, { label: 'Bảng điều khiển trung tâm' }]} />
      </div>

      {/* Header với bộ lọc chi nhánh */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 mb-4 w-fit">
            <Activity size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">Database Sync Active</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-3">Dashboard</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Building2 size={14} className="text-blue-500" />
            Cơ sở: {user?.branchId ? branches.find(b => b.id === user.branchId)?.name : 'Quản trị hệ thống'}
          </p>
        </div>
        
        <div className="flex gap-4">
          {isAdmin && !user?.branchId && (
            <select 
              className="bg-white border border-slate-200 px-4 py-3 rounded-2xl text-[10px] font-black uppercase outline-none shadow-sm"
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Tất cả chi nhánh</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <div className="bg-slate-900 px-6 py-4 rounded-2xl text-white text-[10px] font-black uppercase flex items-center gap-2 shadow-xl">
            <Calendar size={14} className="text-blue-400" /> Tháng {data?.finance.month}/{data?.finance.year}
          </div>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng số phòng" value={data?.overview.rooms.total} icon={Home} color="bg-blue-600" />
        <StatCard title="Đang sẵn sàng" value={data?.overview.rooms.available} icon={DoorOpen} color="bg-emerald-500" />
        <StatCard title="Cư dân nội khu" value={data?.overview.tenants} icon={Users} color="bg-violet-600" />
        <StatCard title="Doanh thu dự kiến" value={`${data?.finance.revenue.toLocaleString('vi-VN')} đ`} icon={Wallet} color="bg-slate-900" />
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 h-[450px]">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-10">Tăng trưởng doanh thu</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.finance.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 900}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 9, fontWeight: 900}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius: '20px', border: 'none', fontWeight: 900, fontSize: '10px'}} />
              <Bar dataKey="total" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col items-center">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-10 self-start">Tỷ lệ lấp đầy</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={occupancyData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {occupancyData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '9px', fontWeight: 900, textTransform: 'uppercase'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Nhật ký ra vào (Sử dụng dữ liệu từ CSDL) */}
      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] italic flex items-center gap-3">
            <Activity size={18} className="text-blue-600" /> Nhật ký an ninh (CSDL)
          </h3>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Tự động cập nhật mỗi 20s
          </div>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b">
            <tr>
              <th className="px-10 py-5">Cư dân</th>
              <th className="px-10 py-5">Khu vực</th>
              <th className="px-10 py-5">Thời gian</th>
              <th className="px-10 py-5 text-right pr-10">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {accessLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-10 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {log.user?.fullName?.charAt(0) || 'K'}
                    </div>
                    <span className="font-black text-slate-800 text-xs uppercase">{log.user?.fullName || 'Khách'}</span>
                  </div>
                </td>
                <td className="px-10 py-6">
                  <span className="text-[10px] font-black px-3 py-1 bg-slate-100 rounded-lg text-slate-500">
                    {log.room?.roomNumber ? `PHÒNG ${log.room.roomNumber}` : 'SẢNH CHÍNH'}
                  </span>
                </td>
                <td className="px-10 py-6 text-[10px] font-bold text-slate-400">
                  {log.createdAt ? format(new Date(log.createdAt), 'HH:mm:ss dd/MM/yyyy') : '---'}
                </td>
                <td className="px-10 py-6 text-right pr-10">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100">Verified</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6 hover:-translate-y-2 transition-all">
      <div className={`${color} p-5 rounded-2xl text-white shadow-lg`}><Icon size={24} /></div>
      <div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-xl font-black text-slate-900 italic">{value}</h4>
      </div>
    </div>
  );
}