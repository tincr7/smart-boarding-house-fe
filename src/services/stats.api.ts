import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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

export interface Branch {
  id: number;
  name: string;
  address: string;
  manager: string;
}

// 👇 CẬP NHẬT QUAN TRỌNG: Interface khớp với Backend mới
export interface AccessLog {
  id: number;
  userId: number; // ✅ Thêm trường này (Bắt buộc để Dashboard chạy)
  method: 'FACE_ID' | 'FINGERPRINT';
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  createdAt: string;
  note?: string;

  // Object quan hệ trả về từ Backend (khi include)
  user?: {
    id: number;
    fullName: string;
    avatar?: string;
    phone?: string;
  };

  // Object phòng (Được backend tính toán từ Active Contract)
  room?: {
    id: number;
    roomNumber: string;
  };

  // Object thiết bị & chi nhánh
  device?: {
    id: string;
    branchId: number;
    branch?: {
      id: number;
      name: string;
    };
  };

  // Các trường string được backend map sẵn (nếu có dùng)
  branch?: string;   // Tên chi nhánh (string)
  resident?: string; // Tên cư dân (string)
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
  // 1. Lấy dữ liệu thống kê tổng quan
  getDashboardStats: async (branchId?: number) => {
    const response = await axiosInstance.get<DashboardData>('/statistics/dashboard', {
      params: { branchId }
    });
    return response.data;
  },

  // 2. Lấy nhật ký ra vào
  getRecentAccessLogs: async (limit: number = 10, branchId?: number) => {
    const response = await axiosInstance.get<AccessLog[]>('/access-control/logs/recent', {
      params: { limit, branchId }
    });
    return response.data;
  },

  // 3. API Xác thực khuôn mặt (Dành cho thiết bị Camera)
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

  // 4. Lấy danh sách chi nhánh
  getAllBranches: async () => {
    const response = await axiosInstance.get<Branch[]>('/branches');
    return response.data;
  },
};