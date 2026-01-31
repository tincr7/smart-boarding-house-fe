import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Contract {
  id: number;
  startDate: string;
  endDate?: string;
  deposit: number | string;
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
  scanImage?: string;
  userId: number;
  roomId: number;
  branchId: number;
  createdAt?: string;
  deletedAt?: string | null;
  
  user?: {
    id: number;
    fullName: string;
    phone: string;
    email: string;
    avatar?: string;
  };
  room?: {
    id: number;
    roomNumber: string;
    price: number | string;
    branchId: number;
    branch?: { id: number; name: string; address?: string };
  };
  branch?: {
    id: number;
    name: string;
    address?: string;
  };
}

export interface CreateContractDto {
  roomId: number;
  userId: number;
  branchId: number;
  startDate: string;
  endDate?: string;
  deposit: number;
  scanImage?: string;
}

export const contractApi = {
  // 1. Lấy danh sách chính (Active + Terminated)
  getAll: async (userId?: number, branchId?: number) => {
    const response = await axiosInstance.get<Contract[]>('/contracts', {
      params: { userId, branchId: branchId ? Number(branchId) : undefined }
    });
    return response.data;
  },

  // 2. Lấy chi tiết
  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  // 3. Tạo mới
  create: async (data: CreateContractDto) => {
    const payload = {
      ...data,
      roomId: Number(data.roomId),
      userId: Number(data.userId),
      branchId: Number(data.branchId),
      deposit: Number(data.deposit)
    };
    const response = await axiosInstance.post('/contracts', payload);
    return response.data;
  },

  // 4. Cập nhật
  update: async (id: number, data: any) => {
    const response = await axiosInstance.patch(`/contracts/${id}`, data);
    return response.data;
  },

  // 5. Thanh lý (Nghiệp vụ trả phòng)
  terminate: async (id: number) => {
    const response = await axiosInstance.patch(`/contracts/${id}/terminate`);
    return response.data;
  },

  // 6. Xóa mềm (Đưa vào thùng rác)
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/contracts/${id}`);
    return response.data;
  },

  // --- CÁC HÀM CÒN THIẾU ĐỂ FIX LỖI ---

  // 7. Lấy danh sách thùng rác
  getDeleted: async (branchId?: number) => {
    const response = await axiosInstance.get<Contract[]>('/contracts/deleted', {
      params: { branchId: branchId ? Number(branchId) : undefined }
    });
    return response.data;
  },

  // 8. Khôi phục từ thùng rác
  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/contracts/${id}/restore`);
    return response.data;
  },

  // 9. Xóa vĩnh viễn
  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/contracts/${id}/permanent`);
    return response.data;
  }
};