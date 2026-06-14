



import axios from 'axios';
import store from '../store/index';
import { logout } from '../store/authSlice';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/v1}` || 'http://localhost:5000/api/v1';


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});



api.interceptors.request.use(
  (config) => {

    const token = store.getState().auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(

  (response) => response.data,


  (error) => {
    if (error.response?.status === 401) {

      store.dispatch(logout());
      window.location.href = '/auth/login';
    }


    return Promise.reject(error.response?.data || error);
  }
);


export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  logout:   ()     => api.post('/auth/logout'),
  getMe:    ()     => api.get('/auth/me'),
};


export const documentAPI = {

  upload: (formData, onProgress) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),


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


export const chatAPI = {
  createSession: (data) => api.post('/chat/sessions', data),
  getSessions:   ()     => api.get('/chat/sessions'),
  getSession:    (id)   => api.get(`/chat/sessions/${id}`),
  sendMessage:   (id, message) => api.post(`/chat/sessions/${id}/message`, { message }),
  deleteSession: (id)   => api.delete(`/chat/sessions/${id}`),
};


export const userAPI = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.patch('/users/password', data),
};


// Citizens API — manage citizens (clients) under a CSC operator account
export const citizenAPI = {
  getAll:       (params) => api.get('/citizens', { params }),
  getById:      (id)     => api.get(`/citizens/${id}`),
  create:       (data)   => api.post('/citizens', data),
  update:       (id, data) => api.patch(`/citizens/${id}`, data),
  delete:       (id)     => api.delete(`/citizens/${id}`),
  getDocuments: (id, params) => api.get(`/citizens/${id}/documents`, { params }),
};

export default api;
