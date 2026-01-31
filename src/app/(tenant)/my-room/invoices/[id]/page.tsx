'use client';

import { useEffect, useState, use } from 'react'; // Sử dụng 'use' để xử lý params chuẩn Next.js mới
import { useRouter } from 'next/navigation';
import InvoicePaymentModal from '@/components/invoices/InvoicePaymentModal'; 
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { Loader2, ArrowLeft, CreditCard, CheckCircle, Printer, ReceiptText, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TenantInvoiceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(resolvedParams.id);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await invoiceApi.getDetail(id);
        
        // Bảo mật: Nếu hóa đơn không thuộc về các phòng của user thì đá ra ngoài
        // (Bạn có thể thêm logic so khớp userId tại đây nếu API trả về userId)
        
        setInvoice(data);
      } catch (error) { 
        console.error("Lỗi tải chi tiết hóa đơn:", error); 
        router.push('/my-room/invoices');
      } finally { 
        setLoading(false); 
      }
    };
    if (user && id) fetchDetail();
  }, [id, user, router]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin text-emerald-500" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang truy xuất hóa đơn...</p>
    </div>
  );

  if (!invoice) return (
    <div className="text-center p-20">
      <p className="font-black text-slate-400 uppercase text-xs mb-4">Không tìm thấy dữ liệu hóa đơn</p>
      <button onClick={() => router.push('/my-room/invoices')} className="text-emerald-600 font-bold text-xs uppercase underline">Quay lại danh sách</button>
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto min-h-screen bg-slate-50 selection:bg-emerald-100">
      
      {/* TÍCH HỢP BREADCRUMBS 4 CẤP */}
      <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs 
          items={[
            { label: 'My Room', href: '/my-room' },
            { label: 'Hóa đơn', href: '/my-room/invoices' },
            { label: `Tháng ${invoice.month}/${invoice.year}` }
          ]} 
        />
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <button 
          onClick={() => router.push('/my-room/invoices')} 
          className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-emerald-600 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
        </button>
        
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={() => window.print()} 
             className="flex-1 md:flex-none bg-white text-slate-900 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
           >
              <Printer size={16} /> In phiếu
           </button>
           
           {invoice.status !== 'PAID' && (
              <button 
                onClick={() => setIsPayModalOpen(true)}
                className="flex-[2] md:flex-none bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard size={18} /> Thanh toán VietQR
              </button>
           )}
        </div>
      </div>

      {/* CHI TIẾT HÓA ĐƠN */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 md:p-14 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none -rotate-12 translate-x-10 -translate-y-10">
            <ReceiptText size={300} />
          </div>

          <div className="text-center border-b border-slate-100 pb-10 mb-10 relative z-10">
             <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-[0.3em] mb-6">
                <ShieldCheck size={18} className="fill-emerald-50" /> Xác thực bởi SmartHouse AI
             </div>
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-none">
                Phiếu thanh toán
             </h2>
             <div className="flex items-center justify-center gap-3">
                <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Kỳ {invoice.month}/{invoice.year}
                </span>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   Phòng {invoice.room?.roomNumber}
                </span>
             </div>
          </div>

          <div className="space-y-2 relative z-10">
              <div className="flex justify-between items-center py-5 border-b border-dashed border-slate-100 group">
                 <div className="space-y-1">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ lưu trú</span>
                    <span className="text-sm font-bold text-slate-600 uppercase italic">Tiền phòng cơ bản</span>
                 </div>
                 <span className="text-xl font-black text-slate-900 italic">{Number(invoice.room?.price).toLocaleString()} <span className="text-xs">đ</span></span>
              </div>

              <div className="flex justify-between items-center py-5 border-b border-dashed border-slate-100">
                 <div className="space-y-1">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ năng lượng</span>
                    <span className="text-sm font-bold text-slate-600 uppercase italic">
                       Tiền điện ({invoice.newElectricity - invoice.oldElectricity} kWh)
                    </span>
                 </div>
                 <span className="text-xl font-black text-slate-900 italic">
                    {((invoice.newElectricity - invoice.oldElectricity) * 3500).toLocaleString()} <span className="text-xs">đ</span>
                 </span>
              </div>
              
              <div className="pt-12 flex flex-col md:flex-row justify-between items-end gap-6">
                 <div>
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tình trạng thanh toán</span>
                    {invoice.status === 'PAID' ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase bg-emerald-50 px-5 py-2 rounded-xl border border-emerald-100">
                         <CheckCircle size={18} /> Đã hoàn tất
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-500 font-black text-sm uppercase bg-red-50 px-5 py-2 rounded-xl border border-red-100 animate-pulse">
                         Chưa thanh toán
                      </div>
                    )}
                 </div>

                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Tổng cộng kỳ này</p>
                    <p className="text-5xl font-black text-blue-600 tracking-tighter italic">
                       {Number(invoice.totalAmount).toLocaleString()} <span className="text-lg">đ</span>
                    </p>
                 </div>
              </div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">SmartHouse Digital Invoice System</p>
          </div>
      </div>

      <InvoicePaymentModal 
        invoice={invoice}
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
      />
    </div>
  );
}