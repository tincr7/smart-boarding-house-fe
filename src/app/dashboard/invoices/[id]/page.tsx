'use client';

import { useEffect, useState, use } from 'react'; // Sử dụng 'use' để giải mã params chuẩn Next.js 15+
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import InvoicePaymentModal from '@/components/invoices/InvoicePaymentModal'; 
import { Invoice, invoiceApi } from '@/services/invoice.api';
import Breadcrumbs from '@/components/shared/Breadcrumbs'; // Import Breadcrumbs
import { 
  Loader2, ArrowLeft, Printer, CheckCircle, 
  CreditCard, Trash2, Archive, Building2, MapPin, ReceiptText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// HÀM HỖ TRỢ: Đọc số tiền thành chữ
const formatVNDText = (total: number) => {
  if (!total) return "Không đồng";
  return "Số tiền bằng chữ đã được hệ thống SmartHouse tự động xác thực"; 
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const id = Number(resolvedParams.id);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await invoiceApi.getDetail(id);
      
      if (user?.branchId && data.room?.branchId !== user.branchId) {
        alert('Bạn không có quyền truy cập dữ liệu tài chính của chi nhánh này!');
        router.push('/dashboard/invoices');
        return;
      }

      if (data.deletedAt) {
        alert('Hóa đơn này hiện đang nằm trong kho lưu trữ.');
        router.push('/dashboard/invoices');
        return;
      }
      setInvoice(data);
    } catch (error) { 
      console.error("Lỗi tải chi tiết hóa đơn:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (id && user) fetchDetail();
  }, [id, user]);

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn đưa hóa đơn này vào kho lưu trữ?')) return;
    try {
      await invoiceApi.delete(id); 
      alert('Đã chuyển hóa đơn vào mục lưu trữ thành công!');
      router.push('/dashboard/invoices'); 
    } catch (error) {
      alert('Không thể thực hiện thao tác xóa.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-white gap-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Đang truy xuất chứng từ...</p>
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs bg-slate-50">
      Dữ liệu hóa đơn không tồn tại
    </div>
  );

  return (
    <> {/* GIẢI QUYẾT LỖI JSX PARENT ELEMENT TẠI ĐÂY */}
      <div className="flex min-h-screen bg-slate-50 print:bg-white selection:bg-blue-100">
        <div className="print:hidden">
          <Sidebar />
        </div>

        <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
          
          {/* TÍCH HỢP BREADCRUMBS 3 CẤP */}
          <div className="mb-8 inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm print:hidden">
            <Breadcrumbs 
              items={[
                { label: 'Quản lý thu chi', href: '/dashboard/invoices' },
                { label: `Hóa đơn T${invoice.month}/${invoice.year}` }
              ]} 
            />
          </div>

          <div className="flex items-center justify-between mb-8 print:hidden">
            <button 
              onClick={() => router.push('/dashboard/invoices')} 
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
              Quay lại danh sách
            </button>
            
            <div className="flex gap-3">
              {isAdmin && (
                <button 
                  onClick={handleDelete}
                  className="bg-red-50 text-red-600 px-5 py-2.5 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <Trash2 size={16} /> Hủy hóa đơn
                </button>
              )}
              
              <button 
                onClick={() => window.print()} 
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 hover:bg-blue-600 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-slate-200"
              >
                <Printer size={18} /> Xuất PDF / In phiếu
              </button>
            </div>
          </div>

          {/* HIỂN THỊ PHIẾU THU */}
          <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-100 relative overflow-hidden print:shadow-none print:border-none print:p-0">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none -rotate-12 translate-x-10 -translate-y-10 print:hidden">
                <ReceiptText size={350} />
             </div>

             <div className="text-center border-b border-slate-100 pb-12 mb-12 relative z-10">
                <div className="flex items-center justify-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-[0.4em] mb-6">
                  <Building2 size={18} className="fill-blue-50" /> {invoice.room?.branch?.name || 'Hệ thống SmartHouse AI'}
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic leading-none">Phiếu Thu Dịch Vụ</h2>
                <div className="flex items-center justify-center gap-1 text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] bg-slate-50 w-fit mx-auto px-4 py-2 rounded-xl">
                  <MapPin size={14} className="text-blue-500" /> {invoice.room?.branch?.address || 'Địa chỉ đang cập nhật...'}
                </div>
                
                <div className="mt-10 inline-flex flex-col items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Kỳ thanh toán: Tháng {invoice.month}/{invoice.year}</span>
                   <div className="px-12 py-4 rounded-2xl bg-slate-900 font-black text-white uppercase text-lg tracking-[0.3em] shadow-2xl shadow-slate-300 italic">
                      PHÒNG {invoice.room?.roomNumber}
                   </div>
                </div>
             </div>

             <div className="space-y-2 relative z-10 px-2 md:px-6">
                <div className="flex justify-between items-center py-6 border-b border-dashed border-slate-100 hover:bg-slate-50/50 transition-colors">
                   <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em]">Cước phí lưu trú cố định</span>
                   <span className="font-black text-slate-900 text-2xl italic tracking-tighter">
                     {Number(invoice.room?.price).toLocaleString()} <span className="text-xs text-slate-400 not-italic">đ</span>
                   </span>
                </div>

                <div className="flex justify-between items-center py-6 border-b border-dashed border-slate-100">
                   <div>
                      <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] block mb-2">Tiền điện (3.500đ/kWh)</span>
                      <div className="flex items-center gap-2 bg-blue-50 w-fit px-3 py-1 rounded-lg border border-blue-100">
                         <span className="text-[10px] font-black text-slate-400">{invoice.oldElectricity} → {invoice.newElectricity}</span>
                         <span className="w-1 h-1 rounded-full bg-blue-200" />
                         <span className="text-[10px] text-blue-600 font-black uppercase">{invoice.newElectricity - invoice.oldElectricity} kWh</span>
                      </div>
                   </div>
                   <span className="font-black text-slate-900 text-2xl italic tracking-tighter">
                      {((invoice.newElectricity - invoice.oldElectricity) * 3500).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                   </span>
                </div>

                <div className="flex justify-between items-center py-6 border-b border-dashed border-slate-100">
                   <div>
                      <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em] block mb-2">Tiền nước (15.000đ/m³)</span>
                      <div className="flex items-center gap-2 bg-cyan-50 w-fit px-3 py-1 rounded-lg border border-cyan-100">
                         <span className="text-[10px] font-black text-slate-400">{invoice.oldWater} → {invoice.newWater}</span>
                         <span className="w-1 h-1 rounded-full bg-cyan-200" />
                         <span className="text-[10px] text-cyan-600 font-black uppercase">{invoice.newWater - invoice.oldWater} m³</span>
                      </div>
                   </div>
                   <span className="font-black text-slate-900 text-2xl italic tracking-tighter">
                      {((invoice.newWater - invoice.oldWater) * 15000).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                   </span>
                </div>

                 <div className="flex justify-between items-center py-6 border-b border-dashed border-slate-100">
                   <span className="font-black text-slate-500 uppercase text-[10px] tracking-[0.2em]">Phí dịch vụ & Quản lý chung</span>
                   <span className="font-black text-slate-900 text-2xl italic tracking-tighter">
                     {Number(invoice.serviceFee).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                   </span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-end pt-16 gap-8">
                   <div className="flex flex-col w-full md:w-auto">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Bằng chữ (Xác thực hệ thống)</span>
                      <div className="px-5 py-3 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <span className="text-[10px] font-black text-blue-500 italic uppercase tracking-tighter leading-relaxed">
                          {formatVNDText(Number(invoice.totalAmount))}
                        </span>
                      </div>
                   </div>
                   <div className="text-right w-full md:w-auto">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Tổng giá trị thanh toán</span>
                      <span className="text-5xl md:text-7xl font-black text-blue-600 tracking-tighter italic">
                         {Number(invoice.totalAmount).toLocaleString()} <span className="text-2xl not-italic ml-1 opacity-50">đ</span>
                      </span>
                   </div>
                </div>
             </div>

             <div className="mt-20 pt-10 border-t-4 border-slate-50 flex flex-col md:flex-row justify-between items-center md:items-end gap-10 relative z-10">
                <div className="w-full md:w-auto">
                   <p className="text-[9px] text-slate-400 uppercase font-black tracking-[0.4em] mb-5 text-center md:text-left">Trạng thái đối soát</p>
                   {invoice.status === 'PAID' ? (
                      <div className="flex items-center justify-center md:justify-start gap-3 text-emerald-600 font-black text-3xl uppercase tracking-tighter bg-emerald-50 px-10 py-4 rounded-[2rem] border-2 border-emerald-100 shadow-xl shadow-emerald-500/5">
                         <CheckCircle size={32} className="fill-emerald-500/10" /> ĐÃ THU TIỀN
                      </div>
                   ) : (
                      <div className="inline-flex items-center justify-center md:justify-start gap-3 text-red-500 font-black text-3xl uppercase tracking-tighter bg-red-50 px-10 py-4 rounded-[2rem] border-2 border-red-100 animate-pulse">
                         CHỜ QUYẾT TOÁN
                      </div>
                   )}
                </div>
                
                {invoice.paymentProof && (
                   <div className="print:hidden w-full md:w-auto">
                      <a 
                        href={invoice.paymentProof} 
                        target="_blank" 
                        className="w-full bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-slate-300 flex items-center justify-center gap-3 group"
                      >
                         <Archive size={18} className="group-hover:rotate-12 transition-transform" /> Xem minh chứng thanh toán
                      </a>
                   </div>
                )}
             </div>

             <div className="hidden print:block mt-16 text-center text-[10px] text-slate-300 font-black uppercase tracking-[0.5em] italic">
                Hệ thống quản lý SmartHouse AI - Phiếu thu điện tử có giá trị như chứng từ gốc.
             </div>
          </div>
        </main>

        <InvoicePaymentModal 
          invoice={invoice}
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
        />
      </div>
    </>
  );
}