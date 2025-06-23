import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify'),
};

export const employeeAPI = {
  create: (employee) => api.post('/employees', employee),
  getAll: (params) => api.get('/employees', { params }),
  getEmbeddings: () => api.get('/employees/embeddings'),
  delete: (id) => api.delete(`/employees/${id}`),
};

export const attendanceAPI = {
  log: (data) => api.post('/attendance/log', data),
  getByDate: (date) => api.get('/attendance', { params: { date } }),
  logUnknown: (data) => api.post('/attendance/unknown', data),
  getUnknown: () => api.get('/attendance/unknown'),
};

export default api;