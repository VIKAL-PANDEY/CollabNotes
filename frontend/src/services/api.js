import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (username, email, password) => {
    const response = await api.post('/api/auth/register', { username, email, password });
    return response.data;
  },
  login: async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export const documentService = {
  list: async (search = '') => {
    const response = await api.get(search ? `/api/documents?search=${search}` : '/api/documents');
    return response.data;
  },
  create: async (title = 'Untitled Document', content = '') => {
    const response = await api.post('/api/documents', { title, content });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/api/documents/${id}`);
    return response.data;
  },
  update: async (id, title, content) => {
    const response = await api.put(`/api/documents/${id}`, { title, content });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/documents/${id}`);
    return response.data;
  },
  getHistory: async (id) => {
    const response = await api.get(`/api/documents/${id}/history`);
    return response.data;
  },
  getActivityLogs: async () => {
    const response = await api.get('/api/documents/activity');
    return response.data;
  },
  share: async (id, username, permission) => {
    const response = await api.post(`/api/documents/${id}/share`, { username, permission });
    return response.data;
  },
  getSharedUsers: async (id) => {
    const response = await api.get(`/api/documents/${id}/users`);
    return response.data;
  },
  getExportUrl: (id) => {
    const token = localStorage.getItem('token');
    return `${API_BASE_URL}/api/documents/${id}/export?token=${token}`;
  }
};

export default api;
