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
  ArchiveRestore // Thêm icon ArchiveRestore cho Thùng rác
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth(); 

  // CẬP NHẬT DANH SÁCH MENU: Thêm Thùng rác vào danh sách Admin
  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/dashboard', adminOnly: true },
    { icon: Home, label: 'Phòng trọ', href: '/rooms', adminOnly: false },
    { icon: Users, label: 'Cư dân', href: '/tenants', adminOnly: true },
    { icon: FileText, label: 'Hợp đồng', href: '/contracts', adminOnly: false },
    { icon: Receipt, label: 'Hóa đơn', href: '/invoices', adminOnly: false },
    { icon: UserCog, label: 'Tài khoản', href: '/profile', adminOnly: false },
    // THÊM MỤC THÙNG RÁC Ở ĐÂY
    { icon: ArchiveRestore, label: 'Thùng rác', href: '/recycle-bin', adminOnly: true }, 
  ];

  const visibleMenuItems = allMenuItems.filter(item => 
    isAdmin ? true : !item.adminOnly
  );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      <div className="p-6 border-b border-slate-100">
        <Link href={isAdmin ? "/dashboard" : "/rooms"}>
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2 cursor-pointer">
            <Home className="fill-blue-600" /> SmartHouse
          </h1>
        </Link>
        
        {user ? (
          <div className="mt-2 px-1">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Xin chào,</p>
            <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight" title={user.fullName}>
              {user.fullName}
            </p>
          </div>
        ) : (
          <div className="mt-3 h-4 w-32 bg-slate-100 rounded animate-pulse" />
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 3 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={logout} 
          className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}