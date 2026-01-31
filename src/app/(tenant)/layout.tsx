'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, FileText, Receipt, LogOut, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth(); 

  // Hàm kiểm tra link đang hoạt động để highlight
  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER RIÊNG CHO CƯ DÂN */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            {/* 1. Nút Quay lại Trang chủ Public (Mới thêm) */}
            <Link 
              href="/" 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
              title="Quay lại trang chủ"
            >
               <Globe size={18} className="group-hover:rotate-12 transition-transform" />
            </Link>

            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

            {/* 2. Logo Home của My Room */}
            <Link href="/my-room" className="flex items-center gap-2 group">
               <div className={`p-2 rounded-lg transition-colors ${
                 pathname === '/my-room' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
               }`}>
                  <Home size={18} />
               </div>
               <span className="font-black text-slate-900 uppercase italic tracking-tighter text-sm hidden sm:block">
                  My Room
               </span>
            </Link>
          </div>

          {/* 3. Menu Nhanh */}
          <nav className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
             <Link 
               href="/my-room/contracts" 
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                 isActive('/my-room/contracts') 
                 ? 'bg-white text-blue-600 shadow-sm' 
                 : 'text-slate-500 hover:text-blue-600'
               }`}
             >
                <FileText size={14} /> <span className="hidden sm:inline">Hợp đồng</span>
             </Link>
             
             <Link 
               href="/my-room/invoices" 
               className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                 isActive('/my-room/invoices') 
                 ? 'bg-white text-blue-600 shadow-sm' 
                 : 'text-slate-500 hover:text-blue-600'
               }`}
             >
                <Receipt size={14} /> <span className="hidden sm:inline">Hóa đơn</span>
             </Link>
          </nav>

          {/* 4. Nhóm chức năng cá nhân */}
          <div className="flex items-center gap-3">
            <Link 
              href="/my-room/profile" 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                isActive('/my-room/profile')
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white'
              }`}
              title="Hồ sơ cá nhân"
            >
               <User size={18} />
            </Link>

            <button 
              onClick={logout}
              className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
              title="Đăng xuất"
            >
               <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* NỘI DUNG */}
      <main className="flex-1 w-full max-w-5xl mx-auto py-6 px-6">
        {children}
      </main>
    </div>
  );
}