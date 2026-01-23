'use client';

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { X, ShieldCheck, Lock, LockKeyholeOpen, Loader2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

// 1. Định nghĩa Interface để nhận dữ liệu từ TenantsPage
interface FaceVerifyModalProps {
  user: { id: number; fullName: string };
  onClose: () => void;
}

export default function FaceVerifyModal({ user, onClose }: FaceVerifyModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [gateStatus, setGateStatus] = useState<'locked' | 'open' | 'error'>('locked');
  
  // Sử dụng tên cư dân ngay từ đầu để tăng tính cá nhân hóa
  const [message, setMessage] = useState(`Xin chào ${user.fullName}, vui lòng xác thực khuôn mặt.`);

  const playSpeech = (text: string) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    window.speechSynthesis.speak(msg);
  };

  const handleVerify = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    
    setLoading(true);
    try {
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('file', blob, 'verify.jpg');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = Cookies.get('access_token');

      // Gửi yêu cầu xác thực tới NestJS
      const res = await axios.post(`${API_URL}/access-control/verify-face`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.data.status === 'success') {
        setGateStatus('open');
        const welcomeMsg = `Xác thực thành công. Chào mừng ${user.fullName} về nhà!`;
        setMessage(welcomeMsg);
        playSpeech(welcomeMsg);

        // Đóng modal sau khi cửa đã "mở" được 4 giây
        setTimeout(onClose, 4000);
      }
    } catch (error: any) {
      setGateStatus('error');
      const errorMsg = error.response?.data?.message || 'Không nhận diện được khuôn mặt!';
      setMessage(errorMsg);
      playSpeech(errorMsg);
      
      // Sau 3 giây trả về trạng thái khóa để có thể thử lại
      setTimeout(() => {
        setGateStatus('locked');
        setMessage(`Thử lại: Vui lòng nhìn thẳng vào camera, ${user.fullName}.`);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-blue-600" /> Hệ thống mở cửa AI
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Camera Area */}
          <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-slate-800 bg-black mb-6">
            <Webcam 
              ref={webcamRef} 
              audio={false} 
              screenshotFormat="image/jpeg" 
              className="w-full h-full object-cover scale-x-[-1]" 
            />
            
            {/* Hiệu ứng Vạch Laser Quét */}
            {loading && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute w-full h-[3px] bg-green-500 shadow-[0_0_15px_green] animate-scan-line"></div>
              </div>
            )}
          </div>

          {/* Minh họa trạng thái Cổng & Thông báo */}
          <div className={`flex flex-col items-center transition-all duration-500 ${
            gateStatus === 'open' ? 'text-green-600 scale-110' : 
            gateStatus === 'error' ? 'text-red-600' : 'text-slate-400'
          }`}>
            {gateStatus === 'open' ? (
              <LockKeyholeOpen size={60} className="animate-bounce" />
            ) : (
              <Lock size={60} />
            )}
            <p className="mt-4 font-bold text-lg text-center leading-tight">
              {message}
            </p>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || gateStatus === 'open'}
            className="mt-8 w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Xác nhận mở cửa"}
          </button>
        </div>
      </div>
    </div>
  );
}