import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Map, MessageCircle, Bell, ShieldAlert, LogOut } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();

  const ActionButton = ({ title, icon: Icon, onPress, color }) => (
    <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
      <Icon color="white" size={24} />
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}</Text>
        <Text style={styles.location}>📍 {user?.village}</Text>
      </View>

      <View style={styles.grid}>
        <ActionButton title="Flood Map" icon={Map} onPress={() => navigation.navigate('Map')} color="#3b82f6" />
        <ActionButton title="Alerts" icon={Bell} onPress={() => navigation.navigate('Alerts')} color="#ef4444" />
        <ActionButton title="AI Chatbot" icon={MessageCircle} onPress={() => navigation.navigate('Chat')} color="#10b981" />
        
        {user?.role === 'admin' && (
          <ActionButton title="Admin Panel" icon={ShieldAlert} onPress={() => navigation.navigate('Admin')} color="#8b5cf6" />
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut color="#ef4444" size={20} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { backgroundColor: '#1e3a8a', padding: 24, paddingTop: 48, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  location: { fontSize: 16, color: '#bfdbfe', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, justifyContent: 'space-between' },
  actionButton: { width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 16, elevation: 3 },
  actionText: { color: 'white', fontWeight: 'bold', marginTop: 12, fontSize: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 20 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});
