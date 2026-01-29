'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  LogOut, 
  FileText, 
  Receipt, 
  UserCog,
  ArchiveRestore,
  ShieldCheck,
  Building2 // Thêm icon để hiển thị chi nhánh
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth(); 

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/dashboard', adminOnly: true },
    { icon: Home, label: 'Phòng trọ', href: '/rooms', adminOnly: false },
    { icon: Users, label: 'Cư dân', href: '/tenants', adminOnly: true },
    { icon: FileText, label: 'Hợp đồng', href: '/contracts', adminOnly: false },
    { icon: Receipt, label: 'Hóa đơn', href: '/invoices', adminOnly: false },
    { icon: UserCog, label: 'Tài khoản', href: '/profile', adminOnly: false },
    { icon: ArchiveRestore, label: 'Thùng rác', href: '/recycle-bin', adminOnly: true }, 
  ];

  const visibleMenuItems = allMenuItems.filter(item => 
    isAdmin ? true : !item.adminOnly
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-[50]">
      {/* Brand Logo & User Info */}
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <Link href={isAdmin ? "/dashboard" : "/rooms"}>
          <div className="flex items-center gap-2 mb-6 group cursor-pointer">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform">
              <Home className="text-white fill-white" size={20} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">SmartHouse</h1>
          </div>
        </Link>
        
        {user ? (
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1 italic">Vận hành bởi</span>
              <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-500" /> {user.fullName}
              </p>
            </div>
            
            {/* HIỂN THỊ CHI NHÁNH ĐANG QUẢN LÝ (Nếu có) */}
            {user.branchId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-xl text-white shadow-sm">
                <Building2 size={12} className="text-blue-400" />
                <span className="text-[9px] font-black uppercase tracking-widest">Cơ sở {user.branchId}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
            <div className="h-8 w-full bg-slate-100 rounded-xl animate-pulse" />
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto scrollbar-hide">
        {visibleMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-[0.15em] relative group ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}
              <item.icon size={18} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-6 border-t border-slate-50 bg-slate-50/20">
        <button 
          onClick={logout} 
          className="flex items-center gap-4 px-5 py-4 w-full text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}