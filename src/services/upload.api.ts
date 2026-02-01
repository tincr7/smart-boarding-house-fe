import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ 
  baseURL: API_URL,
  // Tăng timeout lên 60s (mặc định axios là 0 - không giới hạn, nhưng một số server có set)
  // Upload ảnh/video nặng cần thời gian lâu hơn request thường
  timeout: 60000, 
});

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Định nghĩa kiểu dữ liệu trả về từ Cloudinary (để gợi ý code tốt hơn)
export interface UploadResponse {
  public_id: string;
  url: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

export const uploadApi = {
  /**
   * Upload file lên Server/Cloudinary
   * @param file File object từ input
   * @param folder Tên folder trên Cloudinary
   */
  upload: async (file: File, folder: string = 'smart-house/others'): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file); 
    formData.append('folder', folder); 

    try {
      const response = await axiosInstance.post<UploadResponse>('/upload', formData, {
        headers: {
          // Chỉ cần set Authorization nếu interceptor lỡ không chạy (dự phòng), 
          // nhưng tuyệt đối KHÔNG set 'Content-Type'
          'Accept': 'application/json',
        },
        // (Tùy chọn) Thêm hàm theo dõi tiến trình nếu muốn làm thanh loading %
        // onUploadProgress: (progressEvent) => {
        //   const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        //   console.log(`Upload progress: ${percentCompleted}%`);
        // }
      });
      
      console.log('✅ Upload kết quả:', response.data);
      return response.data; 

    } catch (error: any) {
      console.error('❌ Lỗi Upload:', error.response?.data || error.message);
      throw error; 
    }
  }
};