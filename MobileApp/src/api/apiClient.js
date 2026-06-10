import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use 'http://10.0.2.2:3000/api' for Android Emulator
// For physical device, change this to 'http://YOUR_LOCAL_IP:3000/api'
const API_BASE_URL = 'http://10.195.144.94:3000/api'; 

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
