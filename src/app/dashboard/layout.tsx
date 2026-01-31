import Sidebar from '@/components/shared/Sidebar'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR CỐ ĐỊNH BÊN TRÁI */}
      <aside className="fixed top-0 left-0 h-screen w-64 z-50 bg-white border-r border-slate-200 shadow-xl shadow-slate-200/50 hidden lg:block">
        <Sidebar />
      </aside>
      
      {/* NỘI DUNG THAY ĐỔI BÊN PHẢI */}
      {/* margin-left-64 (256px) để nhường chỗ cho Sidebar */}
      <main className="flex-1 lg:ml-64 bg-slate-50 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}