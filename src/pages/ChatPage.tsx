import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, Bot, User, ShieldAlert, Info, MapPin, ArrowLeft, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Welcome to FloodGuard AI, ${user?.name || 'there'}. I can provide real-time flood analysis, safety tips, and risk assessments. How can I assist you today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('English');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Marathi' ? 'mr-IN' : language === 'Hindi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://floodguard-real-time-flood-prediction.onrender.com').replace(/\/$/, '');
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          language,
          history,
          location: user?.village || 'Sangli'
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API responded with status ${response.status}`);
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || "I'm sorry, I'm having trouble connecting right now.",
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error('FRONTEND_ERROR: Chat request failed:', error);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the safety server. Please check your network and try again soon.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Check current flood risk', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Emergency safety tips', icon: <Info className="w-4 h-4" /> },
    { label: 'Nearby shelter alerts', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">FloodGuard AI</h1>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Advanced Analysis Active</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-800 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar max-w-[120px] sm:max-w-none">
            {['English', 'Hindi', 'Marathi'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${language === lang ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-white/10'}`}>
                  {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-blue-400" />}
                </div>
                <div className={`p-4 rounded-3xl text-sm md:text-base leading-relaxed shadow-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-white/10 rounded-tl-none'}`}>
                  <div className="prose prose-invert prose-sm md:prose-base max-w-none">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] mt-2 opacity-50 font-medium ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div className="bg-slate-900 p-4 rounded-3xl rounded-tl-none border border-white/10 shadow-lg">
                  <div className="flex gap-1">
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setInput(action.label);
              }}
              className="flex-shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-2xl text-xs md:text-sm text-slate-300 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <span className="p-1.5 bg-slate-800 rounded-lg">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="bg-slate-900 border border-white/10 rounded-[2rem] p-2 shadow-2xl">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your situation or ask a question..."
                className="w-full bg-transparent border-none py-4 px-6 text-sm md:text-base text-white focus:ring-0 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={startListening}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-400'}`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-3xl transition-all shadow-lg shadow-blue-900/40"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
        <p className="text-[10px] text-center text-slate-500 mt-2">
          FloodGuard AI can make mistakes. Always prioritize local emergency broadcasts.
        </p>
      </main>
    </div>
  );
}
