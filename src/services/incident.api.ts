import axios from 'axios';
import Cookies from 'js-cookie'; // 👈 Import cái này để lấy token từ Cookie

// Backend chạy port 3001 (theo log bạn gửi)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// 1. Tạo instance chung (Giống bên invoice.api.ts)
const axiosInstance = axios.create({ baseURL: API_URL });

// 2. Tự động gắn Token vào mọi request (Dùng Cookie)
axiosInstance.interceptors.request.use((config) => {
  // ⚠️ Quan trọng: Tên cookie phải khớp với bên Login (thường là 'access_token' hoặc 'token')
  const token = Cookies.get('access_token') || Cookies.get('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- TYPES & ENUMS ---

export enum IncidentStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum IncidentPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Incident {
  id: number;
  title: string;
  description?: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  images: string[];
  createdAt: string;
  room?: {
    roomNumber: string;
    branch?: { name: string };
  };
  user?: {
    fullName: string;
    phone?: string;
    avatar?: string;
  };
}

// --- API METHODS ---

export const incidentApi = {
  // Lấy danh sách
  getAll: async (status?: string) => {
    const params = status ? { status } : {};
    // 👇 Dùng axiosInstance thay vì axios thường
    const response = await axiosInstance.get<Incident[]>('/incidents', { params });
    return response.data;
  },

  // Tạo mới
create: async (data: FormData) => {
    // Khi gửi FormData, Axios sẽ tự động nhận diện và thêm header 'multipart/form-data'
    const response = await axiosInstance.post('/incidents', data, {
      headers: {
        'Content-Type': 'multipart/form-data', // Thêm dòng này để chắc chắn
      },
    });
    return response.data;
  },

  // Cập nhật trạng thái
  updateStatus: async (id: number, status: IncidentStatus) => {
    const response = await axiosInstance.patch(`/incidents/${id}`, { status });
    return response.data;
  },

  // Xóa
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/incidents/${id}`);
    return response.data;
  },
};