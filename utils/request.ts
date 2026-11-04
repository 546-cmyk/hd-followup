import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

const request = axiosForBackend;

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('hd_followup_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hd_followup_auth');
      localStorage.removeItem('hd_followup_token');
      if (window.location.pathname !== '/login') {
        // eslint-disable-next-line no-restricted-syntax
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default request;
