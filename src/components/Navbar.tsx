import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Droplets, LayoutDashboard, Map as MapIcon, Bell, LogOut, ShieldAlert, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-400">
        <Droplets className="w-8 h-8" />
        <span>FloodGuard AI</span>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link to="/dashboard" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link to="/map" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
              <MapIcon className="w-4 h-4" />
              <span>Map</span>
            </Link>
            <Link to="/alerts" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
              <Bell className="w-4 h-4" />
              <span>Alerts</span>
            </Link>
            <Link to="/chat" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chat</span>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors">
                <ShieldAlert className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-emerald-400">Login</Link>
            <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg transition-colors">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
