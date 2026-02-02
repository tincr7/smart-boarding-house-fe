'use client';

import { useEffect, useState } from 'react';
import { incidentApi, Incident, IncidentStatus } from '@/services/incident.api';
import CreateIncidentModal from '@/components/incidents/CreateIncidentModal';
import { useAuth } from '@/context/AuthContext';
import Breadcrumbs from '@/components/shared/Breadcrumbs';
import { 
  Plus, Wrench, Clock, CheckCircle, 
  MapPin, User as UserIcon, 
  Play, XCircle, CheckSquare, 
  Trash2, Image as ImageIcon, Film // 👇 Thêm các icon mới
} from 'lucide-react';
import { format } from 'date-fns';

export default function IncidentsPage() {
  const { user, isAdmin } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');

  // 1. Tải dữ liệu
  const fetchIncidents = async () => {
    try {
      const data = await incidentApi.getAll(filter !== 'ALL' ? filter : undefined);
      setIncidents(data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchIncidents(); }, [filter]);

  // 2. Xử lý tạo mới
  const handleCreate = async (formData: FormData) => {
    try {
      await incidentApi.create(formData);
      setIsModalOpen(false);
      fetchIncidents();
      alert('Đã gửi báo cáo thành công!');
    } catch (error) { alert('Lỗi khi gửi báo cáo'); }
  };

  // 3. XỬ LÝ TRẠNG THÁI
  const handleChangeStatus = async (id: number, newStatus: IncidentStatus) => {
    if (!isAdmin) return;

    let confirmMsg = '';
    if (newStatus === IncidentStatus.PROCESSING) confirmMsg = 'Xác nhận TIẾP NHẬN yêu cầu này?';
    if (newStatus === IncidentStatus.DONE) confirmMsg = 'Xác nhận sự cố đã được KHẮC PHỤC XONG?';
    if (newStatus === IncidentStatus.CANCELLED) confirmMsg = 'Xác nhận TỪ CHỐI/HỦY báo cáo này?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await incidentApi.updateStatus(id, newStatus);
      fetchIncidents();
    } catch (error) { alert('Lỗi cập nhật trạng thái'); }
  };

  // 4. XỬ LÝ XÓA (MỚI)
  const handleDelete = async (id: number) => {
    if (!isAdmin) return;
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo này không?')) return;

    try {
      await incidentApi.delete(id);
      fetchIncidents();
      alert('Đã xóa thành công');
    } catch (error) {
      alert('Lỗi khi xóa báo cáo');
    }
  }

  // Helper: Kiểm tra đuôi file để biết là Video hay Ảnh
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i);
  }

  // Helper: Màu sắc trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="px-3 py-1 rounded-lg border text-[9px] font-black uppercase bg-yellow-50 text-yellow-600 border-yellow-100 flex items-center gap-1"><Clock size={10}/> Chờ xử lý</span>;
      case 'PROCESSING': return <span className="px-3 py-1 rounded-lg border text-[9px] font-black uppercase bg-blue-50 text-blue-600 border-blue-100 animate-pulse flex items-center gap-1"><Wrench size={10}/> Đang sửa chữa</span>;
      case 'DONE': return <span className="px-3 py-1 rounded-lg border text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1"><CheckCircle size={10}/> Hoàn thành</span>;
      case 'CANCELLED': return <span className="px-3 py-1 rounded-lg border text-[9px] font-black uppercase bg-slate-100 text-slate-400 border-slate-200 flex items-center gap-1"><XCircle size={10}/> Đã hủy</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'HIGH') return <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Khẩn cấp</span>;
    return <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">Bình thường</span>;
  };

  return (
    <div className="p-8 space-y-8">
      <div className="inline-flex items-center px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
        <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Báo cáo sự cố' }]} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">
            Sự cố & Bảo trì
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
            Trung tâm tiếp nhận và điều phối sửa chữa
          </p>
        </div>
        
        {!isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-200 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Plus size={16} /> Báo hỏng mới
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'PROCESSING', 'DONE'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${
              filter === s 
              ? 'bg-slate-900 text-white border-slate-900' 
              : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
            }`}
          >
            {s === 'ALL' ? 'Tất cả' : s === 'PENDING' ? 'Chờ xử lý' : s === 'PROCESSING' ? 'Đang sửa' : 'Hoàn thành'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {incidents.map((item) => (
          <div key={item.id} className="relative flex flex-col bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform group">
            
            {/* 🔴 NÚT XÓA (Chỉ hiện cho Admin - Nằm góc trên phải) */}
            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                className="absolute top-4 right-4 p-2 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100 z-10"
                title="Xóa báo cáo này"
              >
                <Trash2 size={16} />
              </button>
            )}

            {/* Header Card */}
            <div className="flex justify-between items-start mb-4 pr-10"> {/* pr-10 để tránh đè nút xóa */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${item.status === 'DONE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {item.status === 'DONE' ? <CheckCircle size={20} /> : <Wrench size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-1">{item.title}</h3>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                    <Clock size={10} /> {format(new Date(item.createdAt), 'dd/MM HH:mm')}
                  </p>
                </div>
              </div>
            </div>

            {/* Badges Priority */}
            <div className="mb-3">
               {getPriorityBadge(item.priority)}
            </div>

            {/* Nội dung */}
            <div className="bg-slate-50 p-4 rounded-2xl mb-4 flex-1">
              <p className="text-sm text-slate-600 line-clamp-3 italic">"{item.description || 'Không có mô tả chi tiết'}"</p>
              
              {/* 📷 KHU VỰC HIỂN THỊ ẢNH/VIDEO */}
              {item.images && item.images.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/50">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Minh chứng đính kèm:</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {item.images.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 group/media hover:scale-105 transition-transform"
                      >
                        {isVideo(url) ? (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white">
                             <Film size={20} />
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity">
                                <Play size={12} fill="white" />
                             </div>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={url} alt="incident" className="w-full h-full object-cover" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Thông tin phòng & Người báo */}
            <div className="flex items-center justify-between border-t border-slate-50 pt-4 pb-4">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
                  <MapPin size={10} /> P.{item.room?.roomNumber || '---'}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-800">
                  <UserIcon size={10} /> {item.user?.fullName}
                </span>
              </div>
              {renderStatusBadge(item.status)}
            </div>

            {/* ACTION BUTTONS */}
            {isAdmin && (item.status === 'PENDING' || item.status === 'PROCESSING') && (
               <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                  {item.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => handleChangeStatus(item.id, IncidentStatus.PROCESSING)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play size={12} fill="currentColor"/> Tiếp nhận
                      </button>
                      <button 
                        onClick={() => handleChangeStatus(item.id, IncidentStatus.CANCELLED)}
                        className="px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center"
                        title="Từ chối"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}

                  {item.status === 'PROCESSING' && (
                    <button 
                      onClick={() => handleChangeStatus(item.id, IncidentStatus.DONE)}
                      className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                    >
                      <CheckSquare size={12} /> Xác nhận xong
                    </button>
                  )}
               </div>
            )}
          </div>
        ))}
      </div>

      {incidents.length === 0 && (
        <div className="text-center py-20 opacity-50">
          <Wrench size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-sm font-bold text-slate-400 uppercase">Hệ thống đang hoạt động tốt</p>
        </div>
      )}

      {/* CHÚ Ý: Đã đổi handleCreate nhận FormData */}
      <CreateIncidentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreate} />
    </div>
  );
}