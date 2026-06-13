import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import apiClient from '../api/apiClient';

export const AuthContext = createContext();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Sync push token if already logged in
          if (parsedUser.token) {
             registerForPushNotificationsAsync().then(token => {
               if (token) syncPushToken(token, parsedUser.token);
             });
          }
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const syncPushToken = async (pushToken, authToken) => {
    try {
      await apiClient.post('/auth/register-token', 
        { expoPushToken: pushToken },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    } catch (e) {
      console.log('Failed to sync push token', e.message);
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId: '184e3513-8f3a-46ab-bb58-9c8808ec508d' })).data;
    } else {
      console.log('Must use physical device for Push Notifications');
    }
    return token;
  };

  const login = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    // Get push token on login
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await syncPushToken(token, userData.token);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  const syncLocation = async (locationData) => {
    try {
      const response = await apiClient.put('/auth/location', locationData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUser(response.data);
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      return true;
    } catch (e) {
      console.error('Failed to sync location', e.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, syncLocation, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
