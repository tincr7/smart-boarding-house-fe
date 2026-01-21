'use client';

import { useAuth } from '@/context/AuthContext'; // 1. Sử dụng Context thay vì gọi API trực tiếp
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  LogOut, 
  FileText, 
  Receipt, 
  UserCog 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  
  // 2. Lấy user, isAdmin và hàm logout từ AuthContext
  // (Thay vì tự gọi API và dùng useState nội bộ)
  const { user, isAdmin, logout } = useAuth(); 

  // 3. Định nghĩa Menu có cờ 'adminOnly' để lọc
  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', href: '/dashboard', adminOnly: true }, // Chỉ Admin
    { icon: Home, label: 'Phòng trọ', href: '/rooms', adminOnly: false },
    { icon: Users, label: 'Cư dân', href: '/tenants', adminOnly: true }, // Chỉ Admin
    { icon: FileText, label: 'Hợp đồng', href: '/contracts', adminOnly: false },
    { icon: Receipt, label: 'Hóa đơn', href: '/invoices', adminOnly: false },
    { icon: UserCog, label: 'Tài khoản', href: '/profile', adminOnly: false },
  ];

  // 4. Lọc menu dựa trên quyền (isAdmin)
  const visibleMenuItems = allMenuItems.filter(item => 
    isAdmin ? true : !item.adminOnly
  );

  return (
    // --- GIỮ NGUYÊN CSS GIAO DIỆN GỐC (Trắng, Border, Shadow nhẹ) ---
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      
      {/* Header Logo */}
      <div className="p-6 border-b border-slate-100">
        <Link href={isAdmin ? "/dashboard" : "/rooms"}>
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2 cursor-pointer">
            <Home className="fill-blue-600" /> SmartHouse
          </h1>
        </Link>
        
        {/* Hiển thị User từ Context */}
        {user ? (
          <div className="mt-2 px-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Xin chào,</p>
            <p className="text-sm font-bold text-slate-800 truncate" title={user.fullName}>
              {user.fullName}
            </p>
          </div>
        ) : (
          <div className="mt-3 h-4 w-32 bg-slate-100 rounded animate-pulse" />
        )}
      </div>

      {/* Menu List */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              // --- CSS GỐC CỦA BẠN (Active: Xanh nhạt, Normal: Xám) ---
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Logout */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={logout} // Gọi hàm logout từ Context
          // --- CSS GỐC CỦA BẠN (Đỏ) ---
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-xl transition-all font-medium"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}