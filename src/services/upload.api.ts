import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const axiosInstance = axios.create({ baseURL: API_URL });

axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const uploadApi = {
  upload: async (file: File, folder: string = 'branches') => {
    const formData = new FormData();
    formData.append('file', file); // Tên trường phải khớp với backend (thường là 'file')
    formData.append('folder', folder); // Nếu backend hỗ trợ chọn folder

    const response = await axiosInstance.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    // Giả sử backend trả về: { url: "https://..." } hoặc { secure_url: "..." }
    // Bạn hãy log response.data để xem chính xác key là gì
    return response.data; 
  }
};