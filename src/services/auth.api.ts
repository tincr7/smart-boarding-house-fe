import axios from 'axios';
import Cookies from 'js-cookie';

// Cập nhật đúng URL Backend của bạn (Render)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://smart-rental-be.onrender.com';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn Token vào mọi request
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- TYPE DEFINITIONS ---
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  identityCard?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string; // Backend trả về key này
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

// --- API METHODS ---
export const authApi = {
  // 1. Đăng nhập & LƯU TOKEN
  login: async (data: LoginRequest) => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    
    // --- ĐÂY LÀ PHẦN QUAN TRỌNG BẠN CÒN THIẾU ---
    // Kiểm tra và lấy token từ response
    const token = response.data.access_token || (response.data as any).accessToken;

    if (token) {
      // Lưu token vào Cookie (quan trọng: path '/')
      Cookies.set('access_token', token, { expires: 7, path: '/' });
      console.log("✅ Đã lưu token vào Cookie:", token);
    } else {
      console.error("❌ API trả về thành công nhưng không thấy access_token:", response.data);
    }
    // ---------------------------------------------

    return response.data;
  },

  // 2. Đăng ký
  register: async (data: RegisterRequest) => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },
  
  // 3. Logout
  logout: () => {
    Cookies.remove('access_token', { path: '/' });
    // Reload trang hoặc redirect về login để xóa sạch state cũ
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
  },

  getToken: () => {
    return Cookies.get('access_token');
  },

  // 4. Lấy Profile (Lúc này Token đã có trong Cookie nhờ hàm login ở trên)
  getProfile: async () => {
    const response = await axiosInstance.get('/auth/me'); 
    return response.data;
  },
};