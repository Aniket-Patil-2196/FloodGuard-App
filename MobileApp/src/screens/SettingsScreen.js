import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Bell, ArrowLeft, ShieldCheck, MapPin } from 'lucide-react-native';
import apiClient from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  const { user, login } = useAuth(); // use login to update context user state
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled !== false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (value) => {
    setNotificationsEnabled(value);
    setSaving(true);
    try {
      const response = await apiClient.put('/auth/settings', {
        notificationsEnabled: value
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      // Update local storage and context
      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      // You might need to reload app or update context manually here depending on AuthContext implementation
      
      Alert.alert('Success', 'Notification preferences updated.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update settings. Reverting changes.');
      setNotificationsEnabled(!value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.settingCard}>
          <View style={styles.settingInfo}>
            <View style={styles.iconWrapper}>
              <Bell color="#2563eb" size={24} />
            </View>
            <View>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive critical disaster alerts</Text>
            </View>
          </View>
          {saving ? (
            <ActivityIndicator color="#2563eb" />
          ) : (
            <Switch
              trackColor={{ false: "#cbd5e1", true: "#bfdbfe" }}
              thumbColor={notificationsEnabled ? "#2563eb" : "#f1f5f9"}
              onValueChange={handleToggle}
              value={notificationsEnabled}
            />
          )}
        </View>

        <View style={[styles.settingCard, { marginTop: 16, flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={[styles.settingInfo, { marginBottom: 16 }]}>
            <View style={[styles.iconWrapper, { backgroundColor: '#f3e8ff' }]}>
              <MapPin color="#9333ea" size={24} />
            </View>
            <View>
              <Text style={styles.settingTitle}>Current Location</Text>
              <Text style={styles.settingDesc}>
                {user?.locationSource === 'GPS' ? 'Auto-detected via GPS' : 
                 user?.locationSource === 'MANUAL' ? 'Manually selected' : 
                 'Registration data (Village)'}
              </Text>
            </View>
          </View>
          
          <View style={styles.locationDetails}>
            <Text style={styles.locationText}>City: <Text style={styles.locationValue}>{user?.city || user?.village || 'Not set'}</Text></Text>
            <Text style={styles.locationText}>District: <Text style={styles.locationValue}>{user?.district || 'Not set'}</Text></Text>
            <Text style={styles.locationText}>State: <Text style={styles.locationValue}>{user?.state || 'Maharashtra'}</Text></Text>
          </View>

          <TouchableOpacity style={styles.updateLocBtn} onPress={() => navigation.navigate('ManualLocation')}>
            <Text style={styles.updateLocBtnText}>Update Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <ShieldCheck color="#10b981" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            We recommend keeping notifications enabled so our AI and local admins can reach you during life-threatening situations.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  content: { padding: 20 },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { backgroundColor: '#eff6ff', padding: 10, borderRadius: 12, marginRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  settingDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
  infoCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#d1fae5'
  },
  infoText: { flex: 1, color: '#047857', fontSize: 13, lineHeight: 20 },
  locationDetails: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 16 },
  locationText: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  locationValue: { color: '#0f172a', fontWeight: '600' },
  updateLocBtn: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, alignItems: 'center' },
  updateLocBtnText: { color: '#2563eb', fontWeight: '700', fontSize: 14 }
});
