import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Map, MessageCircle, Bell, ShieldAlert, LogOut, Activity, CloudRain, Droplets, Settings } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  const ActionCard = ({ title, desc, icon: Icon, onPress, color }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.iconWrapper, { backgroundColor: `${color}15` }]}>
        <Icon color={color} size={28} />
      </View>
      <View style={styles.actionTextWrapper}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDesc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name}</Text>
            <Text style={styles.location}>📍 {user?.village || 'Current Location'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.logoutBtn}>
              <Settings color="#ffffff" size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <LogOut color="#ffffff" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusBanner}>
          <View style={styles.statusIcon}>
            <Activity color="#ffffff" size={24} />
          </View>
          <View>
            <Text style={styles.statusTitle}>Current Risk Status</Text>
            <Text style={styles.statusLevel}>MODERATE</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <CloudRain color="#3b82f6" size={24} />
            <Text style={styles.statValue}>45mm</Text>
            <Text style={styles.statLabel}>Rainfall</Text>
          </View>
          <View style={styles.statBox}>
            <Droplets color="#10b981" size={24} />
            <Text style={styles.statValue}>12.4m</Text>
            <Text style={styles.statLabel}>River Level</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Command Center</Text>
          <ActionCard 
            title="Live Flood Map" 
            desc="View real-time risk zones and shelters"
            icon={Map} 
            color="#3b82f6" 
            onPress={() => navigation.navigate('Map')} 
          />
          <ActionCard 
            title="AI Emergency Assistant" 
            desc="Get safety guidelines in your language"
            icon={MessageCircle} 
            color="#10b981" 
            onPress={() => navigation.navigate('Chat')} 
          />
          <ActionCard 
            title="Recent Alerts" 
            desc="Check official disaster warnings"
            icon={Bell} 
            color="#ef4444" 
            onPress={() => navigation.navigate('Alerts')} 
          />
          
          {user?.role === 'admin' && (
            <ActionCard 
              title="Admin Panel" 
              desc="Upload KML data and broadcast alerts"
              icon={ShieldAlert} 
              color="#8b5cf6" 
              onPress={() => navigation.navigate('Admin')} 
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { 
    backgroundColor: '#1e3a8a', 
    padding: 24, 
    paddingTop: 40,
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  greeting: { fontSize: 26, fontWeight: '800', color: '#ffffff' },
  location: { fontSize: 15, color: '#bfdbfe', marginTop: 4, fontWeight: '500' },
  logoutBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  statusBanner: {
    backgroundColor: '#f59e0b',
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusIcon: { backgroundColor: 'rgba(255,255,255,0.3)', padding: 12, borderRadius: 12, marginRight: 16 },
  statusTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600', opacity: 0.9 },
  statusLevel: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', padding: 20, justifyContent: 'space-between' },
  statBox: { 
    backgroundColor: '#ffffff', 
    width: '47%', 
    padding: 16, 
    borderRadius: 16, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 2 },
  actionsContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16, marginTop: 8 },
  actionCard: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconWrapper: { padding: 12, borderRadius: 12, marginRight: 16 },
  actionTextWrapper: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  actionDesc: { fontSize: 13, color: '#64748b', marginTop: 2, lineHeight: 18 },
});
