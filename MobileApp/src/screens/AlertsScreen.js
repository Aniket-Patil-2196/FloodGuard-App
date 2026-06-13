import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { io } from 'socket.io-client';
import { AlertCircle, Clock, Info, ArrowLeft, Phone } from 'lucide-react-native';
import apiClient, { SOCKET_URL } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ACTIVE'); // 'ACTIVE' or 'HISTORY'
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    fetchAlerts();

    // Setup Socket.IO
    const socket = io(SOCKET_URL);
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('new_alert', (newAlert) => {
      console.log('New alert received via socket:', newAlert);
      setAlerts((prevAlerts) => [newAlert, ...prevAlerts]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/alerts', {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch alerts', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    tab === 'ACTIVE' ? alert.status === 'ACTIVE' : alert.status === 'EXPIRED'
  );

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ea580c';
      case 'MEDIUM': return '#ca8a04';
      default: return '#2563eb';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.alertCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <Text style={styles.alertTitle}>{item.title}</Text>
      <Text style={styles.alertMessage}>{item.message}</Text>
      
      {item.severity === 'CRITICAL' && tab === 'ACTIVE' && (
        <View style={styles.emergencyActions}>
          <TouchableOpacity style={styles.emergencyBtn} onPress={() => Linking.openURL('tel:112')}>
            <Phone size={16} color="#fff" />
            <Text style={styles.emergencyBtnText}>Call Emergency (112)</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.sourceTag}>
          {item.source === 'AI_SYSTEM' ? <Info size={14} color="#6366f1" /> : <AlertCircle size={14} color="#6366f1" />}
          <Text style={styles.sourceText}>{item.source === 'AI_SYSTEM' ? 'AI Auto-Generated' : 'Admin Broadcast'}</Text>
        </View>
        {item.village && <Text style={styles.locationText}>📍 {item.village}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alert Center</Text>
        <Text style={styles.headerSubtitle}>Real-time emergency notifications</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, tab === 'ACTIVE' && styles.activeTab]} 
          onPress={() => setTab('ACTIVE')}
        >
          <Text style={[styles.tabText, tab === 'ACTIVE' && styles.activeTabText]}>Active Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, tab === 'HISTORY' && styles.activeTab]} 
          onPress={() => setTab('HISTORY')}
        >
          <Text style={[styles.tabText, tab === 'HISTORY' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No {tab.toLowerCase()} alerts found.</Text>
            </View>
          }
        />
      )}
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
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: '#bfdbfe' },
  tabContainer: { flexDirection: 'row', padding: 20, paddingBottom: 10 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#e2e8f0' },
  activeTab: { borderBottomColor: '#2563eb' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#2563eb' },
  listContainer: { padding: 20 },
  alertCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  severityText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  timeText: { fontSize: 12, color: '#94a3b8' },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  alertMessage: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 16 },
  emergencyActions: { marginBottom: 16 },
  emergencyBtn: { backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  emergencyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  sourceTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  sourceText: { fontSize: 12, color: '#4f46e5', fontWeight: '600', marginLeft: 6 },
  locationText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 16 }
});
