'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, LogOut, FileText, 
  Receipt, ArchiveRestore, ShieldCheck, 
  Building2, Globe, ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth(); 

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/dashboard', adminOnly: true },
    { icon: Building2, label: 'Chi nhánh', href: '/dashboard/branches', adminOnly: false },
    { icon: Users, label: 'Cư dân', href: '/dashboard/tenants', adminOnly: true },
    { icon: FileText, label: 'Hợp đồng', href: '/dashboard/contracts', adminOnly: false },
    { icon: Receipt, label: 'Hóa đơn', href: '/dashboard/invoices', adminOnly: false },
    { icon: ArchiveRestore, label: 'Thùng rác', href: '/dashboard/recycle-bin', adminOnly: true }, 
  ];

  const visibleMenuItems = allMenuItems.filter(item => isAdmin ? true : !item.adminOnly);

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200 shadow-2xl shadow-slate-200/50">
      
      {/* 1. BRAND & IDENTITY */}
      <div className="p-8 border-b border-slate-50">
        <div className="flex items-center gap-3 mb-8 group">
          <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 group-hover:rotate-12 transition-all duration-300">
            <Building2 className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">SmartHouse</h1>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em]">Management</span>
          </div>
        </div>
        
        {user && (
          <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Cán bộ vận hành</span>
              <p className="text-xs font-black text-slate-800 uppercase flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-500" /> {user.fullName}
              </p>
            </div>
            <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
              <ShieldCheck size={60} />
            </div>
          </div>
        )}
      </div>

      {/* 2. MODE SWITCHER */}
      <div className="px-6 pt-6">
        <Link href="/" className="flex items-center justify-between p-4 bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-2xl border border-blue-100 group transition-all duration-300">
           <div className="flex items-center gap-3">
              <Globe size={18} className="text-blue-600 group-hover:text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest">Trang chủ Public</span>
           </div>
           <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* 3. MAIN NAVIGATION */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-5">Hệ thống quản trị</p>
        {visibleMenuItems.map((item) => {
          
          // 👇 LOGIC ĐÃ SỬA LẠI Ở ĐÂY:
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard' // Nếu là Dashboard tổng -> Phải khớp chính xác 100%
            : pathname === item.href || pathname.startsWith(`${item.href}/`); // Các mục con -> Khớp chính xác HOẶC là trang con (ví dụ: contracts/1)

          return (
            <Link
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.15em] relative group ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-400/20'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* 4. FOOTER ACTIONS */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/30 space-y-2">
        <button 
          onClick={logout} 
          className="flex items-center gap-4 px-5 py-4 w-full text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}