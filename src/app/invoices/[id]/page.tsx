'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { Invoice, invoiceApi } from '@/services/invoice.api';
import { Loader2, ArrowLeft, Printer, CheckCircle } from 'lucide-react';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await invoiceApi.getDetail(id);
        setInvoice(data);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin" /></div>;
  if (!invoice) return <div>Không tìm thấy hóa đơn</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft size={20} /> Quay lại
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Printer size={16} /> In Hóa đơn
          </button>
        </div>

        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
           <div className="text-center border-b border-slate-100 pb-6 mb-6">
              <h2 className="text-2xl font-bold text-slate-900 uppercase">Hóa đơn tiền phòng</h2>
              <p className="text-slate-500">Tháng {invoice.month} năm {invoice.year}</p>
              <div className="mt-4 inline-block px-4 py-1 rounded-full bg-slate-100 font-bold text-slate-800">
                 Phòng {invoice.room.roomNumber}
              </div>
           </div>

           <div className="space-y-6">
              {/* Tiền phòng */}
              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                 <span className="font-medium text-slate-700">Tiền thuê phòng</span>
                 <span className="font-bold text-slate-900">{Number(invoice.room.price).toLocaleString()} đ</span>
              </div>

              {/* Điện */}
              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                 <div>
                    <span className="font-medium text-slate-700 block">Tiền điện</span>
                    <span className="text-xs text-slate-500">
                       ({invoice.newElectricity} - {invoice.oldElectricity}) = {invoice.newElectricity - invoice.oldElectricity} số
                    </span>
                 </div>
                 {/* Giả sử bạn muốn hiển thị chi tiết tiền, ở đây hiển thị số tổng backend trả về thì chính xác hơn, 
                     nhưng nếu backend trả về totalAmount gộp thì ở đây khó tách. 
                     Tạm thời chỉ hiển thị chỉ số, hoặc tự tính lại để hiển thị cho đẹp */}
              </div>

              {/* Nước */}
              <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                 <div>
                    <span className="font-medium text-slate-700 block">Tiền nước</span>
                    <span className="text-xs text-slate-500">
                       ({invoice.newWater} - {invoice.oldWater}) = {invoice.newWater - invoice.oldWater} khối
                    </span>
                 </div>
              </div>

               {/* Phí dịch vụ */}
               <div className="flex justify-between items-center py-2 border-b border-dashed border-slate-200">
                 <span className="font-medium text-slate-700">Phí dịch vụ / Khác</span>
                 <span className="font-bold text-slate-900">{Number(invoice.serviceFee).toLocaleString()} đ</span>
              </div>

              {/* TỔNG CỘNG */}
              <div className="flex justify-between items-center pt-4">
                 <span className="text-xl font-bold text-slate-900">Tổng cộng</span>
                 <span className="text-2xl font-bold text-blue-600">{Number(invoice.totalAmount).toLocaleString()} đ</span>
              </div>
           </div>

           {/* Trạng thái */}
           <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div>
                 <p className="text-xs text-slate-400 uppercase font-bold">Trạng thái</p>
                 {invoice.status === 'PAID' ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold mt-1">
                       <CheckCircle size={20} /> ĐÃ THANH TOÁN
                    </div>
                 ) : (
                    <div className="text-red-500 font-bold mt-1">CHƯA THANH TOÁN</div>
                 )}
              </div>
              
              {invoice.paymentProof && (
                 <a href={invoice.paymentProof} target="_blank" className="text-blue-600 hover:underline text-sm">
                    Xem ảnh chứng từ
                 </a>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}