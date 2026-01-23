'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import InvoicePaymentModal from '@/components/invoices/InvoicePaymentModal'; 
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { Loader2, ArrowLeft, Printer, CheckCircle, CreditCard, Trash2, Archive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const id = Number(params.id);

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await invoiceApi.getDetail(id);
      
      // Kiểm tra nếu hóa đơn đã bị xóa mềm
      if (data.deletedAt) {
        alert('Hóa đơn này đã được đưa vào mục lưu trữ.');
        router.push('/invoices');
        return;
      }
      setInvoice(data);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  // HÀM XỬ LÝ XÓA MỀM (SOFT DELETE)
  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn đưa hóa đơn này vào kho lưu trữ? Thao tác này thường dùng khi hóa đơn bị nhập sai chỉ số.')) return;
    try {
      await invoiceApi.delete(id); // Backend xử lý gán deletedAt
      alert('Đã chuyển hóa đơn vào mục lưu trữ thành công!');
      router.push('/invoices'); // Quay lại danh sách sạch
    } catch (error) {
      alert('Không thể xóa hóa đơn này.');
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
  if (!invoice) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">Không tìm thấy hóa đơn</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/invoices')} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Quay lại danh sách
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
            
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl flex items-center gap-2 hover:bg-black font-black text-[10px] uppercase tracking-widest transition-all">
              <Printer size={16} /> Xuất PDF / In
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3rem] shadow-sm border border-slate-200 relative overflow-hidden">
           {/* Trang trí Header */}
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Archive size={200} />
           </div>

           <div className="text-center border-b border-slate-100 pb-10 mb-10">
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">Hóa đơn tiền phòng</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Kỳ thanh toán: Tháng {invoice.month}/{invoice.year}</p>
              <div className="mt-6 inline-flex items-center gap-3 px-8 py-2.5 rounded-2xl bg-blue-50 font-black text-blue-700 border-2 border-blue-100 uppercase text-xs tracking-widest shadow-sm">
                 PHÒNG {invoice.room?.roomNumber}
              </div>
           </div>

           {/*  */}

           <div className="space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-200">
                 <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Tiền thuê phòng cố định</span>
                 <span className="font-black text-slate-900 text-xl">{Number(invoice.room?.price).toLocaleString()} <span className="text-xs text-slate-400">đ</span></span>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-200">
                 <div>
                    <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest block mb-1">Tiền điện (3.500đ/kWh)</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                       {invoice.oldElectricity} → {invoice.newElectricity} = <span className="text-blue-600">{invoice.newElectricity - invoice.oldElectricity} kWh</span>
                    </span>
                 </div>
                 <span className="font-black text-slate-900 text-lg">
                    {((invoice.newElectricity - invoice.oldElectricity) * 3500).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                 </span>
              </div>

              <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-200">
                 <div>
                    <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest block mb-1">Tiền nước (15.000đ/m³)</span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                       {invoice.oldWater} → {invoice.newWater} = <span className="text-cyan-600">{invoice.newWater - invoice.oldWater} m³</span>
                    </span>
                 </div>
                 <span className="font-black text-slate-900 text-lg">
                    {((invoice.newWater - invoice.oldWater) * 15000).toLocaleString()} <span className="text-xs text-slate-400">đ</span>
                 </span>
              </div>

               <div className="flex justify-between items-center py-4 border-b border-dashed border-slate-200">
                 <span className="font-black text-slate-500 uppercase text-[10px] tracking-widest">Phí dịch vụ & Quản lý</span>
                 <span className="font-black text-slate-900 text-lg">{Number(invoice.serviceFee).toLocaleString()} <span className="text-xs text-slate-400">đ</span></span>
              </div>

              <div className="flex justify-between items-center pt-10">
                 <span className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Tổng tiền thanh toán</span>
                 <span className="text-5xl font-black text-blue-600 tracking-tighter shadow-blue-50 drop-shadow-sm">
                    {Number(invoice.totalAmount).toLocaleString()} <span className="text-xl">đ</span>
                 </span>
              </div>
           </div>

           <div className="mt-16 pt-10 border-t-4 border-slate-50 flex justify-between items-center">
              <div>
                 <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-3">Trạng thái xử lý</p>
                 {invoice.status === 'PAID' ? (
                    <div className="flex items-center gap-3 text-green-500 font-black text-xl uppercase tracking-widest bg-green-50 px-6 py-2 rounded-2xl border-2 border-green-100">
                       <CheckCircle size={24} /> ĐÃ THANH TOÁN
                    </div>
                 ) : (
                    <div className="inline-flex items-center gap-3 text-red-500 font-black text-xl uppercase tracking-widest bg-red-50 px-6 py-2 rounded-2xl border-2 border-red-100 animate-pulse">
                       CHƯA TẤT TOÁN
                    </div>
                 )}
              </div>
              
              {invoice.paymentProof && (
                 <a 
                   href={invoice.paymentProof} 
                   target="_blank" 
                   className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                 >
                    Xem minh chứng CK
                 </a>
              )}
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