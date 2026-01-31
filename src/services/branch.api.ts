import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động đính kèm JWT Token vào Header cho mọi yêu cầu
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- TYPES ---

export interface Device {
  id: string;   // Ví dụ: 'WEB_CAM_GIANG'
  name: string; // Ví dụ: 'Gate AI - Cầu Giấy'
  type: string; // Ví dụ: 'CAMERA'
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  manager?: string;
  image?: string;
  // QUAN TRỌNG: Danh sách thiết bị để phục vụ FaceID đa chi nhánh
  devices?: Device[]; 
  _count?: {
    rooms: number;
    users: number;
  };
}

export interface CreateBranchDto {
  name: string;
  address: string;
  manager: string;
  image?: string;
}

// --- API METHODS ---

export const branchApi = {
  /**
   * 1. Lấy tất cả chi nhánh
   * Backend cần trả về kèm theo quan hệ 'devices'
   */
  getAll: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches');
    return response.data;
  },

  /**
   * 2. Lấy chi tiết một chi nhánh (Kèm theo danh sách thiết bị chi tiết)
   */
  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  // 3. Tạo chi nhánh mới
  create: async (data: CreateBranchDto) => {
    const response = await axiosInstance.post('/branches', data);
    return response.data;
  },

  // 4. Cập nhật thông tin chi nhánh
  update: async (id: number, data: Partial<CreateBranchDto>) => {
    const response = await axiosInstance.patch(`/branches/${id}`, data);
    return response.data;
  },

  // 5. Xóa chi nhánh (Soft Delete)
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/branches/${id}`);
    return response.data;
  },

  // 6. Quản lý Thùng rác (Chi nhánh đã xóa)
  getDeleted: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches/deleted');
    return response.data;
  },

  // 7. Khôi phục từ Thùng rác
  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/branches/${id}/restore`);
    return response.data;
  },

  // 8. Xóa vĩnh viễn khỏi CSDL
  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/branches/${id}/permanent`);
    return response.data;
  },
};