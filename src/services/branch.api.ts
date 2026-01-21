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
  manager: string;
  image?: string;
}

export interface CreateBranchDto {
  name: string;
  address: string;
  manager: string;
  image?: string;
}

export const branchApi = {
  getAll: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches');
    return response.data;
  },
  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Branch>(`/branches/${id}`);
    return response.data;
  },

  // SỬA: Nhận object JSON thay vì FormData
  create: async (data: CreateBranchDto) => {
    const response = await axiosInstance.post('/branches', data);
    return response.data;
  },

  // SỬA: Nhận object JSON
  update: async (id: number, data: Partial<CreateBranchDto>) => {
    const response = await axiosInstance.patch(`/branches/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/branches/${id}`);
    return response.data;
  }
};