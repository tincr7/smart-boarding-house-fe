import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Room {
  id: number;
  roomNumber: string;
  price: number | string;
  area: number;
  image?: string;
  status?: 'AVAILABLE' | 'RENTED' | 'OCCUPIED';
  branchId: number;
  description?: string;
}

// DTO cho tạo mới
export interface CreateRoomDto {
  roomNumber: string;
  price: number;
  area: number;
  image?: string;
  branchId: number;
}

export const roomApi = {
  getAll: async () => {
    const response = await axiosInstance.get<Room[]>('/rooms');
    return response.data;
  },
  
  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Room>(`/rooms/${id}`);
    return response.data;
  },

  // SỬA: Nhận JSON Object
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
  }
};