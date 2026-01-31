'use client';

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { X, ShieldCheck, Lock, LockKeyholeOpen, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

// 1. CẬP NHẬT INTERFACE: Đã thêm deviceId để dứt điểm lỗi TS
interface FaceVerifyModalProps {
  user: { id: number; fullName: string } | null;
  deviceId: string; // NHẬN DEVICE ID TỪ TENANTS PAGE
  onClose: () => void;
}

export default function FaceVerifyModal({ user, deviceId, onClose }: FaceVerifyModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [gateStatus, setGateStatus] = useState<'locked' | 'open' | 'error'>('locked');
  
  const initialMessage = user 
    ? `HỆ THỐNG ĐANG CHỜ ${user.fullName.toUpperCase()} XÁC THỰC` 
    : "VUI LÒNG NHÌN VÀO CAMERA ĐỂ NHẬN DIỆN CƯ DÂN";
    
  const [message, setMessage] = useState(initialMessage);

  const playSpeech = (text: string, isWarning: boolean = false) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel(); 
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'vi-VN';
      msg.pitch = isWarning ? 0.8 : 1.1;
      msg.rate = isWarning ? 1.0 : 1.2;
      window.speechSynthesis.speak(msg);
    }
  };

  const handleVerify = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    
    setLoading(true);
    setMessage("AI ĐANG ĐỐI SOÁT DỮ LIỆU ĐA CHI NHÁNH...");
    
    try {
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('file', blob, 'verify.jpg');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = Cookies.get('access_token');

      // 2. DỨT ĐIỂM LOGIC GỬI HEADER: Truyền x-device-id để xác định cơ sở
      const res = await axios.post(`${API_URL}/access-control/verify-face`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-device-id': deviceId, // MẢNH GHÉP QUAN TRỌNG NHẤT
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        const identifiedName = res.data.fullName || "CƯ DÂN";
        const welcomeMsg = `XÁC THỰC THÀNH CÔNG. CHÀO MỪNG ${identifiedName} VỀ NHÀ!`;
        
        setGateStatus('open');
        setMessage(welcomeMsg);
        playSpeech(welcomeMsg, false);
        
        // Tự động đóng sau khi hoàn tất xác thực
        setTimeout(onClose, 4000);
      } else {
        throw new Error(res.data.message || 'DỮ LIỆU KHÔNG KHỚP');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "CẢNH BÁO! PHÁT HIỆN NGƯỜI LẠ XÂM NHẬP!";
      playSpeech(errorMsg, true); 
      setGateStatus('error');
      setMessage(errorMsg.toUpperCase());
      
      setTimeout(() => {
        setGateStatus('locked');
        setMessage(initialMessage);
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-[3.5rem] shadow-2xl max-w-md w-full overflow-hidden border-4 transition-all duration-500 ${
        gateStatus === 'error' ? 'border-red-500' : 
        gateStatus === 'open' ? 'border-emerald-500' : 'border-slate-100'
      }`}>
        
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${gateStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.2em] italic leading-none">SmartHouse Security</h2>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Device: {deviceId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all text-slate-300"><X size={20}/></button>
        </div>

        <div className="p-12 flex flex-col items-center">
          {/* Camera Frame */}
          <div className={`relative w-64 h-64 rounded-[3rem] overflow-hidden border-[12px] bg-slate-900 mb-10 shadow-2xl transition-all duration-700 ${
            gateStatus === 'error' ? 'border-red-600 rotate-3' : 
            gateStatus === 'open' ? 'border-emerald-500 scale-90' : 'border-slate-50 shadow-slate-200'
          }`}>
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover scale-x-[-1]" />
            
            {loading && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-full h-1.5 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan-line"></div>
              </div>
            )}
            
            {gateStatus === 'open' && (
              <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center animate-fade-in backdrop-blur-[2px]">
                <CheckCircle2 size={100} className="text-white drop-shadow-2xl" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className={`p-8 rounded-[2.5rem] transition-all duration-1000 shadow-xl ${
              gateStatus === 'open' ? 'bg-emerald-500 text-white rotate-[360deg]' : 
              gateStatus === 'error' ? 'bg-red-500 text-white animate-bounce' : 'bg-slate-900 text-white'
            }`}>
              {gateStatus === 'open' ? <LockKeyholeOpen size={40} strokeWidth={3} /> : 
               gateStatus === 'error' ? <AlertCircle size={40} strokeWidth={3} /> : 
               <Lock size={40} strokeWidth={3} />}
            </div>
            
            <div className="min-h-[80px] flex items-center px-6 text-center">
               <p className={`font-black text-sm uppercase tracking-tight leading-tight italic transition-colors duration-500 ${
                 gateStatus === 'error' ? 'text-red-600' : 'text-slate-800'
               }`}>{message}</p>
            </div>
          </div>

          <button 
            onClick={handleVerify} 
            disabled={loading || gateStatus === 'open'} 
            className={`mt-10 w-full py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 shadow-2xl ${
              gateStatus === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-200'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 
             <>{gateStatus === 'error' ? 'Thử lại ngay' : 'Kích hoạt quét FaceID'} <ShieldCheck size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}