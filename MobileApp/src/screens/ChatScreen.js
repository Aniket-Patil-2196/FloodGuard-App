import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import apiClient from '../api/apiClient';
import { Send, Mic } from 'lucide-react-native';

export default function ChatScreen() {
  const [messages, setMessages] = useState([{ id: 1, text: "Hello! I am the FloodGuard AI. How can I help you?", sender: 'bot' }]);
  const [inputText, setInputText] = useState('');

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    try {
      const res = await apiClient.post('/chat/message', { message: userMsg.text });
      setMessages(prev => [...prev, { id: Date.now()+1, text: res.data.response, sender: 'bot' }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now()+1, text: "Error connecting to AI.", sender: 'bot' }]);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView style={styles.chatArea}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={styles.msgText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.micBtn}><Mic color="white" size={20} /></TouchableOpacity>
        <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Type a message..." />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}><Send color="white" size={20} /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  chatArea: { flex: 1, padding: 16 },
  bubble: { padding: 12, borderRadius: 16, maxWidth: '80%', marginBottom: 12 },
  userBubble: { backgroundColor: '#2563eb', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#e2e8f0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { color: '#1e293b', fontSize: 16 },
  inputArea: { flexDirection: 'row', padding: 12, backgroundColor: 'white', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 8 },
  sendBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 24 },
  micBtn: { backgroundColor: '#10b981', padding: 12, borderRadius: 24 },
});
