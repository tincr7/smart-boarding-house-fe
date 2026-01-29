import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- TYPES ---

export interface Room {
  id: number;
  roomNumber: string;
  price: string | number;
  area: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  image?: string;
  video?: string; // Bổ sung để đồng bộ với giao diện
  
  // DỨT ĐIỂM LỖI: Thêm description và utilities vào interface
  description?: string; 
  utilities: string[]; 
  
  branchId: number;
  createdAt: string;
  deletedAt?: string | Date | null; 
  branch?: {
    id: number;
    name: string;
    address: string;
  };
  contracts?: any[];
}

// DTO cho tạo mới & cập nhật
export interface CreateRoomDto {
  roomNumber: string;
  price: number;
  area: number;
  image?: string;
  video?: string;
  branchId: number;
  description?: string;
  utilities?: string[];
}

// --- METHODS ---

export const roomApi = {
  // 1. CẬP NHẬT: Nhận branchId để lọc theo chi nhánh
  getAll: async (branchId?: number) => {
    const response = await axiosInstance.get<Room[]>('/rooms', {
      params: { branchId }
    });
    return response.data;
  },
  
  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  create: async (data: CreateRoomDto) => {
    const response = await axiosInstance.post('/rooms', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateRoomDto>) => {
    const response = await axiosInstance.patch(`/rooms/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    return await axiosInstance.delete(`/rooms/${id}`);
  },

  // 2. NHÓM ROUTE THÙNG RÁC
  getDeleted: async (branchId?: number) => {
    const response = await axiosInstance.get<Room[]>('/rooms/deleted', {
      params: { branchId }
    });
    return response.data;
  },

  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/rooms/${id}/restore`);
    return response.data;
  },

  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/rooms/${id}/permanent`);
    return response.data;
  }
};