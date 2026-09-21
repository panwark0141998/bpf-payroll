import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bpf_mobile_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('bpf_mobile_token');
      localStorage.removeItem('bpf_mobile_employee');
      window.dispatchEvent(new Event('mobile_auth_logout'));
    }
    return Promise.reject(error);
  }
);
