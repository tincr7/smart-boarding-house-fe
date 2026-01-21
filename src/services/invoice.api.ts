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
  room: {
    id: number;
    roomNumber: string;
    price: string | number;
    status: string;
    branchId: number;
    contracts?: any[]; // Để lấy thông tin khách nếu cần
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

  // API xác nhận đã thu tiền (Cập nhật status = PAID)
  confirmPayment: async (id: number) => {
    const response = await axiosInstance.patch(`/invoices/${id}`, { status: 'PAID' });
    return response.data;
  },

  // API gửi thông báo (Giả lập hoặc gọi endpoint thật nếu có)
  sendNotification: async (id: number) => {
    // Ví dụ: POST /invoices/1/notify
    // const response = await axiosInstance.post(`/invoices/${id}/notify`);
    // return response.data;
    return new Promise((resolve) => setTimeout(resolve, 1000)); // Giả lập
  },

  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/invoices/${id}`);
    return response.data;
  }
};