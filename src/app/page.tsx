'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Zap, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Logic: Nếu đã đăng nhập thì tự động chuyển hướng
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/rooms');
      }
    }
  }, [user, loading, router]);

  // Nếu đang tải thông tin user, hiện màn hình chờ (để tránh chớp giao diện)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị Landing Page
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* --- HEADER --- */}
      <header className="px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 transition-all">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-600/20">
            <Building2 className="text-white h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-slate-800 hidden sm:block tracking-tight">
            SmartBoarding
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link 
            href="/register" 
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Đăng ký ngay
          </Link>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wide border border-blue-200">
            <Zap size={14} /> Hệ thống quản lý 4.0
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Quản lý nhà trọ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Chưa bao giờ dễ thế
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Giải pháp toàn diện giúp chủ nhà trọ quản lý phòng, cư dân, điện nước và hóa đơn chỉ với vài cú click chuột. Tối ưu hóa doanh thu ngay hôm nay.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            
            <Link 
              href="/login" 
              className="px-8 py-4 bg-white text-slate-700 font-bold rounded-full text-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center"
            >
              Đăng nhập hệ thống
            </Link>
          </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 text-left px-4">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Quản lý Phòng</h3>
            <p className="text-slate-500 leading-relaxed">Theo dõi trạng thái phòng trống, đã thuê, hợp đồng sắp hết hạn một cách trực quan trên một màn hình duy nhất.</p>
          </div>

          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-green-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Tính tiền tự động</h3>
            <p className="text-slate-500 leading-relaxed">Tự động chốt số điện nước, tính toán dịch vụ và gửi hóa đơn chi tiết cho khách thuê qua Email hoặc Zalo.</p>
          </div>

          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-purple-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Bảo mật tuyệt đối</h3>
            <p className="text-slate-500 leading-relaxed">Dữ liệu được mã hóa chuẩn quốc tế và sao lưu hàng ngày. Phân quyền chi tiết cho chủ trọ và nhân viên.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-slate-400 text-sm bg-slate-50 border-t border-slate-200">
        <p>© 2024 Smart Boarding House. All rights reserved.</p>
      </footer>
    </div>
  );
}