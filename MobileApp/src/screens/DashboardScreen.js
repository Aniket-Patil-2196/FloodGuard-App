import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Map, MessageCircle, Bell, ShieldAlert, LogOut, Activity, CloudRain, Droplets, Settings, MapPin, Navigation, MapPinOff } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function DashboardScreen({ navigation }) {
  const { user, logout, syncLocation } = useAuth();
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (user && !user.locationSource) {
      setShowLocationPrompt(true);
    }
  }, [user]);

  const handleUseGPS = async () => {
    setGettingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setGettingLocation(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      let geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      let address = geocode[0];
      
      const city = address?.city || address?.subregion || address?.district || '';
      const district = address?.subregion || address?.district || city;
      const state = address?.region || '';

      await syncLocation({
        latitude,
        longitude,
        city,
        district,
        state,
        locationSource: 'GPS'
      });
      setShowLocationPrompt(false);
    } catch (error) {
      console.error(error);
      alert('Could not fetch location.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleUseRegistrationData = async () => {
    setGettingLocation(true);
    await syncLocation({
      city: user?.village,
      locationSource: 'REGISTRATION'
    });
    setGettingLocation(false);
    setShowLocationPrompt(false);
  };

  const handleManualSelection = () => {
    setShowLocationPrompt(false);
    navigation.navigate('ManualLocation');
  };

  const displayLocation = user?.locationSource === 'GPS' ? user?.city || user?.district :
                          user?.locationSource === 'MANUAL' ? user?.city :
                          user?.village || 'Current Location';

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
            <Text style={styles.location}>📍 {displayLocation}</Text>
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

      <Modal visible={showLocationPrompt} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrapper}>
              <MapPin color="#2563eb" size={32} />
            </View>
            <Text style={styles.modalTitle}>Enable Location</Text>
            <Text style={styles.modalSubtitle}>To provide accurate flood predictions and alerts, we need to know your current location.</Text>

            {gettingLocation ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 12, color: '#64748b' }}>Finding location...</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleUseGPS}>
                  <Navigation color="#ffffff" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.modalBtnPrimaryText}>Use Current Location (GPS)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleManualSelection}>
                  <MapPin color="#475569" size={20} style={{ marginRight: 8 }} />
                  <Text style={styles.modalBtnSecondaryText}>Select Manually</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalBtnGhost} onPress={handleUseRegistrationData}>
                  <Text style={styles.modalBtnGhostText}>Continue with Registration City ({user?.village})</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalIconWrapper: { backgroundColor: '#eff6ff', padding: 16, borderRadius: 20, marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalBtnPrimary: { backgroundColor: '#2563eb', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, width: '100%', marginBottom: 12 },
  modalBtnPrimaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  modalBtnSecondary: { backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, width: '100%', marginBottom: 12 },
  modalBtnSecondaryText: { color: '#475569', fontSize: 16, fontWeight: '700' },
  modalBtnGhost: { padding: 12, alignItems: 'center' },
  modalBtnGhostText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' }
});
