import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { motion } from 'motion/react';
import { Bell, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/alerts', {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-2">Emergency Alerts</h1>
        <p className="text-slate-400">All broadcasted flood warnings and safety instructions.</p>
      </header>

      <div className="space-y-8">
        {alerts.length > 0 ? alerts.map((alert, idx) => (
          <motion.div 
            key={alert._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-8 rounded-[2rem] border shadow-xl hover:translate-y-[-4px] transition-all duration-300 ${
              alert.riskLevel === 'CRITICAL' ? 'bg-red-500/5 border-red-500/20 shadow-red-500/5' :
              alert.riskLevel === 'HIGH' ? 'bg-orange-500/5 border-orange-500/20 shadow-orange-500/5' :
              'bg-slate-900 border-white/10 shadow-black/20'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className={`p-4 rounded-2xl shadow-inner ${
                alert.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                alert.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                'bg-slate-800 text-blue-400'
              }`}>
                {alert.riskLevel === 'CRITICAL' ? <ShieldAlert className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{alert.village}</h3>
                  <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                    {new Date(alert.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-lg font-medium">
                  {alert.message}
                </p>
                <div className="pt-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border shadow-sm ${
                    alert.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    alert.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {alert.riskLevel} RISK LEVEL
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-24 bg-slate-900 rounded-[2.5rem] border border-dashed border-white/10">
            <Info className="w-16 h-16 text-slate-700 mx-auto mb-6" />
            <p className="text-slate-500 text-xl font-medium italic">No emergency alerts have been broadcasted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
