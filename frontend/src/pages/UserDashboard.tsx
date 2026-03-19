import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { motion } from 'motion/react';
import { CloudRain, Thermometer, Droplets, Home as HomeIcon, Send, Bot, ShieldAlert, Activity, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../config';

const CACHE_KEY_WEATHER = 'floodguard_weather_cache';
const CACHE_KEY_ALERTS = 'floodguard_alerts_cache';
const CACHE_KEY_NEWS = 'floodguard_news_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`shimmer rounded-2xl ${className}`} />
);

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatMsg, setChatMsg] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getCachedData = (key: string) => {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  };

  const setCachedData = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  };

  const fetchNews = useCallback(async () => {
    const city = localStorage.getItem("city") || "Sangli";
    
    try {
      setNewsLoading(true);
      const newsRes = await fetch(`${API_URL}/api/weather/news?city=${city}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      
      if (newsRes.status === 401) {
        logout();
        return;
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.success && newsData.news) {
          setNews(newsData.news);
          setCachedData(CACHE_KEY_NEWS, newsData.news);
        }
      }
    } catch (err) {
      console.error('News fetch error:', err);
    } finally {
      setNewsLoading(false);
    }
  }, [user, logout]);

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const cachedWeather = getCachedData(CACHE_KEY_WEATHER);
      const cachedAlerts = getCachedData(CACHE_KEY_ALERTS);
      const cachedNews = getCachedData(CACHE_KEY_NEWS);

      if (cachedWeather) setWeather(cachedWeather);
      if (cachedAlerts) setAlerts(cachedAlerts);
      if (cachedNews) setNews(cachedNews);

      if (cachedWeather && cachedAlerts) {
        setLoading(false);
        // Still fetch news in background if not cached
        if (!cachedNews) fetchNews();
        return;
      }
    }

    setLoading(true);
    const city = localStorage.getItem("city") || "Sangli";
    console.log("User city:", city);

    const fetchWeather = async () => {
      try {
        const weatherRes = await fetch(`${API_URL}/api/weather/${city}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (weatherRes.status === 401) {
          logout();
          return;
        }

        const result = await weatherRes.json();
        if (result.success && result.data) {
          setWeather(result.data);
          setCachedData(CACHE_KEY_WEATHER, result.data);
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };

    const fetchAlerts = async () => {
      try {
        const alertsRes = await fetch(`${API_URL}/api/alerts`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (alertsRes.status === 401) {
          logout();
          return;
        }

        const alertsData = await alertsRes.json();
        const alertsArray = Array.isArray(alertsData) ? alertsData : (alertsData.alerts || []);
        const filteredAlerts = alertsArray.filter(a => a.village === user.village || a.village === 'All Villages');
        setAlerts(filteredAlerts);
        setCachedData(CACHE_KEY_ALERTS, filteredAlerts);
      } catch (err) {
        console.error('Alerts fetch error:', err);
      }
    };

    try {
      // Parallel execution for weather and alerts
      await Promise.all([fetchWeather(), fetchAlerts()]);
    } finally {
      setLoading(false);
      // Fetch news with a slight delay to prioritize main content
      setTimeout(() => fetchNews(), 500);
    }
  }, [user, fetchNews, logout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(true);
    setIsRefreshing(false);
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ 
        message: chatMsg, 
        language: user.language,
        location: user.village
      })
    });
    const data = await res.json();
    setChatReply(data.reply);
    setChatMsg('');
  };

  const chartData = [
    { name: '10:00', rain: 2 },
    { name: '11:00', rain: 5 },
    { name: '12:00', rain: 15 },
    { name: '13:00', rain: 8 },
    { name: '14:00', rain: 12 },
    { name: '15:00', rain: weather?.rainfall || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-white">Namaste, {user.name}</h1>
          <p className="text-slate-400 text-lg">Monitoring flood risk for <span className="text-blue-400 font-semibold">{user.city || user.village}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-lg shadow-emerald-500/5">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-semibold tracking-wide uppercase text-xs">System Active</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {loading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard 
              icon={<CloudRain className="w-6 h-6 text-blue-400" />}
              label="Current Rainfall"
              value={weather ? `${weather.rainfall} mm` : "0 mm"}
              desc="Last hour"
            />
            <StatCard 
              icon={<Thermometer className="w-6 h-6 text-orange-400" />}
              label="Temperature"
              value={weather ? `${weather.temperature}°C` : "24°C"}
              desc="Real-time"
            />
            <StatCard 
              icon={<Droplets className="w-6 h-6 text-cyan-400" />}
              label="Humidity"
              value={weather ? `${weather.humidity}%` : "65%"}
              desc="Atmospheric"
            />
          </>
        )}
      </div>

      {/* Live Weather Analysis */}
      <section className="weather-analysis shadow-2xl shadow-blue-500/5">
        {loading ? (
          <div className="space-y-6">
            <div className="flex justify-between">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
            <Skeleton className="h-24" />
          </div>
        ) : weather && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
                <CloudRain className="w-8 h-8 text-blue-400" />
                Live Weather Analysis
              </h2>
              <div className={`risk-indicator px-4 py-1.5 rounded-full border shadow-lg ${
                weather.rainfall > 50 || weather.humidity > 85 ? 'risk-high shadow-red-500/10' :
                weather.rainfall > 20 ? 'risk-medium shadow-orange-500/10' : 'risk-low shadow-emerald-500/10'
              }`}>
                <ShieldAlert className="w-4 h-4" />
                {weather.rainfall > 50 || weather.humidity > 85 ? 'High Risk' :
                 weather.rainfall > 20 ? 'Moderate Risk' : 'Low Risk'}
              </div>
            </div>

            <div className="analysis-card">
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Location</p>
                <p className="text-lg font-bold text-slate-200">{weather?.name || (localStorage.getItem("city") || "Sangli")}</p>
              </div>
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Temperature</p>
                <p className="text-lg font-bold text-slate-200">{weather?.temperature}°C</p>
              </div>
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Humidity</p>
                <p className="text-lg font-bold text-slate-200">{weather?.humidity}%</p>
              </div>
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Condition</p>
                <p className="text-lg font-bold text-slate-200 capitalize">{weather?.condition || 'Clear Sky'}</p>
              </div>
            </div>

            <div className="risk-analysis mt-8 border-l-4 border-blue-500 bg-blue-500/5 p-6 rounded-r-2xl">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-blue-400">
                <Activity className="w-5 h-5" />
                Flood Risk Assessment
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                {weather.rainfall > 50 || weather.humidity > 85 
                  ? "⚠️ High flood risk detected. Heavy rainfall and high humidity levels are creating dangerous conditions. Residents in low-lying areas should prepare for potential evacuation."
                  : weather.rainfall > 20 
                  ? "🔔 Moderate flood risk. Rainfall levels are elevated. Stay alert for official updates and monitor river levels closely."
                  : "✅ Low flood risk. Current weather conditions are stable. No immediate threat of flooding is expected in the next 24 hours."}
              </p>
            </div>
          </>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Chart */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              Rainfall Trend (mm)
            </h3>
            <div className="h-80 w-full relative min-h-[320px]">
              {loading ? (
                <Skeleton className="w-full h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="rain" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Recent Alerts
              </h3>
              <Link to="/alerts" className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">View All</Link>
            </div>
            
            <div className="fade-bottom">
              <div className="space-y-5 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar pb-10">
                {loading ? (
                  <>
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </>
                ) : alerts.length > 0 ? alerts.map(alert => (
                  <div key={alert._id} className="p-5 rounded-2xl bg-slate-800/50 border border-white/5 border-l-4 border-red-500 hover:bg-slate-800 transition-colors shadow-md">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-red-400 text-sm tracking-wide uppercase">{alert.riskLevel}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium">{alert.message}</p>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-slate-500 italic">No active alerts for your village.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          {/* Chatbot */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 flex flex-col h-[450px] relative overflow-hidden group shadow-xl">
            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <Bot className="w-6 h-6 text-blue-400" />
              FloodGuard AI
            </h3>
            <div className="flex-1 overflow-y-auto mb-6 space-y-5 custom-scrollbar pr-2">
              <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 border border-white/5 leading-relaxed shadow-sm">
                Hello! I am your advanced flood safety assistant. I can analyze real-time data and provide multi-lingual support.
              </div>
              {chatReply && (
                <div className="bg-blue-600/10 p-4 rounded-2xl rounded-tl-none text-sm border border-blue-500/20 text-blue-100 leading-relaxed shadow-sm">
                  <ReactMarkdown>{chatReply}</ReactMarkdown>
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="relative">
              <input 
                type="text" 
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder="Ask about flood safety..."
                className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm placeholder:text-slate-500"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                <Send className="w-4 h-4" />
              </button>
            </form>
            <Link to="/chat" className="mt-5 text-[10px] text-center text-slate-500 hover:text-blue-400 transition-colors uppercase tracking-widest font-bold">
              Open Full AI Interface
            </Link>
          </div>

          {/* Shelters */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
              <HomeIcon className="w-6 h-6 text-blue-400" />
              Nearest Shelters
            </h3>
            <div className="space-y-4">
              <ShelterItem name="Village Primary School" dist="0.5 km" status="Open" />
              <ShelterItem name="Community Hall" dist="1.2 km" status="Open" />
              <ShelterItem name="Zilla Parishad Office" dist="2.5 km" status="Full" />
            </div>
          </div>
        </div>
      </div>

      {/* News Section */}
      <section className="py-10">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold flex items-center gap-4 text-white">
            <span className="text-4xl">📰</span> Latest Flood & Weather News
          </h2>
          {news.length > 0 && (
            <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-4 py-2 rounded-full border border-white/5 uppercase tracking-widest">
              General Updates
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {newsLoading ? (
            <>
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </>
          ) : Array.isArray(news) && news.length > 0 ? news.map((item, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden hover:translate-y-[-8px] transition-all duration-500 group shadow-xl hover:shadow-blue-500/10"
            >
              {item.urlToImage && (
                <div className="h-52 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src={item.urlToImage} 
                    alt="news" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-8 space-y-5">
                <h3 className="text-xl font-bold leading-tight group-hover:text-blue-400 transition-colors line-clamp-2 text-white">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-sm group/link uppercase tracking-wider"
                >
                  Read Full Story 
                  <span className="group-hover/link:translate-x-2 transition-transform">→</span>
                </a>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-20 bg-slate-900/50 rounded-[2rem] border border-dashed border-white/10">
              <p className="text-slate-500 italic text-lg">No latest news available for this region.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, desc }) {
  return (
    <div className="p-8 rounded-[2rem] bg-slate-900 border border-white/10 shadow-lg hover:bg-slate-800/80 transition-all group">
      <div className="flex items-center gap-6 mb-6">
        <div className="p-4 bg-slate-800 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner">{icon}</div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-medium">{desc}</p>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      </div>
    </div>
  );
}

function ShelterItem({ name, dist, status }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-all group">
      <div>
        <p className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">{name}</p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{dist}</p>
      </div>
      <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl shadow-sm ${status === 'Open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
        {status}
      </span>
    </div>
  );
}
