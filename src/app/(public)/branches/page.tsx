'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, MapPin, ArrowRight, Search, Home, Star } from 'lucide-react';

function BranchesList() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [branches, setBranches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

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
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-blue-100">
      {/* Header đơn giản */}
      <div className="border-b border-slate-100 py-4 px-6 sticky top-0 bg-white/90 backdrop-blur-md z-40 flex justify-between items-center">
         <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest">
            <Home size={16} /> Trang chủ
         </Link>
         <span className="font-black text-slate-900 uppercase tracking-tighter">Hệ thống SmartHouse</span>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="mb-12 text-center max-w-2xl mx-auto">
           <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">
             Danh sách Chi nhánh
           </h1>
           <p className="text-slate-500 mb-8">Chọn một chi nhánh để xem danh sách các phòng đang trống.</p>
           
           {/* Tìm kiếm */}
           <div className="relative">
              <input 
                type="text" 
                placeholder="Tìm chi nhánh theo tên, quận..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
           </div>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-slate-50 rounded-3xl animate-pulse"/>)}
           </div>
        ) : filteredBranches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBranches.map((branch) => (
              <Link 
                href={`/branches/${branch.id}`} 
                key={branch.id} 
                className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-2 transition-all duration-500 flex flex-col"
              >
                <div className="h-60 relative overflow-hidden bg-slate-100">
                  {branch.image ? (
                    <img src={branch.image} alt={branch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Building2 size={64} /></div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-xl flex items-center gap-1 shadow-sm">
                     <Star size={12} className="fill-yellow-400 text-yellow-400"/> 
                     <span className="text-xs font-black text-slate-900">4.9</span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-3 group-hover:text-blue-600 transition-colors">{branch.name}</h3>
                  <div className="flex items-start gap-2 text-slate-500 text-sm font-medium mb-6">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-blue-500" />
                    <span>{branch.address}</span>
                  </div>
                  <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">Xem phòng trống</span>
                     <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ArrowRight size={18} />
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32">
             <p className="text-slate-400 font-bold">Không tìm thấy chi nhánh nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BranchesPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Đang tải...</div>}>
      <BranchesList />
    </Suspense>
  );
}