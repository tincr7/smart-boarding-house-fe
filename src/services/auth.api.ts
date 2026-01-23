import axios from 'axios';
import Cookies from 'js-cookie';

// Tự động nhận diện môi trường: Nếu chạy local thì dùng localhost, nếu deploy thì dùng Render
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Gắn Token vào Header cho MỌI request
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- TYPE DEFINITIONS ---
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string; // Khớp với NestJS thường dùng
  access_token?: string; // Dự phòng cho bản cũ
  user?: {
    id: number;
    email: string;
    fullName: string;
    role: string;
  };
}

// --- API METHODS ---
export const authApi = {
  // 1. Đăng nhập & LƯU TOKEN
  login: async (data: LoginRequest) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
      
      // Kiểm tra cả 2 trường hợp tên biến để không bị sót
      const token = response.data.accessToken || response.data.access_token;

      if (token) {
        // Lưu token vào Cookie dùng chung cho toàn bộ domain (path: '/')
        Cookies.set('access_token', token, { 
            expires: 7, 
            path: '/',
            sameSite: 'lax' // Giúp bảo mật hơn
        });
        
        // Cập nhật ngay lập tức cho instance hiện tại để các request sau (như getProfile) chạy được luôn
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        console.log("✅ Đăng nhập thành công, đã lưu token.");
      }

      return response.data;
    } catch (error) {
      console.error("❌ Lỗi đăng nhập:", error);
      throw error;
    }
  },

  // 2. Logout
  logout: () => {
    Cookies.remove('access_token', { path: '/' });
    delete axiosInstance.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
  },

  getProfile: async () => {
    // Không cần truyền token thủ công, Interceptor đã lo
    const response = await axiosInstance.get('/auth/me'); 
    return response.data;
  },
};