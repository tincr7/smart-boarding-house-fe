import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm token vào header mỗi lần gọi
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- TYPES ---
export interface DashboardData {
  overview: {
    branches: number;
    rooms: {
      total: number;
      available: number;
      rented: number;
      occupancyRate: number;
    };
    tenants: number;
  };
  finance: {
    month: number;
    year: number;
    revenue: number;      // Doanh thu thực tế
    debt: number;         // Công nợ
    totalExpected: number;// Tổng dự kiến
  };
}

// --- METHODS ---
export const statsApi = {
  getDashboardStats: async () => {
    const response = await axiosInstance.get<DashboardData>('/statistics/dashboard');
    return response.data;
  },
};