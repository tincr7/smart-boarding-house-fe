import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

// Tự động gắn Token vào mỗi yêu cầu upload
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const uploadApi = {
  /**
   * Hàm upload đa năng cho cả Ảnh và Video
   * @param file Tệp tin từ input (Image hoặc Video)
   * @param folder Thư mục lưu trữ trên Cloudinary (rooms, branches, videos,...)
   */
  upload: async (file: File, folder: string = 'branches') => {
    const formData = new FormData();
    formData.append('file', file); 
    formData.append('folder', folder); 

    try {
      // KHÔNG set Content-Type thủ công để tránh lỗi 'Invalid image file'
      const response = await axiosInstance.post('/upload', formData);
      
      // Log kết quả để Giang kiểm tra key trả về (url hay secure_url)
      console.log('Upload thành công:', response.data);
      
      return response.data; 
    } catch (error: any) {
      console.error('Lỗi Upload API:', error.response?.data || error.message);
      throw error;
    }
  }
};