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

// --- TYPES (Chỉ định nghĩa 1 lần duy nhất) ---

export interface ChartData {
  name: string;
  total: number;
}

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
    revenue: number;      // Doanh thu thực tế (đã thu)
    debt: number;         // Công nợ (chưa thu)
    totalExpected: number;// Tổng dự kiến
    chartData: ChartData[]; // Dữ liệu cho biểu đồ cột
  };
}

// --- METHODS ---
export const statsApi = {
  getDashboardStats: async () => {
    // Lưu ý: Đường dẫn phải khớp với Controller ở Backend (@Get('dashboard'))
    const response = await axiosInstance.get<DashboardData>('/statistics/dashboard');
    return response.data;
  },
};