import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Upload, Map, AlertTriangle, Users } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/apiClient';

export default function AdminScreen() {
  const [uploading, setUploading] = useState(false);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Command Center</Text>
        <Text style={styles.headerSubtitle}>Manage system data and emergency alerts</Text>
      </View>

      <View style={styles.grid}>
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

        {/* Dummy Card - System Alerts */}
        <View style={styles.card}>
          <View style={[styles.cardIconWrapper, { backgroundColor: '#fef2f2' }]}>
            <AlertTriangle color="#dc2626" size={24} />
          </View>
          <Text style={styles.cardTitle}>Broadcast Alert</Text>
          <Text style={styles.cardDesc}>Send emergency push notifications to all users in a specific region.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#dc2626' }]} onPress={() => Alert.alert('Notice', 'Feature coming soon.')}>
            <Text style={styles.primaryBtnText}>Send Push Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f1f5f9' 
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#bfdbfe',
  },
  grid: {
    padding: 20,
    marginTop: -20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  cardIconWrapper: {
    backgroundColor: '#eff6ff',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
