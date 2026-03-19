import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/10 pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tighter text-white">FloodGuard</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              AI-powered flood monitoring and early warning system. Dedicated to community safety and climate resilience.
            </p>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Home</Link></li>
              <li><Link to="/dashboard" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Dashboard</Link></li>
              <li><Link to="/alerts" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Alerts</Link></li>
              <li><Link to="/chat" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">AI Assistant</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-white font-bold mb-6">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Help Center</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-slate-400 hover:text-blue-400 text-sm transition-colors">Emergency Guide</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs text-center md:text-left">
          <p>© 2026 FloodGuard AI. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Built for safety and community resilience. 
            <span className="w-1 h-1 bg-slate-700 rounded-full" /> 
            Version 2.0.4
          </p>
        </div>
      </div>
    </footer>
  );
}
