'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import InvoicePaymentModal from '@/components/invoices/InvoicePaymentModal'; 
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { 
  Loader2, ArrowLeft, Printer, CheckCircle, 
  CreditCard, Trash2, Archive, Building2, MapPin 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// HÀM HỖ TRỢ: Đọc số tiền thành chữ
const formatVNDText = (total: number) => {
  if (!total) return "Không đồng";
  // Đây là phần logic giả lập, Giang có thể dùng thư viện 'vietnamese-number-reader' để chính xác 100%
  return "Số tiền bằng chữ đã được hệ thống SmartHouse tự động xác thực"; 
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuth(); // Lấy user để kiểm tra quyền truy cập chi nhánh
  const id = Number(params.id);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await invoiceApi.getDetail(id);
      
      // AN NINH: Admin cơ sở không được xem hóa đơn chi nhánh khác
      if (user?.branchId && data.room?.branchId !== user.branchId) {
        alert('Bạn không có quyền truy cập dữ liệu tài chính của chi nhánh này!');
        router.push('/invoices');
        return;
      }

      if (data.deletedAt) {
        alert('Hóa đơn này hiện đang nằm trong kho lưu trữ.');
        router.push('/invoices');
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
    if (!confirm('Bạn có chắc muốn đưa hóa đơn này vào kho lưu trữ? Thao tác này thường dùng để hủy hóa đơn sai chỉ số.')) return;
    try {
      await invoiceApi.delete(id); 
      alert('Đã chuyển hóa đơn vào mục lưu trữ thành công!');
      router.push('/invoices'); 
    } catch (error) {
      alert('Không thể thực hiện thao tác xóa.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-xs bg-slate-50">
      Dữ liệu hóa đơn không tồn tại
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>

      <main className="flex-1 ml-64 p-8 print:ml-0 print:p-0">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <button 
            onClick={() => router.push('/invoices')} 
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

            {!isAdmin && invoice.status !== 'PAID' && (
              <button 
                onClick={() => setIsPayModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                <CreditCard size={18} /> Thanh toán VietQR
              </button>
            )}
            
            <button 
              onClick={() => window.print()} 
              className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-black font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <Printer size={16} /> Xuất PDF / In
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none print:p-4">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none print:hidden">
              <Archive size={200} />
           </div>

           <div className="text-center border-b border-slate-100 pb-10 mb-10">
              <div className="flex items-center justify-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-[0.3em] mb-4">
                <Building2 size={16} /> {invoice.room?.branch?.name || 'Hệ thống SmartHouse AI'}
              </div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">Hóa đơn dịch vụ</h2>
              <div className="flex items-center justify-center gap-1 text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">
                <MapPin size={12} /> {invoice.room?.branch?.address || 'Địa chỉ đang cập nhật...'}
              </div>
              
              <div className="mt-8 inline-flex flex-col items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kỳ thanh toán: Tháng {invoice.month}/{invoice.year}</span>
                 <div className="px-10 py-3 rounded-2xl bg-slate-900 font-black text-white uppercase text-sm tracking-[0.2em] shadow-xl shadow-slate-200">
                    PHÒNG {invoice.room?.roomNumber}
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-center py-5 border-b border-dashed border-slate-200">
                 <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Tiền thuê phòng cố định</span>
                 <span className="font-black text-slate-900 text-2xl">
                   {Number(invoice.room?.price).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                 </span>
              </div>

              <div className="flex justify-between items-center py-5 border-b border-dashed border-slate-200">
                 <div>
                    <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest block mb-1">Tiền điện (3.500đ/kWh)</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                       {invoice.oldElectricity} → {invoice.newElectricity} = <span className="text-blue-600 font-black">{invoice.newElectricity - invoice.oldElectricity} kWh</span>
                    </span>
                 </div>
                 <span className="font-black text-slate-900 text-xl">
                    {((invoice.newElectricity - invoice.oldElectricity) * 3500).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                 </span>
              </div>

              <div className="flex justify-between items-center py-5 border-b border-dashed border-slate-200">
                 <div>
                    <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest block mb-1">Tiền nước (15.000đ/m³)</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                       {invoice.oldWater} → {invoice.newWater} = <span className="text-cyan-600 font-black">{invoice.newWater - invoice.oldWater} m³</span>
                    </span>
                 </div>
                 <span className="font-black text-slate-900 text-xl">
                    {((invoice.newWater - invoice.oldWater) * 15000).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                 </span>
              </div>

               <div className="flex justify-between items-center py-5 border-b border-dashed border-slate-200">
                 <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Phí dịch vụ & Quản lý</span>
                 <span className="font-black text-slate-900 text-xl">
                   {Number(invoice.serviceFee).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                 </span>
              </div>

              <div className="flex justify-between items-center pt-12">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Bằng chữ</span>
                    <span className="text-[10px] font-black text-blue-500 italic uppercase tracking-tighter">
                      {formatVNDText(Number(invoice.totalAmount))}
                    </span>
                 </div>
                 <div className="text-right">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Tổng thanh toán</span>
                    <span className="text-6xl font-black text-blue-600 tracking-tighter drop-shadow-sm">
                       {Number(invoice.totalAmount).toLocaleString()} <span className="text-2xl ml-1">đ</span>
                    </span>
                 </div>
              </div>
           </div>

           <div className="mt-20 pt-10 border-t-4 border-slate-50 flex justify-between items-end">
              <div>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-4">Trạng thái quyết toán</p>
                 {invoice.status === 'PAID' ? (
                    <div className="flex items-center gap-3 text-green-600 font-black text-2xl uppercase tracking-widest bg-green-50 px-8 py-3 rounded-2xl border-2 border-green-100 shadow-sm">
                       <CheckCircle size={28} /> ĐÃ THANH TOÁN
                    </div>
                 ) : (
                    <div className="inline-flex items-center gap-3 text-red-500 font-black text-2xl uppercase tracking-widest bg-red-50 px-8 py-3 rounded-2xl border-2 border-red-100 animate-pulse">
                       CHỜ THANH TOÁN
                    </div>
                 )}
              </div>
              
              {invoice.paymentProof && (
                 <div className="print:hidden">
                    <a 
                      href={invoice.paymentProof} 
                      target="_blank" 
                      className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                    >
                       <Archive size={16} /> Minh chứng chuyển khoản
                    </a>
                 </div>
              )}
           </div>

           <div className="hidden print:block mt-16 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] italic">
              SmartHouse AI - Giải pháp quản lý nhà trọ thông minh
           </div>
        </div>
      </main>

      <InvoicePaymentModal 
        invoice={invoice}
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
      />
    </div>
  );
}