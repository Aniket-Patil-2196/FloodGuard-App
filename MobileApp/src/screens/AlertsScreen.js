import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import apiClient from '../api/apiClient';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await apiClient.get('/alerts');
        setAlerts(res.data);
      } catch (e) {
        console.error("Failed to fetch alerts");
      }
    };
    fetchAlerts();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={[styles.level, { color: item.riskLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b' }]}>
        {item.riskLevel} ALERT - {item.village}
      </Text>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{new Date(item.timestamp).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Emergency Alerts</Text>
      <FlatList
        data={alerts}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { fontSize: 24, fontWeight: 'bold', padding: 16, backgroundColor: 'white', color: '#1e3a8a' },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  level: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  message: { fontSize: 14, color: '#334155' },
  date: { fontSize: 12, color: '#94a3b8', marginTop: 8, textAlign: 'right' },
});
