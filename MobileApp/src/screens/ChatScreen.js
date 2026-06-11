import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';
import { Send, Mic, MicOff, Volume2 } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Speech from 'expo-speech';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi (हिंदी)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I am the FloodGuard AI. How can I help you?", sender: 'bot' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    loadLangPref();
  }, []);

  useSpeechRecognitionEvent("result", (event) => {
    if (event.results && event.results[0]?.transcript) {
      setInputText(event.results[0].transcript);
      setIsListening(false);
    }
  });
  useSpeechRecognitionEvent("error", () => setIsListening(false));
  useSpeechRecognitionEvent("end", () => setIsListening(false));

  const loadLangPref = async () => {
    const saved = await AsyncStorage.getItem('chat_language');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSelectedLang(parsed);
    }
  };

  const changeLanguage = async (lang) => {
    setSelectedLang(lang);
    setShowLangPicker(false);
    await AsyncStorage.setItem('chat_language', JSON.stringify(lang));
  };

  const toggleListening = async () => {
    try {
      if (isListening) {
        await ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
      } else {
        const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!granted) {
          console.error("Speech recognition permissions not granted");
          return;
        }
        setIsListening(true);
        await ExpoSpeechRecognitionModule.start({ lang: selectedLang.code });
      }
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const speakText = (text) => {
    Speech.speak(text, { language: selectedLang.code });
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await apiClient.post('/chat', { 
        message: userMsg.text,
        language: selectedLang.label 
      });
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
        <TouchableOpacity style={styles.langBtn} onPress={() => setShowLangPicker(!showLangPicker)}>
          <Text style={styles.langBtnText}>{selectedLang.label} ▼</Text>
        </TouchableOpacity>
      </View>

      {showLangPicker && (
        <View style={styles.langPicker}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity key={lang.code} style={styles.langOption} onPress={() => changeLanguage(lang)}>
              <Text style={styles.langOptionText}>{lang.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView style={styles.chatArea} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.bubbleWrapper, msg.sender === 'user' ? styles.userWrapper : styles.botWrapper]}>
            <View style={[styles.bubble, msg.sender === 'user' ? styles.userBubble : styles.botBubble]}>
              {msg.sender === 'bot' ? (
                <View>
                  <Markdown style={markdownStyles}>{msg.text}</Markdown>
                  <TouchableOpacity style={styles.ttsBtn} onPress={() => speakText(msg.text)}>
                    <Volume2 color="#64748b" size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.userMsgText}>{msg.text}</Text>
              )}
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
        <TouchableOpacity style={[styles.micBtn, isListening && styles.micBtnActive]} onPress={toggleListening}>
          {isListening ? <MicOff color="#ffffff" size={20} /> : <Mic color="#ffffff" size={20} />}
        </TouchableOpacity>
        <TextInput 
          style={styles.input} 
          value={inputText} 
          onChangeText={setInputText} 
          placeholder={isListening ? "Listening..." : "Ask about flood risks..."}
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

const markdownStyles = StyleSheet.create({
  body: { color: '#334155', fontSize: 15, lineHeight: 22 },
  heading1: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginTop: 10, marginBottom: 5 },
  heading2: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginTop: 8, marginBottom: 4 },
  heading3: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginTop: 6, marginBottom: 4 },
  strong: { fontWeight: 'bold', color: '#0f172a' },
  bullet_list: { marginTop: 5, marginBottom: 5 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#ffffff', paddingTop: 45, paddingBottom: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e3a8a' },
  langBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 40 },
  langBtnText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  langPicker: { backgroundColor: '#ffffff', elevation: 4, position: 'absolute', top: 60, right: 10, zIndex: 10, borderRadius: 8, padding: 8 },
  langOption: { paddingVertical: 8, paddingHorizontal: 16 },
  langOptionText: { fontSize: 15, color: '#1e293b' },
  chatArea: { flex: 1, padding: 16 },
  bubbleWrapper: { marginBottom: 16, maxWidth: '85%' },
  userWrapper: { alignSelf: 'flex-end' },
  botWrapper: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, elevation: 1 },
  userBubble: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  typingBubble: { paddingHorizontal: 20, paddingVertical: 14 },
  userMsgText: { color: '#ffffff', fontSize: 15, lineHeight: 22 },
  ttsBtn: { alignSelf: 'flex-end', marginTop: 8, padding: 4, backgroundColor: '#f1f5f9', borderRadius: 12 },
  inputArea: { flexDirection: 'row', padding: 12, backgroundColor: '#ffffff', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, marginHorizontal: 8, fontSize: 15, color: '#0f172a', maxHeight: 100 },
  sendBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  micBtn: { backgroundColor: '#10b981', padding: 12, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  micBtnActive: { backgroundColor: '#ef4444' }
});
