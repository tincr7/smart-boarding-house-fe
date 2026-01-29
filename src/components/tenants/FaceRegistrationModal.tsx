'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { X, Camera, RefreshCw, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface FaceRegistrationModalProps {
  user: { id: number; fullName: string };
  onClose: () => void;
  onSuccess: () => void;
}

export default function FaceRegistrationModal({ user, onClose, onSuccess }: FaceRegistrationModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'capture' | 'preview'>('capture');

  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user"
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      setStep('preview');
    }
  }, [webcamRef]);

  const handleRegister = async () => {
    if (!imgSrc) return;
    setLoading(true);

    try {
      const blob = await fetch(imgSrc).then((res) => res.blob());
      const file = new File([blob], `face_${user.id}.jpg`, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('file', file);

      // Đồng bộ URL và Token theo cấu trúc dự án của bạn
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = Cookies.get('access_token');

      await axios.post(`${API_URL}/access-control/register-face/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      alert('✅ Hệ thống AI đã ghi nhận dữ liệu khuôn mặt thành công!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || '❌ Không thể trích xuất đặc trưng khuôn mặt. Vui lòng chụp lại rõ nét hơn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header - Phong cách SmartHouse AI */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mb-1">
               <ShieldCheck size={14} /> Định danh FaceID
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Cấp quyền ra vào</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cư dân: {user.fullName}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Camera Area */}
        <div className="p-10 flex flex-col items-center">
          <div className="relative group">
            <div className="w-64 h-64 rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-2xl relative bg-slate-900">
              {step === 'capture' ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <img src={imgSrc!} alt="Preview" className="w-full h-full object-cover scale-x-[-1]" />
              )}
              
              {/* Scan Line Effect - Tạo cảm giác AI đang quét */}
              {step === 'capture' && (
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-transparent h-1/2 w-full animate-scan-loop pointer-events-none border-t-2 border-blue-400"></div>
              )}
            </div>
            
            {/* Bo góc trang trí */}
            <div className="absolute -inset-2 border-2 border-blue-100 rounded-[3.5rem] pointer-events-none opacity-50"></div>
          </div>

          <p className="text-[11px] font-bold text-slate-400 text-center mt-10 mb-10 max-w-[280px] uppercase tracking-wide leading-relaxed">
            {step === 'capture' 
              ? "Giữ gương mặt trong khung hình, đảm bảo đủ ánh sáng để AI trích xuất dữ liệu." 
              : "Vui lòng xác nhận nếu ảnh chụp rõ nét để hoàn tất trích xuất đặc trưng FaceID."}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            {step === 'capture' ? (
              <button
                onClick={capture}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                <Camera size={18} /> Chụp ảnh mẫu
              </button>
            ) : (
              <>
                <button
                  onClick={() => setStep('capture')}
                  disabled={loading}
                  className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:border-slate-300 hover:text-slate-600"
                >
                  <RefreshCw size={18} /> Chụp lại
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-slate-900 hover:bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {loading ? "Đang trích xuất..." : "Xác nhận mẫu"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}