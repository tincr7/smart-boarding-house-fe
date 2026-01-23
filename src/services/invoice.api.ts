import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface Invoice {
  id: number;
  month: number;
  year: number;
  oldElectricity: number;
  newElectricity: number;
  oldWater: number;
  newWater: number;
  serviceFee: string | number;
  totalAmount: string | number;
  status: 'PAID' | 'UNPAID' | 'PENDING';
  paymentProof?: string;
  roomId: number;
  createdAt: string;
  // THÊM TRƯỜNG NÀY ĐỂ HẾT LỖI TYPESCRIPT KHI FILTER XÓA MỀM
  deletedAt?: string | Date | null; 
  room: {
    id: number;
    roomNumber: string;
    price: string | number;
    status: string;
    branchId: number;
    contracts?: any[]; 
  };
}

export interface CreateInvoiceDto {
  roomId: number;
  month: number;
  year: number;
  oldElectricity: number;
  newElectricity: number;
  oldWater: number;
  newWater: number;
  serviceFee: number;
  paymentProof?: string;
}

export const invoiceApi = {
  // 1. Lấy danh sách (Backend đã filter xóa mềm, nhưng FE nên có interface chuẩn)
  getAll: async () => {
    const response = await axiosInstance.get<Invoice[]>('/invoices');
    return response.data;
  },

  getDetail: async (id: number) => {
    const response = await axiosInstance.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceDto) => {
    const response = await axiosInstance.post('/invoices', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateInvoiceDto>) => {
    const response = await axiosInstance.patch(`/invoices/${id}`, data);
    return response.data;
  },

  confirmPayment: async (id: number) => {
    const response = await axiosInstance.patch(`/invoices/${id}`, { status: 'PAID' });
    return response.data;
  },

  // 2. Tích hợp endpoint gửi Mail thật từ Backend
  sendNotification: async (id: number) => {
    // Giang nên gọi endpoint thật để Mailer ở Backend hoạt động
    const response = await axiosInstance.post(`/invoices/${id}/send-mail`);
    return response.data;
  },

  // 3. Xóa mềm (Soft Delete)
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/invoices/${id}`);
    return response.data;
  },

  getLatestByRoom: async (roomId: number) => {
    const response = await axiosInstance.get(`/invoices/latest/${roomId}`);
    return response.data; 
  },
  getDeleted: async () => {
    const response = await axiosInstance.get<Invoice[]>('/invoices/deleted');
    return response.data;
  },

  restore: async (id: number) => {
    const response = await axiosInstance.patch(`/invoices/${id}/restore`);
    return response.data;
  },

  hardDelete: async (id: number) => {
    const response = await axiosInstance.delete(`/invoices/${id}/permanent`);
    return response.data;
  },
};