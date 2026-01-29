import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'ADMIN' | 'TENANT';
  faceDescriptor?: number[];
  
  // TRƯỜNG QUAN TRỌNG: Để dứt điểm lỗi FE
  branchId: number | null; 
  
  isActive: boolean; 
  deletedAt?: string | null;
  
  contracts?: {
    status: string;
    room?: {
      id: number;
      roomNumber: string;
      branchId?: number;
      branch?: { name: string };
    }
  }[];
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role?: string;
  branchId?: number; // Cho phép gán chi nhánh khi tạo user
}

export const userApi = {
  // 1. Lấy tất cả người dùng (Có hỗ trợ lọc theo chi nhánh)
  getAll: async (branchId?: number) => {
    const response = await axiosInstance.get<User[]>('/users', {
      params: { branchId }
    });
    return response.data;
  },

  // 2. Lấy profile người đang đăng nhập (Sẽ trả về branchId từ Token)
  getProfile: async () => {
    const response = await axiosInstance.get<User>('/users/profile');
    return response.data;
  },

  // 3. Cập nhật thông tin user
  update: async (id: number, data: any) => {
    const response = await axiosInstance.patch(`/users/${id}`, data);
    return response.data;
  },

  // 4. Khóa/Mở khóa tài khoản
  updateStatus: async (id: number, isActive: boolean) => {
    const response = await axiosInstance.patch(`/users/${id}/status`, { isActive });
    return response.data;
  },

  // 5. Tạo mới người dùng
  create: async (data: CreateUserDto) => {
    const response = await axiosInstance.post('/users', data);
    return response.data;
  },

  // 6. Xóa mềm
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },

  // 7. Lấy danh sách thùng rác (Có lọc theo chi nhánh)
  getDeleted: async (branchId?: number) => {
    const response = await axiosInstance.get<User[]>('/users/deleted', {
      params: { branchId }
    });
    return response.data;
  },

  // 8. Khôi phục dữ liệu
  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/users/${id}/restore`);
    return response.data;
  },

  // 9. Xóa vĩnh viễn
  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/users/${id}/permanent`);
    return response.data;
  },
};