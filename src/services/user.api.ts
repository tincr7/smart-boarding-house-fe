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
  // Relationship để lấy phòng đang ở
  contracts?: {
    status: string;
    room?: {
      id: number;
      roomNumber: string;
      branchId?: number;
    }
  }[];
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  phone: string;
  password?: string; // Mật khẩu mặc định khi tạo mới
  role?: string;
}

export const userApi = {
  getAll: async () => {
    // Thường backend sẽ hỗ trợ ?include=contracts để lấy kèm hợp đồng
    const response = await axiosInstance.get<User[]>('/users');
    return response.data;
  },

  // 1. Lấy thông tin cá nhân người đang đăng nhập
  getProfile: async () => {
    const response = await axiosInstance.get<User>('/users/profile');
    return response.data;
  },

  // 2. Cập nhật thông tin user (dựa theo ID)
  update: async (id: number, data: any) => {
    const response = await axiosInstance.patch(`/users/${id}`, data);
    return response.data;
  },

  create: async (data: CreateUserDto) => {
    const response = await axiosInstance.post('/users', data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/users/${id}`);
    return response.data;
  },
  // Lấy danh sách đã xóa mềm
  getDeleted: async () => {
    const response = await axiosInstance.get<User[]>('/users/deleted');
    return response.data;
  },

  // Khôi phục dữ liệu
  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/users/${id}/restore`);
    return response.data;
  },

  // Xóa vĩnh viễn (Hard Delete)
  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/users/${id}/permanent`);
    return response.data;
  }
};