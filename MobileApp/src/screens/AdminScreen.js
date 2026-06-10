import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import apiClient from '../api/apiClient';

export default function AdminScreen() {
  const [uploading, setUploading] = useState(false);

  const handleKmlUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

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
      
      Alert.alert('Success', `KML Uploaded! Processed ${response.data.featuresProcessed} features.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Upload Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <View style={styles.card}>
        <Text style={styles.title}>Map Data Management</Text>
        <Text style={styles.desc}>Upload a KML file to update shelters, safe zones, and danger lines on the map.</Text>
        <TouchableOpacity style={styles.btn} onPress={handleKmlUpload} disabled={uploading}>
          <Upload color="white" size={20} />
          <Text style={styles.btnText}>{uploading ? 'Uploading...' : 'Upload KML File'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: 'white', color: '#1e3a8a' },
  card: { backgroundColor: 'white', margin: 16, padding: 20, borderRadius: 12, elevation: 3 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: '#64748b', marginBottom: 16 },
  btn: { backgroundColor: '#8b5cf6', padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
});
