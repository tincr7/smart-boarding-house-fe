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
  endDate: string;
  deposit: string | number;
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED'; 
  scanImage?: string;
  userId: number;
  roomId: number;
  createdAt?: string;
  // THÊM TRƯỜNG NÀY ĐỂ HỖ TRỢ XÓA MỀM
  deletedAt?: string | Date | null; 
  user: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    identityCard?: string;
    avatar?: string;
  };
  room: {
    id: number;
    roomNumber: string;
    price: string | number;
    area?: number;
    image?: string;
    branchId?: number;
  };
}

export interface CreateContractDto {
  roomId: number;
  userId: number;
  startDate: string;
  endDate: string;
  deposit: number;
  scanImage?: string;
}

export const contractApi = {
  getAll: async () => {
    const response = await axiosInstance.get<Contract[]>('/contracts');
    return response.data;
  },

  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  create: async (data: CreateContractDto) => {
    const response = await axiosInstance.post('/contracts', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateContractDto>) => {
    const response = await axiosInstance.patch(`/contracts/${id}`, data);
    return response.data;
  },

  // SỬA HÀM NÀY: Dùng delete để thống nhất với các Page khác
  delete: async (id: number) => {
    // Gọi method DELETE lên backend. Backend sẽ thực hiện Soft Delete
    const response = await axiosInstance.delete(`/contracts/${id}`);
    return response.data;
  },

  // Giữ lại terminate nếu Giang muốn dùng logic kết thúc sớm mà không ẩn bản ghi
  terminate: async (id: number) => {
    const response = await axiosInstance.patch(`/contracts/${id}/terminate`);
    return response.data;
  },
  getDeleted: async () => {
    const response = await axiosInstance.get<Contract[]>('/contracts/deleted');
    return response.data;
  },

  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/contracts/${id}/restore`);
    return response.data;
  },

  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/contracts/${id}/permanent`);
    return response.data;
  },
};