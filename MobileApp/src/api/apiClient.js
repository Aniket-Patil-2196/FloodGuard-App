import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Point back to the deployed Render backend
export const SOCKET_URL = 'https://floodguard-app.onrender.com';
const API_BASE_URL = `${SOCKET_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
