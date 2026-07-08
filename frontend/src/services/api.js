import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pharpyuobe.onrender.com/api'
});

// แนบ token อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response &&
      (
        error.response.status === 401 ||
        error.response.status === 403
      )
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert(
        'Session หมดอายุ กรุณา Login ใหม่'
      );
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;