import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor: Tự động thêm Token vào mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Branch {
  id: number;
  name: string;
  address: string;
  manager?: string; // Thêm dấu ? để không bắt buộc
  image?: string;
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

export const branchApi = {
  // 1. Lấy tất cả chi nhánh (Dùng cho dropdown và trang quản lý tổng)
  getAll: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches');
    return response.data;
  },

  // 2. Lấy chi tiết chi nhánh
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

  // 5. Xóa mềm (Đưa vào thùng rác)
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/branches/${id}`);
    return response.data;
  },

  // 6. Lấy danh sách đã xóa (Thùng rác)
  getDeleted: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches/deleted');
    return response.data;
  },

  // 7. Khôi phục chi nhánh
  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/branches/${id}/restore`);
    return response.data;
  },

  // 8. Xóa vĩnh viễn
  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/branches/${id}/permanent`);
    return response.data;
  },
};