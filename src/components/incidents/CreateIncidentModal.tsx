import { useState, useRef } from 'react';
import { X, Loader2, AlertTriangle, UploadCloud, FileImage, Trash2, Film } from 'lucide-react';
import { IncidentPriority } from '@/services/incident.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>; // ⚠️ Đổi type thành FormData
}

export default function CreateIncidentModal({ isOpen, onClose, onSubmit }: Props) {
  const [loading, setLoading] = useState(false);
  
  // State form text
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: IncidentPriority.MEDIUM,
  });

  // State lưu danh sách file đã chọn
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý khi chọn file từ máy
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Gộp file mới vào danh sách cũ (cho phép chọn nhiều lần)
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  // Xóa file khỏi danh sách chờ
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Tạo FormData để gửi file
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('priority', formData.priority);

      // 2. Append từng file vào key 'files' (Khớp với Backend @UploadedFiles)
      selectedFiles.forEach((file) => {
        submitData.append('files', file);
      });

      // 3. Gửi lên
      await onSubmit(submitData);
      
      // 4. Reset form sau khi thành công
      setFormData({ title: '', description: '', priority: IncidentPriority.MEDIUM });
      setSelectedFiles([]);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" /> Báo cáo sự cố
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Tiêu đề */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Vấn đề gặp phải</label>
            <input
              required
              type="text"
              placeholder="Ví dụ: Bóng đèn nhà vệ sinh bị cháy..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-orange-100 outline-none"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Mô tả chi tiết</label>
            <textarea
              rows={3}
              placeholder="Mô tả thêm về tình trạng hư hỏng..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-orange-100 outline-none resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Mức độ ưu tiên */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Mức độ ưu tiên</label>
            <div className="flex gap-2">
              {[IncidentPriority.LOW, IncidentPriority.MEDIUM, IncidentPriority.HIGH].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p })}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase border transition-all ${
                    formData.priority === p
                      ? p === 'HIGH' ? 'bg-red-500 text-white border-red-500' : p === 'MEDIUM' ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-500 text-white border-slate-500'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p === 'HIGH' ? 'Khẩn cấp' : p === 'MEDIUM' ? 'Bình thường' : 'Thấp'}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Ảnh/Video */}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Hình ảnh / Video minh chứng</label>
            
            {/* Nút chọn file */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all group"
            >
              <div className="p-3 bg-slate-100 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 mb-2 transition-colors">
                 <UploadCloud size={24} />
              </div>
              <p className="text-xs font-bold text-slate-600">Bấm để tải ảnh hoặc video</p>
              <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ: JPG, PNG, MP4</p>
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>

            {/* Danh sách file đã chọn */}
            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {file.type.startsWith('video') ? <Film size={18} className="text-red-500 shrink-0"/> : <FileImage size={18} className="text-blue-500 shrink-0"/>}
                      <span className="text-xs font-medium text-slate-700 truncate">{file.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button 
                      onClick={() => removeFile(index)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
           <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-black uppercase rounded-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Gửi báo cáo ngay'}
          </button>
        </div>

      </div>
    </div>
  );
}