import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Droplets, LayoutDashboard, Map as MapIcon, Bell, LogOut, ShieldAlert, MessageSquare, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = user ? [
    { to: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "Dashboard" },
    { to: "/map", icon: <MapIcon className="w-4 h-4" />, label: "Map" },
    { to: "/alerts", icon: <Bell className="w-4 h-4" />, label: "Alerts" },
    { to: "/chat", icon: <MessageSquare className="w-4 h-4" />, label: "AI Chat" },
  ] : [];

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-400" onClick={() => setIsOpen(false)}>
          <Droplets className="w-8 h-8" />
          <span>FloodGuard AI</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
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

        {/* Mobile Menu Button */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={toggleMenu}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-white/10 px-6 py-8 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
          {user ? (
            <>
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-3 text-lg hover:text-emerald-400 transition-colors" onClick={() => setIsOpen(false)}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-3 text-lg text-orange-400 hover:text-orange-300 transition-colors" onClick={() => setIsOpen(false)}>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <hr className="border-white/5" />
              <button onClick={handleLogout} className="flex items-center gap-3 text-lg text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-lg hover:text-emerald-400" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded-xl text-center font-semibold transition-colors" onClick={() => setIsOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
