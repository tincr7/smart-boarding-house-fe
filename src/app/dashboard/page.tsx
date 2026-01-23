'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import { statsApi, DashboardData } from '@/services/stats.api';
import { 
  Loader2, Home, Users, Wallet, DoorOpen 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = ['#3b82f6', '#e2e8f0'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await statsApi.getDashboardStats();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ DỮ LIỆU THẬT: Lấy trực tiếp từ Backend trả về
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tổng quan</h1>
            <p className="text-slate-500">Dữ liệu kinh doanh được cập nhật thời gian thực.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium">
            Tháng {data?.finance.month}/{data?.finance.year}
          </div>
        </div>

        {/* 4 Thẻ thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Tổng số phòng" 
            value={data?.overview.rooms.total} 
            icon={Home} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Phòng trống" 
            value={data?.overview.rooms.available} 
            icon={DoorOpen} 
            color="bg-emerald-500" 
          />
          <StatCard 
            title="Khách đang thuê" 
            value={data?.overview.tenants} 
            icon={Users} 
            color="bg-violet-500" 
          />
          <StatCard 
            title="Doanh thu tháng" 
            value={`${data?.finance.revenue.toLocaleString('vi-VN')} đ`} 
            icon={Wallet} 
            color="bg-orange-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Biểu đồ Cột - Dữ liệu 6 tháng gần nhất */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Doanh thu 6 tháng gần nhất</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b'}} 
                    tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} đ`, 'Doanh thu']}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ Tròn - Tỷ lệ lấp đầy */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Tình trạng phòng</h3>
            <div className="h-[300px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-800">
                  {data?.overview.rooms.occupancyRate}%
                </span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Lấp đầy</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
      <div className={`${color} p-4 rounded-xl text-white shadow-lg opacity-90`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-semibold">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
      </div>
    </div>
  );
}