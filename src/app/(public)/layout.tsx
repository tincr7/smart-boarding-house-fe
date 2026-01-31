'use client';

import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, User, LogOut, LogIn, Building2, MapPin } from "lucide-react";
import Link from "next/link"; // Sửa lại import Link từ next/link
import { usePathname } from "next/navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2.5 bg-slate-900 rounded-xl text-white group-hover:bg-blue-600 transition-colors shadow-lg">
              <Building2 size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black uppercase tracking-tighter italic text-slate-900 leading-none">SmartHouse</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">System</span>
            </div>
          </Link>

          {/* Menu Navigation & Auth */}
          <div className="flex items-center gap-8">
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/branches" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">
                <MapPin size={14} /> Hệ thống Chi nhánh
              </Link>
            </nav>

            <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
              {!loading && (
                user ? (
                  <div className="flex items-center gap-3">
                    {/* Hiển thị nút điều hướng dựa trên Role */}
                    {user.role === 'ADMIN' ? (
                      <Link 
                        href="/dashboard" 
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2"
                      >
                        <LayoutDashboard size={14} /> Quản trị
                      </Link>
                    ) : (
                      <Link 
                        href="/my-room" 
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg flex items-center gap-2"
                      >
                        <User size={14} /> Phòng của tôi
                      </Link>
                    )}

                    {/* Nút đăng xuất nhanh ngay tại trang Public */}
                    <button 
                      onClick={logout}
                      className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all group"
                      title="Đăng xuất"
                    >
                      <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                ) : (
                  /* Nếu chưa đăng nhập hiện nút Login như cũ */
                  <Link 
                    href="/login" 
                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2"
                  >
                    <LogIn size={14} /> Đăng nhập
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1">{children}</main>

      {/* FOOTER */}
      <footer className="bg-white py-10 border-t border-slate-100 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            © 2024 SmartHouse AI Technology
          </p>
        </div>
      </footer>
    </div>
  );
}