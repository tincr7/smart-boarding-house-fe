'use client';

import { useEffect, useState, useMemo } from 'react';
import { statsApi, DashboardData, Branch } from '@/services/stats.api';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { 
  Loader2, Home, Users, Wallet, DoorOpen, 
  Activity, Building2, Calendar, TrendingUp 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#3b82f6', '#e2e8f0'];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedBranch, setSelectedBranch] = useState<number | undefined>(user?.branchId || undefined);

  const fetchData = async () => {
    try {
      setLoading(true);
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
  }, [selectedBranch, user]);

  const occupancyData = useMemo(() => [
    { name: 'Đã thuê', value: data?.overview.rooms.rented || 0 },
    { name: 'Phòng trống', value: data?.overview.rooms.available || 0 },
  ], [data]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang tổng hợp dữ liệu thời gian thực...</p>
    </div>
  );

  return (
    <> {/* Fragment bọc ngoài cùng để fix lỗi JSX parent element */}
      <div className="p-8 space-y-8 selection:bg-blue-100">
        
        {/* TÍCH HỢP BREADCRUMBS */}
        <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Breadcrumbs 
            items={[
              { label: 'Hệ thống SmartHouse', href: '/dashboard/branches' },
              { label: 'Bảng điều khiển trung tâm' }
            ]} 
          />
        </div>

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-slate-100 pb-8">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 mb-4 w-fit">
              <Activity size={12} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">AI Intelligence System Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-3">
              Dashboard
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
              <Building2 size={14} className="text-blue-500" />
              Cơ sở: {user?.branchId ? branches.find(b => b.id === user.branchId)?.name : 'Toàn quyền vận hành hệ thống'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {isAdmin && !user?.branchId && (
              <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm transition-all focus-within:ring-4 focus-within:ring-blue-50">
                <Building2 size={16} className="text-blue-500" />
                <select 
                  className="text-[10px] font-black uppercase text-slate-600 outline-none bg-transparent cursor-pointer"
                  value={selectedBranch || ''}
                  onChange={(e) => setSelectedBranch(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">-- Toàn bộ hệ thống --</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            
            <div className="bg-slate-900 px-6 py-4 rounded-2xl shadow-2xl shadow-slate-200 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 border border-white/5">
              <Calendar size={14} className="text-blue-400" /> 
              Kỳ báo cáo: {data?.finance.month}/{data?.finance.year}
            </div>
          </div>
        </div>

        {/* --- STAT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Tổng số phòng" value={data?.overview.rooms.total} icon={Home} color="bg-blue-600" />
          <StatCard title="Đang sẵn sàng" value={data?.overview.rooms.available} icon={DoorOpen} color="bg-emerald-500" />
          <StatCard title="Cư dân nội khu" value={data?.overview.tenants} icon={Users} color="bg-violet-600" />
          <StatCard title="Dòng tiền dự tính" value={`${data?.finance.revenue.toLocaleString('vi-VN')} đ`} icon={Wallet} color="bg-slate-900" />
        </div>

        {/* --- CHARTS SECTION --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Biểu đồ Doanh thu */}
          <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100">
             <div className="flex justify-between items-center mb-10">
                <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] flex items-center gap-3">
                   <TrendingUp size={20} className="text-blue-500" /> Phân tích tăng trưởng tài chính
                </h3>
             </div>
             <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.finance.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900}} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Biểu đồ Tỷ lệ lấp đầy */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col items-center group">
             <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] mb-10 self-start">Tỷ lệ lấp đầy phòng</h3>
             <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={occupancyData} innerRadius={75} outerRadius={100} paddingAngle={8} dataKey="value">
                      {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em'}} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Percent Mockup */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase leading-none">Occupancy</p>
                  <p className="text-2xl font-black text-slate-900 italic">
                    {Math.round(((data?.overview.rooms.rented || 0) / (data?.overview.rooms.total || 1)) * 100)}%
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* --- NHẬT KÝ RA VÀO REALTIME --- */}
        <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
          <div className="px-10 py-7 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] italic flex items-center gap-3">
              <Activity size={18} className="text-blue-600" /> Hệ thống kiểm soát ra vào thời gian thực
            </h3>
            <span className="px-4 py-1.5 bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 animate-pulse">
              Live Feed
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b">
                <tr>
                  <th className="px-10 py-5">Chủ thể cư dân</th>
                  <th className="px-10 py-5">Mã số phòng</th>
                  <th className="px-10 py-5">Thời điểm ghi nhận</th>
                  <th className="px-10 py-5 text-right pr-14">Trạng thái định danh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {accessLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-all group">
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black group-hover:bg-blue-600 transition-colors">
                            {log.user?.fullName?.charAt(0)}
                          </div>
                          <span className="font-black text-slate-800 text-xs uppercase italic tracking-tighter">{log.user?.fullName}</span>
                       </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                          P.{log.room?.roomNumber}
                       </span>
                    </td>
                    <td className="px-10 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                       {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-10 py-6 text-right pr-14">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase border border-emerald-100">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" /> Verified
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center py-6">
           <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">SmartHouse AI Technology Co. — Dashboard v4.0</p>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex items-center gap-6 transition-all hover:shadow-2xl hover:-translate-y-2 group">
      <div className={`${color} p-5 rounded-[1.5rem] text-white shadow-2xl shadow-blue-200/30 group-hover:rotate-6 transition-transform`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-none mb-3">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{value}</h4>
      </div>
    </div>
  );
}