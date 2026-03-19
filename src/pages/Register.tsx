import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { motion } from 'motion/react';
import { UserPlus, Phone, Lock, User, MapPin, Users, Dog, Languages } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', village: '', language: 'English',
    familyMembers: 0, animals: 0, latitude: 0, longitude: 0
  });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const apiUrl = import.meta.env.VITE_API_URL || 'https://floodguard-real-time-flood-prediction.onrender.com';
    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        login(data);
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registration failed');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl">
            <UserPlus className="w-10 h-10 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
        <p className="text-slate-400 text-center mb-8">Join the network to stay safe from floods</p>

        {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
                  placeholder="your@email.com" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  name="phone" 
                  value={formData.phone}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
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
                  name="password" 
                  value={formData.password}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Village</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  name="village" 
                  value={formData.village}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Preferred Language</label>
              <div className="relative">
                <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <select 
                  name="language" 
                  value={formData.language}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                >
                  <option>English</option>
                  <option>Marathi</option>
                  <option>Hindi</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Family Members</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="number" 
                  name="familyMembers" 
                  value={formData.familyMembers}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Animals/Livestock</label>
              <div className="relative">
                <Dog className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="number" 
                  name="animals" 
                  value={formData.animals}
                  onChange={handleChange} 
                  className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-500/50" 
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-900/20 mt-4">
              Register
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-400">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Login here</Link>
        </p>
      </motion.div>
    </div>
  );
}
