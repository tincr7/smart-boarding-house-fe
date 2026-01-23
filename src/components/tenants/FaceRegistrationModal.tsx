'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { X, Camera, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios'; // Hoặc dùng axiosInstance của bạn
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

  // Cấu hình Camera
  const videoConstraints = {
    width: 720,
    height: 720,
    facingMode: "user"
  };

  // 1. Hàm chụp ảnh
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImgSrc(imageSrc);
      setStep('preview');
    }
  }, [webcamRef]);

  // 2. Hàm gửi ảnh lên Backend
  const handleRegister = async () => {
    if (!imgSrc) return;
    setLoading(true);

    try {
      // Chuyển đổi base64 từ webcam sang file Blob
      const blob = await fetch(imgSrc).then((res) => res.blob());
      const file = new File([blob], `face_${user.id}.jpg`, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('file', file);

      // Gọi API NestJS (Sử dụng URL từ môi trường của bạn)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smart-rental-be.onrender.com';
      const token = Cookies.get('access_token');

      await axios.post(`${API_URL}/access-control/register-face/${user.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      alert('✅ Đăng ký khuôn mặt thành công!');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || '❌ Lỗi khi đăng ký khuôn mặt. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Đăng ký khuôn mặt</h2>
            <p className="text-xs text-slate-500">Người thuê: {user.fullName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative w-72 h-72 rounded-full overflow-hidden border-4 border-blue-500 shadow-inner bg-slate-100 mb-6">
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
            
            {/* Overlay khung tròn hướng dẫn */}
            {step === 'capture' && (
              <div className="absolute inset-0 border-[20px] border-black/10 pointer-events-none rounded-full"></div>
            )}
          </div>

          <p className="text-sm text-slate-500 text-center mb-8 max-w-[280px]">
            {step === 'capture' 
              ? "Hãy nhìn thẳng vào camera và đảm bảo khuôn mặt nằm trong vòng tròn." 
              : "Kiểm tra lại ảnh. Nếu rõ nét, hãy nhấn Xác nhận."}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full px-4">
            {step === 'capture' ? (
              <button
                onClick={capture}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
              >
                <Camera size={20} /> Chụp ảnh
              </button>
            ) : (
              <>
                <button
                  onClick={() => setStep('capture')}
                  disabled={loading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw size={18} /> Chụp lại
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                  {loading ? "Đang lưu..." : "Xác nhận"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}