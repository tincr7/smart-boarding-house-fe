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
  deletedAt?: string | Date | null; 
  room: {
    id: number;
    roomNumber: string;
    price: string | number;
    status: string;
    branchId: number;
    // BỔ SUNG TRƯỜNG NÀY ĐỂ HẾT LỖI Ở TRANG TENANTS/INVOICES
    branch?: {
      id: number;
      name: string;
      address: string;
    };
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

// --- METHODS ---

export const invoiceApi = {
  // 1. CẬP NHẬT: Cho phép nhận tham số branchId để lọc đa chi nhánh
  getAll: async (branchId?: number) => {
    const response = await axiosInstance.get<Invoice[]>('/invoices', {
      params: { branchId } // Gửi branchId lên Backend qua Query Params
    });
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
    const response = await axiosInstance.patch(`/invoices/${id}/pay`);
    return response.data;
  },

  sendNotification: async (id: number) => {
    const response = await axiosInstance.post(`/invoices/${id}/trigger-reminder`);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/invoices/${id}`);
    return response.data;
  },

  getLatestByRoom: async (roomId: number) => {
    const response = await axiosInstance.get(`/invoices/latest/${roomId}`);
    return response.data; 
  },

  // Cập nhật: Thùng rác cũng nên hỗ trợ lọc theo chi nhánh
  getDeleted: async (branchId?: number) => {
    const response = await axiosInstance.get<Invoice[]>('/invoices/deleted', {
      params: { branchId }
    });
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