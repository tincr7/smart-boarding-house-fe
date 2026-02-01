'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { 
  Building2, Zap, LayoutDashboard, User, LogIn, 
  Search, Star, MapPin, ArrowRight, Loader2, ArrowUpRight
} from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch dữ liệu chi nhánh (Lấy 6 cái tiêu biểu để show ở Home)
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/branches`); // Giả sử API này lấy hết hoặc có limit
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (error) {
        console.error("Lỗi kết nối:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchBranches();
  }, []);

  // 2. Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Chuyển sang trang danh sách đầy đủ để tìm kiếm
      router.push(`/branches?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Building2 size={20} />
              </div>
              <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">SmartHouse</span>
           </Link>

           {/* Auth Buttons */}
           <div>
             {authLoading ? (
               <Loader2 className="animate-spin text-slate-300" size={20} />
             ) : user ? (
               <Link 
                 href={user.role === 'ADMIN' ? "/dashboard" : "/my-room"} 
                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-700 transition-all"
               >
                 {user.role === 'ADMIN' ? <LayoutDashboard size={16} /> : <User size={16} />}
                 <span>{user.role === 'ADMIN' ? 'Quản trị' : 'Phòng của tôi'}</span>
               </Link>
             ) : (
               <Link href="/login" className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase rounded-full hover:bg-blue-600 transition-all">
                 <LogIn size={16} /> Đăng nhập
               </Link>
             )}
           </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-16 px-6">
         <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 mx-auto">
               <Zap size={12} className="fill-blue-600" />
               <span className="text-[10px] font-black uppercase tracking-widest">Hệ thống quản lý 4.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-tight">
               Tìm Chỗ Ở <span className="text-blue-600 italic">Ưng Ý.</span>
            </h1>
            
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
               Hệ thống phòng trọ hiện đại, an ninh, tích hợp thanh toán tự động và quản lý minh bạch.
            </p>

            {/* Thanh tìm kiếm */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto relative group">
               <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo quận, tên đường..." 
                  className="w-full pl-6 pr-14 py-4 bg-white border-2 border-slate-100 rounded-full outline-none focus:border-blue-500 transition-all shadow-xl shadow-slate-200/50 text-sm font-bold"
               />
               <button type="submit" className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-full hover:bg-slate-900 transition-all">
                  <Search size={20} />
               </button>
            </form>
         </div>
      </section>

      {/* --- DANH SÁCH CHI NHÁNH (TÓM TẮT) --- */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="flex items-end justify-between mb-8 border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Chi nhánh nổi bật</h2>
          {/* 👇 LINK NÀY SẼ DẪN ĐẾN TRANG HIỂN THỊ ĐẦY ĐỦ */}
          <Link href="/branches" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-slate-900 transition-colors">
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>

        {isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-80 bg-slate-50 rounded-3xl animate-pulse" />)}
          </div>
        ) : branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Chỉ hiện tối đa 6 cái ở trang chủ */}
            {branches.slice(0, 6).map((branch) => (
              <Link 
                href={`/branches/${branch.id}`} 
                key={branch.id} 
                className="group block bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="h-56 relative overflow-hidden bg-slate-100">
                  {branch.image ? (
                    <img src={branch.image} alt={branch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Building2 size={48} /></div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                     <Star size={10} className="fill-yellow-400 text-yellow-400"/> 
                     <span className="text-[10px] font-black text-slate-900">4.9</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-slate-900 uppercase italic truncate pr-4">{branch.name}</h3>
                    <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ArrowUpRight size={16} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-medium mb-4">
                    <MapPin size={14} className="shrink-0 text-blue-500" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-50">
                     <p className="text-sm font-bold text-slate-900">
                        3.500.000 <span className="text-xs text-slate-400 font-normal">đ/tháng</span>
                     </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
             <p className="text-slate-400 font-bold text-sm">Chưa có dữ liệu chi nhánh</p>
          </div>
        )}
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10 space-y-6">
               <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                  Sẵn sàng trải nghiệm sống mới?
               </h2>
               <div className="flex justify-center gap-4">
                  {/* 👇 NÚT NÀY SẼ DẪN ĐẾN TRANG /branches (Danh sách phòng nằm trong chi nhánh) */}
                  <Link href="/branches" className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all">
                     Xem phòng ngay
                  </Link>
               </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-slate-900 to-slate-900" />
         </div>
      </section>

    </div>
  );
}