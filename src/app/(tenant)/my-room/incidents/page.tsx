'use client';

import { useEffect, useState } from 'react';
import { incidentApi, Incident } from '@/services/incident.api';
import CreateIncidentModal from '@/components/incidents/CreateIncidentModal';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { 
  Plus, Wrench, Clock, CheckCircle, AlertTriangle, 
  MapPin 
} from 'lucide-react';
import { format } from 'date-fns';

export default function TenantIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Tải dữ liệu (API đã tự lọc theo User đang đăng nhập)
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await incidentApi.getAll();
      setIncidents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Xử lý tạo mới
  const handleCreate = async (data: any) => {
    try {
      await incidentApi.create(data);
      setIsModalOpen(false);
      fetchData(); // Reload danh sách
      alert('Đã gửi yêu cầu thành công!');
    } catch (error) {
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  // 3. Hàm render trạng thái (Badge màu sắc)
  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100 flex items-center gap-1"><Clock size={12}/> Chờ tiếp nhận</span>;
      case 'PROCESSING':
        return <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 flex items-center gap-1 animate-pulse"><Wrench size={12}/> Đang xử lý</span>;
      case 'DONE':
        return <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1"><CheckCircle size={12}/> Đã xong</span>;
      case 'CANCELLED':
        return <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1"><AlertTriangle size={12}/> Đã hủy</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & BREADCRUMBS */}
      <div className="flex flex-col gap-4">
        <div className="inline-flex">
           {/* Breadcrumb trỏ về trang My Room */}
           <Breadcrumbs items={[{ label: 'Phòng của tôi', href: '/my-room' }, { label: 'Báo cáo sự cố' }]} />
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
              Báo cáo sự cố
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
              Gửi yêu cầu sửa chữa cho quản lý
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white p-3 md:px-6 md:py-3 rounded-xl shadow-lg shadow-slate-300 hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} /> <span className="hidden md:inline font-bold uppercase text-xs">Gửi yêu cầu</span>
          </button>
        </div>
      </div>

      {/* DANH SÁCH (GRID CARD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="col-span-2 text-center py-10 text-slate-400 text-xs uppercase font-bold">Đang tải dữ liệu...</p>
        ) : incidents.length > 0 ? (
          incidents.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.status === 'DONE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {item.status === 'DONE' ? <CheckCircle size={20} /> : <Wrench size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{item.title}</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> {format(new Date(item.createdAt), 'dd/MM/yyyy')}
                    </span>
                  </div>
                </div>
                {renderStatus(item.status)}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl mb-3">
                <p className="text-xs text-slate-600 italic line-clamp-2">
                  "{item.description || 'Không có mô tả'}"
                </p>
              </div>

              <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                    <MapPin size={12} />
                    {item.room ? `Phòng ${item.room.roomNumber}` : 'Chưa xác định'}
                 </div>
                 {item.priority === 'HIGH' && (
                   <span className="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full uppercase">Khẩn cấp</span>
                 )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl">
             <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
               <CheckCircle size={24} />
             </div>
             <p className="text-slate-400 text-xs font-bold uppercase">Bạn chưa gửi báo cáo nào</p>
          </div>
        )}
      </div>

      <CreateIncidentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleCreate} 
      />
    </div>
  );
}