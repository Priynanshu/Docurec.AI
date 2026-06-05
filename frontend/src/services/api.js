// ─── API Service ──────────────────────────────────────────────────────────────
// All backend API calls go through here.
// Token is automatically added to every request from Redux store.

import axios from 'axios';
import store from '../store/index';
import { logout } from '../store/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with base settings
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds (OCR processing can be slow)
});

// ── Request Interceptor: Attach token to every request ───────────────────────
// This runs before EVERY api call — makes sure the token is always sent
api.interceptors.request.use(
  (config) => {
    // Get token from Redux store (always up to date, no stale closures)
    const token = store.getState().auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle errors ──────────────────────────────────────
api.interceptors.response.use(
  // Success: unwrap the response data (so we get res.data directly)
  (response) => response.data,

  // Error: handle 401 (unauthorized) and other errors
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → force logout and redirect to login
      store.dispatch(logout());
      window.location.href = '/auth/login';
    }

    // Return the error message from server (or a default)
    return Promise.reject(error.response?.data || error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  getMe:    ()     => api.get('/auth/me'),
};

// ── Documents API ─────────────────────────────────────────────────────────────
export const documentAPI = {
  // Upload a single file
  upload: (formData, onProgress) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),

  // Upload multiple files at once
  batchUpload: (formData, onProgress) =>
    api.post('/documents/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),

  getAll:       (params) => api.get('/documents', { params }),
  getById:      (id)     => api.get(`/documents/${id}`),
  delete:       (id)     => api.delete(`/documents/${id}`),
  maskPII:      (id, mask) => api.post(`/documents/${id}/mask-pii`, { mask }),
  correctField: (id, field, value) => api.patch(`/documents/${id}/correct`, { field, value }),
  translate:    (id, language) => api.post(`/documents/${id}/translate`, { language }),
  compare:      (docId1, docId2) => api.post('/documents/compare', { docId1, docId2 }),
  analytics:    () => api.get('/documents/analytics'),
};

// ── Chat API ──────────────────────────────────────────────────────────────────
export const chatAPI = {
  createSession: (data) => api.post('/chat/sessions', data),
  getSessions:   ()     => api.get('/chat/sessions'),
  getSession:    (id)   => api.get(`/chat/sessions/${id}`),
  sendMessage:   (id, message) => api.post(`/chat/sessions/${id}/message`, { message }),
  deleteSession: (id)   => api.delete(`/chat/sessions/${id}`),
};

// ── User API ──────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.patch('/users/password', data),
};

export default api;
