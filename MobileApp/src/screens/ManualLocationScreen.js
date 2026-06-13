import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { STATES, MAHARASHTRA_DISTRICTS } from '../constants/locationData';

export default function ManualLocationScreen({ navigation }) {
  const { syncLocation, user } = useAuth();
  
  const [state, setState] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);

  // Modal State
  const [pickerConfig, setPickerConfig] = useState({ visible: false, type: '', data: [] });

  const openPicker = (type) => {
    let data = [];
    if (type === 'state') data = STATES;
    else if (type === 'district' && state === 'Maharashtra') data = Object.keys(MAHARASHTRA_DISTRICTS);
    else if (type === 'city' && district) data = MAHARASHTRA_DISTRICTS[district] || [];
    
    setPickerConfig({ visible: true, type, data });
  };

  const handleSelect = (item) => {
    if (pickerConfig.type === 'state') {
      setState(item);
      setDistrict('');
      setCity('');
    } else if (pickerConfig.type === 'district') {
      setDistrict(item);
      setCity('');
    } else if (pickerConfig.type === 'city') {
      setCity(item);
    }
    setPickerConfig({ visible: false, type: '', data: [] });
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await syncLocation({
      state, district, city, locationSource: 'MANUAL'
    });
    setSaving(false);
    if (success) {
      navigation.goBack();
    } else {
      alert('Failed to save location.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual Location</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select Your Location</Text>
        <Text style={styles.subtitle}>Help us provide accurate flood alerts by specifying your location manually.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>State</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => openPicker('state')}>
            <Text style={styles.dropdownText}>{state || 'Select State'}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>District</Text>
          <TouchableOpacity 
            style={[styles.dropdown, !state && styles.disabledDropdown]} 
            onPress={() => state && openPicker('district')}
            activeOpacity={state ? 0.7 : 1}
          >
            <Text style={[styles.dropdownText, !state && {color: '#94a3b8'}]}>{district || 'Select District'}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City / Town</Text>
          <TouchableOpacity 
            style={[styles.dropdown, !district && styles.disabledDropdown]} 
            onPress={() => district && openPicker('city')}
            activeOpacity={district ? 0.7 : 1}
          >
            <Text style={[styles.dropdownText, !district && {color: '#94a3b8'}]}>{city || 'Select City/Town'}</Text>
            <ChevronDown color="#64748b" size={20} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, (!state || !district || !city) && styles.disabledBtn]}
          disabled={!state || !district || !city || saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MapPin color="#fff" size={20} style={{marginRight: 8}} />
              <Text style={styles.saveBtnText}>Save Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Custom Picker Modal */}
      <Modal visible={pickerConfig.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {pickerConfig.type}</Text>
            <ScrollView style={{maxHeight: 300}}>
              {pickerConfig.data.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.modalItem} onPress={() => handleSelect(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
              {pickerConfig.data.length === 0 && (
                <Text style={styles.modalEmpty}>No options available.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setPickerConfig({...pickerConfig, visible: false})}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
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
    paddingTop: 48, paddingBottom: 24, paddingHorizontal: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  content: { padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    borderRadius: 12,
  },
  disabledDropdown: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  dropdownText: { fontSize: 16, color: '#0f172a' },
  saveBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  disabledBtn: { backgroundColor: '#94a3b8' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textTransform: 'capitalize' },
  modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalItemText: { fontSize: 16, color: '#0f172a' },
  modalEmpty: { padding: 20, textAlign: 'center', color: '#64748b' },
  closeBtn: { marginTop: 16, padding: 16, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: '#475569', fontWeight: '600', fontSize: 16 }
});
