import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { motion } from 'motion/react';
import { LogIn, Phone, Lock } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiUrl = (import.meta.env.VITE_API_URL || 'https://floodguard-real-time-flood-prediction.onrender.com').replace(/\/$/, '');
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        navigate(data.role === 'admin' ? '/admin' : '/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl">
            <LogIn className="w-10 h-10 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-slate-400 text-center mb-8">Login to access your flood dashboard</p>

        {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="+91 00000 00000"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-900/20">
            Login
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400">
          Don't have an account? <Link to="/register" className="text-emerald-400 hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
