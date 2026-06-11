import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import apiClient from '../api/apiClient';
import { Send, Mic } from 'lucide-react-native';

export default function ChatScreen() {
  const [messages, setMessages] = useState([{ id: 1, text: "Hello! I am the FloodGuard AI. How can I help you?", sender: 'bot' }]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await apiClient.post('/chat/message', { message: userMsg.text });
      setMessages(prev => [...prev, { id: Date.now()+1, text: res.data.response, sender: 'bot' }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now()+1, text: "Unable to connect to AI server. Please try again.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FloodGuard AI</Text>
      </View>
      <ScrollView style={styles.chatArea} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubbleWrapper, msg.sender === 'user' ? styles.userWrapper : styles.botWrapper]}>
            <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
              <Text style={[styles.msgText, msg.sender === 'user' ? styles.userMsgText : styles.botMsgText]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={[styles.bubbleWrapper, styles.botWrapper]}>
            <View style={[styles.bubble, styles.botBubble, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#64748b" />
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.inputArea}>
        <TouchableOpacity style={styles.micBtn}>
          <Mic color="#ffffff" size={20} />
        </TouchableOpacity>
        <TextInput 
          style={styles.input} 
          value={inputText} 
          onChangeText={setInputText} 
          placeholder="Ask about flood risks..." 
          placeholderTextColor="#94a3b8"
          multiline
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!inputText.trim()}>
          <Send color={inputText.trim() ? "#ffffff" : "#94a3b8"} size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  chatArea: { 
    flex: 1, 
    padding: 16 
  },
  bubbleWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  botWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: { 
    paddingHorizontal: 16, 
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: { 
    backgroundColor: '#2563eb', 
    borderBottomRightRadius: 4,
  },
  botBubble: { 
    backgroundColor: '#ffffff', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typingBubble: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  msgText: { 
    fontSize: 15,
    lineHeight: 22,
  },
  userMsgText: {
    color: '#ffffff',
  },
  botMsgText: {
    color: '#334155',
  },
  inputArea: { 
    flexDirection: 'row', 
    padding: 12, 
    backgroundColor: '#ffffff', 
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: { 
    flex: 1, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 24, 
    paddingHorizontal: 16, 
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 8,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 100,
  },
  sendBtn: { 
    backgroundColor: '#2563eb', 
    padding: 12, 
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtn: { 
    backgroundColor: '#10b981', 
    padding: 12, 
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
