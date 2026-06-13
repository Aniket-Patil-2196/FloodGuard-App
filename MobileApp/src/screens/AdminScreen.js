import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Upload, Map, AlertTriangle, X, BarChart3, Users } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export default function AdminScreen() {
  const [uploading, setUploading] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [alertForm, setAlertForm] = useState({ title: '', message: '', severity: 'HIGH' });
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/alerts/stats', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleKmlUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (result.canceled) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('kml', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/xml',
      });

      setUploading(true);
      const response = await apiClient.post('/map/upload-kml', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      Alert.alert('Upload Successful', `Successfully processed ${response.data.featuresProcessed} mapping features.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Could not upload the KML file.');
    } finally {
      setUploading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!alertForm.title || !alertForm.message) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    setBroadcasting(true);
    try {
      await apiClient.post('/alerts/broadcast', {
        title: alertForm.title,
        message: alertForm.message,
        severity: alertForm.severity,
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      Alert.alert('Success', 'Push notifications broadcasted successfully!');
      setShowModal(false);
      setAlertForm({ title: '', message: '', severity: 'HIGH' });
      fetchStats(); // refresh stats
    } catch (error) {
      console.error(error);
      Alert.alert('Broadcast Failed', error.response?.data?.message || 'Could not send push alerts.');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Command Center</Text>
        <Text style={styles.headerSubtitle}>Manage system data and emergency alerts</Text>
      </View>

      <View style={styles.grid}>
        
        {/* Analytics Card */}
        <View style={styles.card}>
          <View style={[styles.cardIconWrapper, { backgroundColor: '#f3e8ff' }]}>
            <BarChart3 color="#9333ea" size={24} />
          </View>
          <Text style={styles.cardTitle}>System Analytics</Text>
          {loadingStats ? (
            <ActivityIndicator color="#9333ea" />
          ) : stats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Users color="#64748b" size={18} />
                <Text style={styles.statText}>Total Users: {stats.users?.total}</Text>
              </View>
              <View style={styles.statRow}>
                <AlertTriangle color="#64748b" size={18} />
                <Text style={styles.statText}>Push Enabled: {stats.users?.pushEnabled}</Text>
              </View>
              <View style={styles.statRow}>
                <BarChart3 color="#64748b" size={18} />
                <Text style={styles.statText}>Active Alerts: {stats.activeAlertsCount}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.cardDesc}>Failed to load analytics.</Text>
          )}
        </View>

        {/* KML Upload Card */}
        <View style={styles.card}>
          <View style={styles.cardIconWrapper}>
            <Map color="#2563eb" size={24} />
          </View>
          <Text style={styles.cardTitle}>Map Data Management</Text>
          <Text style={styles.cardDesc}>Upload KML files to update safe zones, shelters, and danger lines on the live map.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleKmlUpload} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Upload color="#ffffff" size={18} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Upload KML File</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* System Alerts */}
        <View style={styles.card}>
          <View style={[styles.cardIconWrapper, { backgroundColor: '#fef2f2' }]}>
            <AlertTriangle color="#dc2626" size={24} />
          </View>
          <Text style={styles.cardTitle}>Broadcast Alert</Text>
          <Text style={styles.cardDesc}>Send emergency push notifications to all users' devices.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#dc2626' }]} onPress={() => setShowModal(true)}>
            <AlertTriangle color="#ffffff" size={18} style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Send Push Alert</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Push Alert</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Alert Title (e.g., Flood Warning)"
              value={alertForm.title}
              onChangeText={(t) => setAlertForm({ ...alertForm, title: t })}
            />
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Message details..."
              multiline
              value={alertForm.message}
              onChangeText={(t) => setAlertForm({ ...alertForm, message: t })}
            />

            <View style={styles.severityContainer}>
              {['MEDIUM', 'HIGH', 'CRITICAL'].map(sev => (
                <TouchableOpacity
                  key={sev}
                  style={[styles.sevBtn, alertForm.severity === sev && styles.sevBtnActive]}
                  onPress={() => setAlertForm({ ...alertForm, severity: sev })}
                >
                  <Text style={[styles.sevText, alertForm.severity === sev && { color: 'white' }]}>{sev}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#dc2626', marginTop: 20 }]} onPress={handleBroadcast} disabled={broadcasting}>
              {broadcasting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Broadcast Now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#bfdbfe' },
  grid: { padding: 20, marginTop: -20 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  cardIconWrapper: {
    backgroundColor: '#eff6ff',
    width: 48, height: 48,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 },
  statsContainer: { marginTop: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statText: { marginLeft: 12, fontSize: 15, color: '#475569', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12, fontSize: 16 },
  severityContainer: { flexDirection: 'row', gap: 8, marginTop: 8 },
  sevBtn: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  sevBtnActive: { backgroundColor: '#3b82f6' },
  sevText: { fontSize: 13, fontWeight: '600', color: '#64748b' }
});
