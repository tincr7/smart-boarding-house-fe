'use client';

import { X, CheckCircle, Copy, Smartphone, Info, CreditCard, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';

interface Props {
  invoice: any; 
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoicePaymentModal({ invoice, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // LOGIC SINH MÃ QR ĐỘNG: Nếu backend chưa trả về paymentQR, ta có thể tự sinh bằng API của VietQR
  // Cấu trúc: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<INFO>&accountName=<NAME>
  const qrUrl = useMemo(() => {
    if (!invoice) return '';
    if (invoice.paymentQR) return invoice.paymentQR;

    const BANK_ID = 'VCB'; // Vietcombank
    const ACCOUNT_NO = '1234567890'; // Giang thay số tài khoản thật vào đây
    const ACCOUNT_NAME = 'LE HOANG GIANG';
    const amount = Number(invoice.totalAmount);
    const info = encodeURIComponent(`THANH TOAN HD${invoice.id}`);
    
    return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${info}&accountName=${ACCOUNT_NAME}`;
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
        
        {/* Header Section */}
        <div className="px-8 py-6 text-center border-b border-slate-50 bg-slate-50/30 relative">
          <div className="flex justify-center mb-1">
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Cổng thanh toán điện tử</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Xác thực giao dịch</h3>
          <button 
            onClick={onClose} 
            className="absolute right-6 top-8 p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all text-slate-400"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Amount Display */}
          <div className="flex flex-col items-center mb-10">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Số tiền cần thanh toán</p>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">
              {Number(invoice.totalAmount).toLocaleString()} <span className="text-xl font-bold ml-1 text-blue-600">đ</span>
            </h2>
          </div>

          {/* QR Code Container */}
          <div className="relative p-6 bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-2xl shadow-blue-100/30 group transition-all duration-500 hover:shadow-blue-200/50">
            <div className="w-60 h-60 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden">
               {qrUrl ? (
                 <img 
                   src={qrUrl} 
                   alt="VietQR SmartHouse" 
                   className="w-full h-full object-contain p-2"
                 />
               ) : (
                 <Loader2 className="animate-spin text-blue-600" size={32} />
               )}
            </div>
            
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 whitespace-nowrap ring-4 ring-white group-hover:bg-blue-600 transition-colors">
              <Smartphone size={16} className="animate-bounce" /> Quét mã để thanh toán
            </div>
          </div>

          {/* Payment Details */}
          <div className="w-full mt-14 space-y-4">
            <div className="p-5 bg-blue-50/50 rounded-[1.5rem] border-2 border-dashed border-blue-200 flex justify-between items-center group">
              <div>
                <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Nội dung bắt buộc</p>
                <p className="font-black text-blue-900 text-sm tracking-tight italic">THANH TOAN HD{invoice.id}</p>
              </div>
              <button 
                onClick={() => handleCopy(`THANH TOAN HD${invoice.id}`)}
                className="p-3 bg-white text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90 border border-blue-100"
              >
                {copied ? <CheckCircle size={20} className="text-green-500" /> : <Copy size={20}/>}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Chủ hưởng thụ</p>
                <p className="font-black text-slate-800 text-[11px] uppercase truncate">Le Hoang Giang</p>
              </div>
              <div className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Ngân hàng</p>
                <div className="flex items-center gap-2">
                   <CreditCard size={14} className="text-blue-500" />
                   <p className="font-black text-slate-800 text-[11px] uppercase">Vietcombank</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-6">
          <div className="flex gap-4 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <Info size={20} className="shrink-0 text-amber-500"/>
            <p className="text-[10px] leading-relaxed font-bold uppercase tracking-tight">
              Lưu ý: Sau khi chuyển khoản, hệ thống AI sẽ mất khoảng 1-3 phút để xác thực. 
              Vui lòng <strong>không chỉnh sửa</strong> nội dung để được duyệt hóa đơn tự động.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
          >
            Xác nhận đã hoàn tất giao dịch
          </button>
        </div>
      </div>
    </div>
  );
}