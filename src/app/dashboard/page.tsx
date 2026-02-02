'use client';

import { useEffect, useState, useMemo } from 'react';
import { statsApi, DashboardData, Branch, AccessLog } from '@/services/stats.api';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { 
  Loader2, Home, Users, Wallet, DoorOpen, 
  Activity, Building2, Calendar, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { format } from 'date-fns'; 

const COLORS = ['#3b82f6', '#e2e8f0'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  const currentBranchName = useMemo(() => {
    if (!selectedBranch) return "Tất cả hệ thống";
    return branches.find(b => b.id === Number(selectedBranch))?.name || "Chi nhánh đang chọn";
  }, [selectedBranch, branches]);

  const fetchAllDashboardData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const filterId = user?.branchId || selectedBranch;
      
      const [statsResult, logsResult, branchesResult] = await Promise.all([
        statsApi.getDashboardStats(filterId),
        statsApi.getRecentAccessLogs(10, filterId),
        statsApi.getAllBranches() 
      ]);
      
      setData(statsResult);
      setAccessLogs(logsResult);
      if (branches.length === 0) setBranches(branchesResult);
    } catch (error) {
      console.error('Lỗi truy vấn CSDL Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllDashboardData(true);
      const interval = setInterval(() => {
        fetchAllDashboardData(false); 
      }, 30000); 
      return () => clearInterval(interval);
    }
  }, [user, selectedBranch]);

  const occupancyData = useMemo(() => [
    { name: 'Đã thuê', value: data?.overview.rooms.rented || 0 },
    { name: 'Phòng trống', value: data?.overview.rooms.available || 0 },
  ], [data]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang đồng bộ dữ liệu...</p>
    </div>
  );

  return (
    <div className="p-8 space-y-8">
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs items={[{ label: 'Quản trị hệ thống', href: '/dashboard' }, { label: 'Tổng quan' }]} />
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 mb-4 w-fit">
            <Activity size={12} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest">Real-time Data</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-3">
            Dashboard
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Building2 size={14} className="text-blue-500" />
            Phạm vi: {currentBranchName}
          </p>
        </div>
        
        <div className="flex gap-4">
          {isAdmin && !user?.branchId && (
            <div className="relative group">
                <select 
                  className="appearance-none bg-white border border-slate-200 pl-5 pr-10 py-4 rounded-2xl text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer hover:border-blue-300 transition-all focus:ring-2 focus:ring-blue-100"
                  value={selectedBranch || ''}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">-- Tất cả hệ thống --</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>
          )}
          
          <div className="bg-slate-900 px-6 py-4 rounded-2xl text-white text-[10px] font-black uppercase flex items-center gap-2 shadow-xl shadow-slate-200">
            <Calendar size={14} className="text-blue-400" /> 
            Tháng {data?.finance.month}/{data?.finance.year}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Tổng số phòng" value={data?.overview.rooms.total} icon={Home} color="bg-blue-600" />
        <StatCard title="Đang sẵn sàng" value={data?.overview.rooms.available} icon={DoorOpen} color="bg-emerald-500" />
        <StatCard title="Cư dân" value={data?.overview.tenants} icon={Users} color="bg-violet-600" />
        
        <StatCard 
            title="Doanh thu thực tế" 
            // 🔥 FIX: Thêm ( || 0 ) để tránh lỗi undefined
            value={`${(data?.finance.revenue || 0).toLocaleString('vi-VN')} đ`} 
            icon={Wallet} 
            color="bg-slate-900" 
        />
        
        <StatCard 
            title="Công nợ chưa thu" 
            // 🔥 FIX: Thêm ( || 0 ) để tránh lỗi undefined
            value={`${(data?.finance.debt || 0).toLocaleString('vi-VN')} đ`} 
            icon={AlertCircle} 
            color="bg-red-500"
            // 🔥 FIX: So sánh an toàn
            alert={(data?.finance.debt || 0) > 0} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 h-[450px]">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-10 flex items-center gap-2">
             Biểu đồ doanh thu 6 tháng gần nhất
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.finance.chartData || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{fontSize: 9, fontWeight: 900}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 9, fontWeight: 900}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '11px'}} cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-4 self-start">Tỷ lệ lấp đầy</h3>
          <div className="relative w-full h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie data={occupancyData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {occupancyData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Legend verticalAlign="bottom" wrapperStyle={{fontSize: '9px', fontWeight: 900, textTransform: 'uppercase'}} />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">{data?.overview.rooms.occupancyRate || 0}%</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] italic flex items-center gap-3">
            <Activity size={18} className="text-blue-600" /> Nhật ký an ninh ({currentBranchName})
          </h3>
          <div className="flex items-center gap-3">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b">
                <tr>
                <th className="px-10 py-5">Đối tượng</th>
                <th className="px-10 py-5">Vị trí truy cập</th>
                <th className="px-10 py-5">Thời gian</th>
                <th className="px-10 py-5 text-right pr-10">Xác thực</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {accessLogs.length > 0 ? accessLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-black group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                        {log.user?.fullName?.charAt(0) || 'G'}
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-xs uppercase mb-0.5">{log.user?.fullName || 'Khách vãng lai'}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{log.user?.phone || 'Unknown'}</p>
                        </div>
                    </div>
                    </td>
                    <td className="px-10 py-6">
                    <span className="text-[9px] font-black px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-slate-600 shadow-sm">
                        {log.room?.roomNumber ? `P.${log.room.roomNumber}` : 'CỔNG CHÍNH'}
                    </span>
                    </td>
                    <td className="px-10 py-6 text-[10px] font-bold text-slate-500">
                    {log.createdAt ? format(new Date(log.createdAt), 'HH:mm - dd/MM/yyyy') : '---'}
                    </td>
                    <td className="px-10 py-6 text-right pr-10">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 tracking-widest">
                        FaceID Verified
                    </span>
                    </td>
                </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="px-10 py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Chưa có dữ liệu ra vào tại chi nhánh này
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, alert }: any) {
  return (
    <div className={`bg-white p-6 rounded-[2.5rem] shadow-xl border flex items-center gap-5 hover:-translate-y-1 transition-all ${alert ? 'border-red-100 shadow-red-100' : 'border-slate-100 shadow-slate-200/40'}`}>
      <div className={`${color} w-12 h-12 rounded-2xl text-white shadow-lg flex items-center justify-center shrink-0`}>
          <Icon size={20} />
      </div>
      <div className="overflow-hidden">
        <p className={`text-[8px] font-black uppercase tracking-widest mb-1 truncate ${alert ? 'text-red-500' : 'text-slate-400'}`}>
            {title}
        </p>
        <h4 className={`text-lg font-black italic truncate ${alert ? 'text-red-600' : 'text-slate-900'}`}>
            {value || 0}
        </h4>
      </div>
    </div>
  );
}