import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', village: 'Sangli'
  });
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!formData.name || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Name, phone, and password are required');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', formData);
      await login(response.data);
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          
          <TextInput style={styles.input} placeholder="Full Name" value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} />
          <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={formData.phone} onChangeText={(t) => setFormData({...formData, phone: t})} />
          <TextInput style={styles.input} placeholder="Email (Optional)" keyboardType="email-address" value={formData.email} onChangeText={(t) => setFormData({...formData, email: t})} />
          <TextInput style={styles.input} placeholder="Village" value={formData.village} onChangeText={(t) => setFormData({...formData, village: t})} />
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={formData.password} onChangeText={(t) => setFormData({...formData, password: t})} />
          
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
          </TouchableOpacity>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, elevation: 5 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 24 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16 },
  button: { backgroundColor: '#2563eb', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b' },
  link: { color: '#2563eb', fontWeight: 'bold' },
});
