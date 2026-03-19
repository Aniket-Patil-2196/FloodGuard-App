import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, Zap, Bell, Globe, MessageSquare } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent leading-[1.1]"
          >
            Predict. Alert. Protect.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 px-4"
          >
            The world's most advanced AI-powered flood prediction and emergency alert system. 
            Saving lives through real-time data and intelligent forecasting.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link to="/register" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-emerald-900/20 text-center">
              Get Started Now
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all text-center">
              Login to Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="AI Prediction"
            desc="Real-time flood probability forecasting using Random Forest algorithms."
          />
          <FeatureCard 
            icon={<Bell className="w-8 h-8 text-red-400" />}
            title="Instant Alerts"
            desc="Multilingual SMS notifications sent directly to affected villagers."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8 text-emerald-400" />}
            title="Safety First"
            desc="Automated SOS triggers and shelter location mapping."
          />
          <FeatureCard 
            icon={<Globe className="w-8 h-8 text-blue-400" />}
            title="Multilingual"
            desc="Support for English, Marathi, and Hindi for inclusive safety."
          />
          <FeatureCard 
            icon={<MessageSquare className="w-8 h-8 text-indigo-400" />}
            title="AI Chatbot"
            desc="24/7 intelligent assistant for safety tips and risk analysis."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-800/50 border border-white/5 hover:border-emerald-500/30 transition-all group">
      <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
