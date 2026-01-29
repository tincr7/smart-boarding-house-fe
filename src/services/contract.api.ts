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
    // BỔ SUNG TRƯỜNG NÀY ĐỂ DỨT ĐIỂM LỖI TRANG TENANTS
    branch?: {
      id: number;
      name: string;
      address: string;
    };
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
  // CẬP NHẬT: Cho phép truyền branchId để lọc đa chi nhánh
  getAll: async (userId?: number, branchId?: number) => {
    const response = await axiosInstance.get<Contract[]>('/contracts', {
      params: { userId, branchId }
    });
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

  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/contracts/${id}`);
    return response.data;
  },

  terminate: async (id: number) => {
    const response = await axiosInstance.patch(`/contracts/${id}/terminate`);
    return response.data;
  },

  // CẬP NHẬT: Thùng rác cũng cần lọc theo chi nhánh
  getDeleted: async (branchId?: number) => {
    const response = await axiosInstance.get<Contract[]>('/contracts/deleted', {
      params: { branchId }
    });
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