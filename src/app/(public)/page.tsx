'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { 
  Building2, Zap, ShieldCheck, MapPin, 
  ArrowRight, LayoutDashboard, User, LogIn, 
  LogOut, Search, Star, Wifi, Smartphone, CheckCircle2,
  Loader2
} from "lucide-react";

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [branches, setBranches] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch dữ liệu chi nhánh
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/branches`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách chi nhánh:", error);
      } finally {
        setIsFetching(false);
      }
    };
    fetchBranches();
  }, []);

  // 2. Logic tìm kiếm điều hướng khi nhấn nút Search
  const handleSearchNavigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/branches?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 3. Render nút Auth thông minh
  const renderAuthButtons = () => {
    if (authLoading) {
      return <div className="w-10 h-10 flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={20} /></div>;
    }

    if (user) {
      return (
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
           <div className="text-right hidden md:block">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Cư dân</p>
              <p className="text-sm font-black text-slate-800 leading-none">{user.fullName}</p>
           </div>
           
           <Link 
             href={user.role === 'ADMIN' ? "/dashboard" : "/my-room"} 
             className={`w-10 h-10 flex items-center justify-center rounded-full text-white transition-all shadow-lg hover:scale-110 ${
               user.role === 'ADMIN' ? "bg-slate-900 hover:bg-blue-600" : "bg-emerald-500 hover:bg-emerald-600"
             }`}
             title={user.role === 'ADMIN' ? "Quản trị" : "Phòng của tôi"}
           >
             {user.role === 'ADMIN' ? <LayoutDashboard size={18} /> : <User size={18} />}
           </Link>

           <button 
             onClick={logout} 
             className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-600 transition-all"
             title="Đăng xuất"
           >
             <LogOut size={18} />
           </button>
        </div>
      );
    }

    return (
      <Link href="/login" className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1">
        <LogIn size={16} /> Đăng nhập
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-blue-100 selection:text-blue-900">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-all duration-300">
                <Building2 className="text-white h-5 w-5" />
              </div>
              <div>
                 <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic leading-none">SmartHouse</h1>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">System</p>
              </div>
           </Link>
           {renderAuthButtons()}
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
         <div className="absolute top-0 right-0 w-2/3 h-full bg-slate-50 -z-10 rounded-bl-[10rem]" />
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-10 duration-1000">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                  <Zap size={14} className="fill-blue-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Quản lý nhà trọ thông minh 4.0</span>
               </div>
               <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">
                  Sống Thông Minh <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">Trọn Tiện Nghi.</span>
               </h1>
               <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg">
                  Tích hợp FaceID, thanh toán tự động và quản lý hóa đơn minh bạch qua App. Nơi an cư lý tưởng cho thế hệ số.
               </p>

               <form onSubmit={handleSearchNavigation} className="bg-white p-2 rounded-full border border-slate-200 shadow-xl shadow-slate-200/50 flex items-center max-w-md focus-within:ring-2 ring-blue-500/20 transition-all">
                  <div className="flex-1 px-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tìm khu vực</p>
                     <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Quận, tên chi nhánh..." 
                        className="text-sm font-bold text-slate-800 outline-none w-full bg-transparent"
                     />
                  </div>
                  <button type="submit" className="bg-slate-900 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all">
                     <Search size={20} />
                  </button>
               </form>
            </div>

            <div className="relative hidden lg:block">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 mt-12">
                     <div className="h-64 w-full bg-slate-200 rounded-[2rem] overflow-hidden shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Smart Room" />
                     </div>
                     <div className="h-40 w-full bg-slate-900 rounded-[2rem] p-8 flex flex-col justify-between text-white shadow-2xl">
                        <ShieldCheck size={32} className="text-emerald-400" />
                        <p className="font-black uppercase tracking-widest text-sm leading-tight">An ninh<br/>tuyệt đối</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div className="h-40 w-full bg-blue-600 rounded-[2rem] p-8 flex flex-col justify-between text-white shadow-2xl">
                        <Wifi size={32} />
                        <p className="font-black uppercase tracking-widest text-sm leading-tight">Internet<br/>Wifi 6</p>
                     </div>
                     <div className="h-80 w-full bg-slate-200 rounded-[2rem] overflow-hidden shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080&auto=format&fit=crop" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" alt="Co-living space" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- DANH SÁCH CHI NHÁNH --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="space-y-2">
            <span className="text-blue-600 font-black text-xs uppercase tracking-[0.2em]">Hệ thống Smarthouse</span>
            <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Hệ thống Chi nhánh</h2>
          </div>
          <Link href="/branches" className="px-8 py-4 bg-slate-50 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
            Xem tất cả chi nhánh
          </Link>
        </div>

        {isFetching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[400px] bg-slate-50 rounded-[2.5rem] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : branches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.slice(0, 6).map((branch) => (
              <Link 
                href={`/branches/${branch.id}`} 
                key={branch.id} 
                className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col"
              >
                <div className="h-64 relative overflow-hidden bg-slate-100">
                  {branch.image ? (
                    <img src={branch.image} alt={branch.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Building2 size={64} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                     <span className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-blue-600 shadow-sm border border-blue-50">Verified</span>
                     <span className="bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
                        <Star size={10} className="fill-yellow-400 text-yellow-400 border-none"/> 4.9
                     </span>
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2 group-hover:text-blue-600 transition-colors">
                    {branch.name}
                  </h3>
                  <div className="flex items-start gap-2 text-slate-500 text-xs font-bold uppercase mb-6 flex-1">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-blue-500" />
                    <span className="line-clamp-2">{branch.address}</span>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Giá thuê từ</p>
                        <p className="text-lg font-black text-slate-900 leading-none">3.500.000 <span className="text-xs">đ/t</span></p>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all group-hover:rotate-[-45deg]">
                        <ArrowRight size={18} />
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Hệ thống đang bảo trì dữ liệu</p>
          </div>
        )}
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 px-6">
         <div className="max-w-7xl mx-auto bg-blue-600 rounded-[3rem] p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-500/30">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

            <div className="relative z-10">
               <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-6 leading-tight">
                  Tìm nơi an cư lý tưởng?
               </h2>
               <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                  Gia nhập cộng đồng văn minh tại SmartHouse. Hệ thống phòng trọ hiện đại nhất dành cho sinh viên và người đi làm.
               </p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/branches" className="px-10 py-4 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-lg">
                     Xem phòng trống ngay
                  </Link>
                  <Link href="/login" className="px-10 py-4 bg-blue-700 text-white border border-blue-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-800 transition-all">
                     Đăng ký tài khoản
                  </Link>
               </div>
            </div>
         </div>
      </section>

      <footer className="py-16 bg-white border-t border-slate-100 text-center mt-auto">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-slate-50 rounded-2xl text-slate-300">
            <Building2 size={32} />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">© 2024 SmartHouse AI Technology</p>
        <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Hệ thống quản lý cư dân thông minh</p>
      </footer>
    </div>
  );
}