'use client';

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { X, ShieldCheck, Lock, LockKeyholeOpen, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';

interface FaceVerifyModalProps {
  user: { id: number; fullName: string } | null;
  onClose: () => void;
}

export default function FaceVerifyModal({ user, onClose }: FaceVerifyModalProps) {
  const webcamRef = useRef<Webcam>(null);
  const [loading, setLoading] = useState(false);
  const [gateStatus, setGateStatus] = useState<'locked' | 'open' | 'error'>('locked');
  
  const initialMessage = user 
    ? `HỆ THỐNG ĐANG CHỜ ${user.fullName.toUpperCase()} XÁC THỰC` 
    : "VUI LÒNG NHÌN VÀO CAMERA ĐỂ NHẬN DIỆN CƯ DÂN";
    
  const [message, setMessage] = useState(initialMessage);

  const playSpeech = (text: string, isWarning: boolean = false) => {
    window.speechSynthesis.cancel(); 
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'vi-VN';
    msg.pitch = isWarning ? 0.8 : 1.1;
    msg.rate = isWarning ? 1.0 : 1.2;
    window.speechSynthesis.speak(msg);
  };

  const handleVerify = async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    
    setLoading(true);
    setMessage("AI ĐANG ĐỐI SOÁT DỮ LIỆU...");
    
    try {
      const blob = await fetch(imageSrc).then(res => res.blob());
      const formData = new FormData();
      formData.append('file', blob, 'verify.jpg');

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const token = Cookies.get('access_token');

      const res = await axios.post(`${API_URL}/access-control/verify-face`, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.data.status === 'success' || res.data.user) {
        const identifiedName = res.data.user?.fullName || "CƯ DÂN";
        const welcomeMsg = `XÁC THỰC THÀNH CÔNG. CHÀO MỪNG ${identifiedName} VỀ NHÀ!`;
        
        setGateStatus('open');
        setMessage(welcomeMsg);
        playSpeech(welcomeMsg, false);
        
        // Tự động đóng modal sau 4.5s để demo cửa đóng lại
        setTimeout(onClose, 4500);
      } else {
        throw new Error('CẢNH BÁO! PHÁT HIỆN NGƯỜI LẠ.');
      }
    } catch (error: any) {
      const errorMsg = "CẢNH BÁO! DỮ LIỆU KHÔNG KHỚP. NGƯỜI LẠ XÂM NHẬP!";
      playSpeech(errorMsg, true); 
      setGateStatus('error');
      setMessage(errorMsg);
      
      setTimeout(() => {
        setGateStatus('locked');
        setMessage(initialMessage);
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
      <div className={`bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border-2 transition-all duration-500 ${
        gateStatus === 'error' ? 'border-red-500 animate-shake' : 
        gateStatus === 'open' ? 'border-emerald-500' : 'border-slate-800'
      }`}>
        
        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${gateStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <ShieldCheck size={18} />
            </div>
            <h2 className="font-black text-slate-800 uppercase text-[10px] tracking-[0.2em]">SmartHouse AI Security</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><X size={20}/></button>
        </div>

        <div className="p-10 flex flex-col items-center">
          {/* Camera Frame */}
          <div className={`relative w-64 h-64 rounded-full overflow-hidden border-[10px] bg-slate-900 mb-10 shadow-2xl transition-all duration-500 ${
            gateStatus === 'error' ? 'border-red-600' : 
            gateStatus === 'open' ? 'border-emerald-500 scale-95' : 'border-slate-100'
          }`}>
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover scale-x-[-1]" />
            
            {/* Scan Animation */}
            {loading && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-full h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>
              </div>
            )}
            
            {/* Open Overlay */}
            {gateStatus === 'open' && (
              <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center animate-fade-in">
                <CheckCircle2 size={80} className="text-white drop-shadow-lg" />
              </div>
            )}
          </div>

          {/* Status Icon & Message */}
          <div className={`flex flex-col items-center gap-6 transition-all duration-500`}>
            <div className={`p-6 rounded-[2rem] transition-all duration-700 ${
              gateStatus === 'open' ? 'bg-emerald-50 text-emerald-600 rotate-[360deg]' : 
              gateStatus === 'error' ? 'bg-red-50 text-red-600 animate-bounce' : 'bg-slate-50 text-slate-300'
            }`}>
              {gateStatus === 'open' ? <LockKeyholeOpen size={48} strokeWidth={2.5} /> : 
               gateStatus === 'error' ? <AlertCircle size={48} strokeWidth={2.5} /> : 
               <Lock size={48} strokeWidth={2.5} />}
            </div>
            
            <div className="min-h-[60px] flex items-center px-4 text-center">
               <p className={`font-black text-sm uppercase tracking-tight leading-tight transition-colors duration-500 ${
                 gateStatus === 'error' ? 'text-red-700' : 'text-slate-800'
               }`}>{message}</p>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleVerify} 
            disabled={loading || gateStatus === 'open'} 
            className={`mt-10 w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 ${
              gateStatus === 'error' ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-blue-600'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 
             <>{gateStatus === 'error' ? 'Thử lại ngay' : 'Kích hoạt quét FaceID'} <ShieldCheck size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}