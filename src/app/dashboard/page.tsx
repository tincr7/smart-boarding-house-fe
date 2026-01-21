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

  // --- Dữ liệu giả lập cho biểu đồ cột ---
  const revenueData = [
    { name: 'T8', total: 15000000 },
    { name: 'T9', total: 18000000 },
    { name: 'T10', total: 12000000 },
    { name: 'T11', total: 22000000 },
    { name: 'T12', total: 20000000 },
    // SỬA LẠI DÒNG NÀY: data.finance thay vì data.revenue
    { 
      name: `T${data?.finance.month || 1}`, 
      total: data?.finance.revenue || 0 
    }, 
  ];

  // --- Dữ liệu cho biểu đồ tròn ---
  // SỬA LẠI: data.overview.rooms thay vì data.rooms
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
            <p className="text-slate-500">Chào mừng trở lại, đây là tình hình kinh doanh hôm nay.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 text-sm font-medium">
            {/* SỬA LẠI: data.finance */}
            Tháng {data?.finance.month}/{data?.finance.year}
          </div>
        </div>

        {/* 4 Cards: SỬA HẾT ĐƯỜNG DẪN TRUY CẬP DỮ LIỆU */}
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
            color="bg-green-500" 
          />
          <StatCard 
            title="Khách đang thuê" 
            value={data?.overview.tenants} 
            icon={Users} 
            color="bg-purple-500" 
          />
          <StatCard 
            title="Doanh thu tháng" 
            // SỬA LẠI: data.finance.revenue
            value={`${data?.finance.revenue.toLocaleString('vi-VN')} đ`} 
            icon={Wallet} 
            color="bg-orange-500" 
          />
        </div>

        {/* Khu vực biểu đồ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Biểu đồ Cột */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ doanh thu</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `${value/1000000}M`} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    // Fix lỗi any ở đây
                    formatter={(value: any) => [`${Number(value).toLocaleString()} đ`, 'Doanh thu']}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ Tròn */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Tỷ lệ lấp đầy</h3>
            <div className="h-[300px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="block text-3xl font-bold text-slate-800">
                    {/* SỬA LẠI: data.overview.rooms.occupancyRate */}
                    {data?.overview.rooms.occupancyRate}%
                  </span>
                  <span className="text-xs text-slate-500">Lấp đầy</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Component con StatCard giữ nguyên
function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition-transform hover:-translate-y-1">
      <div className={`${color} p-4 rounded-xl text-white shadow-lg shadow-blue-100`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
      </div>
    </div>
  );
}