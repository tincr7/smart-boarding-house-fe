'use client';

import { X, CheckCircle, Copy, Smartphone, Info, CreditCard } from 'lucide-react';
import { useState } from 'react';

interface Props {
  invoice: any; // Nhận dữ liệu hóa đơn từ API findOne/getDetail
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoicePaymentModal({ invoice, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  // Nếu Modal không mở hoặc không có dữ liệu hóa đơn thì không render
  if (!isOpen || !invoice) return null;

  // Hàm hỗ trợ sao chép nội dung chuyển khoản để cư dân không nhập sai
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-slate-900">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header - Thiết kế gọn gàng, hiện đại */}
        <div className="px-6 py-5 text-center border-b bg-slate-50/50 relative">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Thanh toán hóa đơn</h3>
          <p className="text-xs text-slate-500 font-medium">
            Phòng {invoice.room?.roomNumber} • Tháng {invoice.month}/{invoice.year}
          </p>
          <button 
            onClick={onClose} 
            className="absolute right-4 top-5 p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Khu vực hiển thị số tiền lớn, rõ ràng */}
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 bg-blue-50 px-4 py-1.5 rounded-full mb-2">
              Tổng tiền cần trả
            </span>
            <h2 className="text-5xl font-black text-slate-900">
              {Number(invoice.totalAmount).toLocaleString()} <span className="text-xl font-bold">đ</span>
            </h2>
          </div>

          {/* VietQR Code - Được sinh động từ Backend */}
          <div className="relative p-5 bg-white border-[6px] border-slate-50 rounded-[2.5rem] shadow-2xl shadow-blue-100/50 transition-transform hover:scale-[1.02]">
            <img 
              src={invoice.paymentQR} 
              alt="Mã QR VietQR" 
              className="w-56 h-56 object-contain rounded-xl"
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-5 py-2 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap ring-4 ring-white">
              <Smartphone size={14}/> Mở App Ngân hàng để quét
            </div>
          </div>

          {/* Chi tiết chuyển khoản để cư dân đối soát */}
          <div className="w-full mt-12 space-y-4">
            {/* Nội dung chuyển khoản - Quan trọng nhất để tự động hóa */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center group">
              <div>
                <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Nội dung chuyển khoản</p>
                <p className="font-mono font-bold text-blue-900 text-sm">THANH TOAN HD{invoice.id}</p>
              </div>
              <button 
                onClick={() => handleCopy(`THANH TOAN HD${invoice.id}`)}
                className="p-3 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all active:scale-90"
                title="Sao chép nội dung"
              >
                {copied ? <CheckCircle size={22} className="text-green-500" /> : <Copy size={22}/>}
              </button>
            </div>

            {/* Thông tin chủ trọ */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Chủ tài khoản</p>
                <p className="font-bold text-slate-700 text-xs truncate uppercase">Lê Hoàng Giang</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Ngân hàng</p>
                <div className="flex items-center gap-1">
                   <CreditCard size={12} className="text-slate-400" />
                   <p className="font-bold text-slate-700 text-xs">Vietcombank</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer với hướng dẫn và nút đóng */}
        <div className="p-6 bg-slate-50 border-t flex flex-col gap-4">
          <div className="flex gap-3 text-amber-600 bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
            <Info size={18} className="shrink-0 mt-0.5"/>
            <p className="text-[10px] leading-relaxed font-medium">
              Lưu ý: Hệ thống sẽ tự động cập nhật trạng thái sau khi bạn hoàn tất chuyển khoản. 
              Vui lòng <strong>không thay đổi</strong> nội dung chuyển khoản để tránh lỗi đối soát.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98]"
          >
            Tôi đã chuyển khoản xong
          </button>
        </div>
      </div>
    </div>
  );
}