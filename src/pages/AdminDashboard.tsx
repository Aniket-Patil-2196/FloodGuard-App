import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { motion } from 'motion/react';
import { Users, Bell, CloudRain, Activity, Send, Play, Loader2 } from 'lucide-react';
import { API_URL } from '../config';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [alertForm, setAlertForm] = useState({ village: '', riskLevel: 'HIGH', message: '', broadcastToAll: false });
  const [predForm, setPredForm] = useState({ village: '', rainfall: 50, river_level: 5, elevation: 550, soil_moisture: 40, slope: 2 });
  const [loadingAlert, setLoadingAlert] = useState(false);
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingSMS, setLoadingSMS] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await fetch(`${API_URL}/api/auth/users`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        setUsers(await usersRes.json());

        const alertsRes = await fetch(`${API_URL}/api/alerts`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        setAlerts(await alertsRes.json());

        const predRes = await fetch(`${API_URL}/api/predictions`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        setPredictions(await predRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [user]);

  const handleSendAlert = async (e) => {
    e.preventDefault();
    setLoadingAlert(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(alertForm)
      });
      if (res.ok) {
        alert('Alert sent successfully!');
        setAlertForm({ village: '', riskLevel: 'HIGH', message: '', broadcastToAll: false });
        // Refresh alerts
        const alertsRes = await fetch(`${API_URL}/api/alerts`, { headers: { 'Authorization': `Bearer ${user.token}` } });
        setAlerts(await alertsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlert(false);
    }
  };

  const handleTriggerPrediction = async (e) => {
    e.preventDefault();
    setLoadingPred(true);
    try {
      const res = await fetch(`${API_URL}/api/predictions/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify(predForm)
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Prediction complete! Risk: ${data.riskLevel}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPred(false);
    }
  };

  const handleTestSMS = async () => {
    setLoadingSMS(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts/test-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` },
        body: JSON.stringify({ phone: user.phone })
      });
      if (res.ok) {
        alert('Test SMS sent to your phone!');
      } else {
        alert('Failed to send test SMS.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSMS(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-orange-400">Admin Control Center</h1>
          <p className="text-slate-400">Manage users, trigger AI predictions, and broadcast emergency alerts.</p>
        </div>
        <button 
          onClick={handleTestSMS}
          disabled={loadingSMS}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-bold transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingSMS ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loadingSMS ? 'Sending...' : 'Test My SMS'}
        </button>
      </header>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-400" />} label="Total Users" value={users.length} />
        <StatCard icon={<Bell className="text-red-400" />} label="Active Alerts" value={alerts.length} />
        <StatCard icon={<CloudRain className="text-cyan-400" />} label="Rainfall (Avg)" value="12 mm" />
        <StatCard icon={<Activity className="text-emerald-400" />} label="AI Status" value="Online" />
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Send Alert Form */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Send className="w-6 h-6 text-orange-400" />
            Send SOS Alert
          </h3>
          <form onSubmit={handleSendAlert} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target Village</label>
              <input 
                value={alertForm.village}
                onChange={(e) => setAlertForm({...alertForm, village: e.target.value})}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4 disabled:opacity-50" 
                placeholder="e.g. Sangli" 
                required={!alertForm.broadcastToAll}
                disabled={alertForm.broadcastToAll}
              />
            </div>
            <div className="py-2">
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={alertForm.broadcastToAll}
                  onChange={(e) => setAlertForm({...alertForm, broadcastToAll: e.target.checked})}
                />
                <span className="checkmark"></span>
                Broadcast to ALL Registered Users
              </label>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Risk Level</label>
              <select 
                value={alertForm.riskLevel}
                onChange={(e) => setAlertForm({...alertForm, riskLevel: e.target.value})}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4"
              >
                <option>LOW</option>
                <option>MODERATE</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Message</label>
              <textarea 
                value={alertForm.message}
                onChange={(e) => setAlertForm({...alertForm, message: e.target.value})}
                className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4 h-24" 
                placeholder="Emergency instructions..." required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loadingAlert}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingAlert ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loadingAlert ? 'Broadcasting...' : 'Broadcast Alert (SMS)'}
            </button>
          </form>
        </div>

        {/* AI Trigger Form */}
        <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Play className="w-6 h-6 text-emerald-400" />
            Trigger AI Prediction
          </h3>
          <form onSubmit={handleTriggerPrediction} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">Village</label>
              <input value={predForm.village} onChange={(e) => setPredForm({...predForm, village: e.target.value})} className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4" required />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Rainfall (mm)</label>
              <input type="number" value={predForm.rainfall} onChange={(e) => setPredForm({...predForm, rainfall: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">River Level (m)</label>
              <input type="number" value={predForm.river_level} onChange={(e) => setPredForm({...predForm, river_level: Number(e.target.value)})} className="w-full bg-slate-800 border border-white/5 rounded-xl py-3 px-4" />
            </div>
            <button 
              type="submit" 
              disabled={loadingPred}
              className="col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold transition-all mt-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingPred ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {loadingPred ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          </form>
        </div>
      </div>

      {/* User Table */}
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold mb-6">Registered Users</h3>
          <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-sm">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Phone</th>
                  <th className="pb-4">Village</th>
                  <th className="pb-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u._id} className="text-sm">
                    <td className="py-4 font-medium">{u.name}</td>
                    <td className="py-4 text-slate-400">{u.phone}</td>
                    <td className="py-4 text-slate-400">{u.village}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${u.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
          <h3 className="text-2xl font-bold mb-6">Alert History</h3>
          <div className="max-h-[350px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {alerts.map(a => (
              <div 
                key={a._id} 
                className="p-5 rounded-xl bg-slate-800 border border-white/5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-semibold text-lg text-white">{a.village}</h4>
                    <span className={`w-fit px-2 py-1 rounded-full text-[10px] font-bold ${
                      a.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                      a.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {a.riskLevel}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mt-2">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 flex items-center gap-4 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default">
      <div className="p-3 bg-slate-800 rounded-2xl">{icon}</div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
