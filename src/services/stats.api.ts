import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- TYPES ---

export interface ChartData {
  name: string;
  total: number;
}

// MỚI: Định nghĩa kiểu dữ liệu cho Chi nhánh
export interface Branch {
  id: number;
  name: string;
  address: string;
  manager: string;
}

export interface AccessLog {
  id: number;
  method: 'FACE_ID' | 'FINGERPRINT';
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  createdAt: string;
  branchName?: string; 
  user?: {
    fullName: string;
    roomNumber: string;
  };
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
    revenue: number;
    debt: number;
    totalExpected: number;
    chartData: ChartData[];
  };
}

// --- METHODS ---
export const statsApi = {
  // 1. Lấy dữ liệu thống kê tổng quan (Có lọc theo chi nhánh)
  getDashboardStats: async (branchId?: number) => {
    const response = await axiosInstance.get<DashboardData>('/statistics/dashboard', {
      params: { branchId }
    });
    return response.data;
  },

  // 2. Lấy nhật ký ra vào (Lọc theo chi nhánh cho Admin cơ sở)
  getRecentAccessLogs: async (limit: number = 10, branchId?: number) => {
    const response = await axiosInstance.get<AccessLog[]>('/access-control/logs/recent', {
      params: { limit, branchId }
    });
    return response.data;
  },

  // 3. API Xác thực khuôn mặt (Gửi kèm Device ID để xác định cơ sở)
  verifyFaceWithAI: async (file: File, deviceId: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/access-control/verify-face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-device-id': deviceId, 
      },
    });
    return response.data;
  },

  // 4. MỚI: Lấy danh sách chi nhánh từ Database thay vì fix cứng
  getAllBranches: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches');
    return response.data;
  },
};