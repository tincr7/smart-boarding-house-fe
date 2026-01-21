import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interface dựa trên JSON bạn cung cấp
export interface Contract {
  id: number;
  startDate: string;
  endDate: string;
  deposit: string | number; // API trả về string nhưng khi dùng có thể là number
  status: 'ACTIVE' | 'TERMINATED' | 'EXPIRED'; 
  scanImage?: string;
  userId: number;
  roomId: number;
  createdAt?: string;
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

// DTO khi tạo/sửa
export interface CreateContractDto {
  roomId: number;
  userId: number;
  startDate: string; // ISO String
  endDate: string;   // ISO String
  deposit: number;
  scanImage?: string;
}

export const contractApi = {
  // 1. Lấy danh sách
  getAll: async () => {
    const response = await axiosInstance.get<Contract[]>('/contracts');
    return response.data;
  },

  // 2. Lấy chi tiết
  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  // 3. Tạo mới
  create: async (data: CreateContractDto) => {
    const response = await axiosInstance.post('/contracts', data);
    return response.data;
  },

  // 4. Cập nhật thông tin
  update: async (id: number, data: Partial<CreateContractDto>) => {
    const response = await axiosInstance.patch(`/contracts/${id}`, data);
    return response.data;
  },

  // 5. Thanh lý hợp đồng (Kết thúc sớm)
  terminate: async (id: number) => {
    // Thường backend sẽ có endpoint riêng để xử lý logic trả phòng + đổi trạng thái
    // Nếu backend bạn dùng PATCH status thì sửa dòng này tương ứng
    const response = await axiosInstance.patch(`/contracts/${id}/terminate`);
    // Hoặc: const response = await axiosInstance.patch(`/contracts/${id}`, { status: 'TERMINATED' });
    return response.data;
  }
};