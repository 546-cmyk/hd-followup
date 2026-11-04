import axios from 'axios';

export const axiosForBackend = axios.create({
  baseURL: '/',
  timeout: 30000,
  withCredentials: true,
});

export default axiosForBackend;
