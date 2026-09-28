import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { CloudRain, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

const Layout = () => {
  const routerLocation = useLocation();
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/command-center', label: 'Dashboard' },
    { to: '/map', label: 'Risk Map' },
    { to: '/false-onset', label: 'False Onset' },
    { to: '/simulator', label: 'Simulator' },
    { to: '/sowing-window', label: 'Sowing' },
    { to: '/officer', label: 'Officer Mode' },
    { to: '/methodology', label: 'Methodology' },
    { to: '/history', label: 'History' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-textMain">
      <header className="glass-panel sticky top-0 z-50 rounded-none border-t-0 border-l-0 border-r-0 border-b-panelBorder px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <CloudRain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-textMain leading-tight">MONSOON-X</h1>
            <p className="text-[10px] text-primary tracking-widest uppercase font-semibold">Climate Command Center</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex gap-4 items-center">
          {navLinks.map((link) => {
            const isActive = routerLocation.pathname === link.to;
            const isOfficer = link.to === '/officer';
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm transition-colors py-1 ${
                  isActive
                    ? 'text-white font-semibold border-b-2 border-primary'
                    : isOfficer
                    ? 'text-primary hover:text-white font-semibold'
                    : 'text-textMuted hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          
          <div className="h-4 w-px bg-panelBorder mx-2"></div>
          
          {/* User / Mode Button */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className="flex items-center gap-1.5 btn-primary py-1.5 px-3 text-xs"
            aria-label="User account or demo mode switcher"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{user?.isDemo ? 'Demo Mode' : user?.fullName?.split(' ')[0] || 'Account'}</span>
            <span className="text-[10px] opacity-80 uppercase font-mono">({user?.role})</span>
          </button>
        </nav>

        {/* Mobile Hamburger & Quick Status */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setIsAuthOpen(true)}
            className="text-xs bg-panel border border-panelBorder text-primary px-2.5 py-1.5 rounded-lg flex items-center gap-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="capitalize">{user?.role}</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-panel border border-panelBorder text-textMuted hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-panel rounded-none border-x-0 border-t-0 border-b-panelBorder p-4 space-y-2 z-40">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-panelBorder/50">
            {navLinks.map((link) => {
              const isActive = routerLocation.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/20 text-white font-semibold border border-primary/40'
                      : 'bg-panel/40 text-textMuted hover:text-white hover:bg-panel'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-textMuted">Session: {user?.fullName}</span>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsAuthOpen(true);
              }}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Switch Role / Auth
            </button>
          </div>
        </div>
      )}

      {/* Global disclaimer header notice */}
      <div className="bg-primary/5 border-b border-panelBorder/40 px-4 py-1.5 text-center text-[11px] text-textMuted flex items-center justify-center gap-2 flex-wrap">
        <span className="text-accent font-semibold flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          Probabilistic Agro-Climatic Advisory:
        </span>
        <span>All outputs represent calibrated risk probabilities to support farming decisions, not absolute forecasts.</span>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-panelBorder/40 bg-panel/30 text-textMuted py-6 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-primary" />
            <span className="font-semibold text-textMain">Monsoon-X Hyperlocal Intelligence</span>
          </div>
          <div>
            Data sources: Open-Meteo API &middot; OpenStreetMap &middot; Supabase RLS &middot; IMD Rainfall Standards
          </div>
          <div className="text-[11px] text-textMuted">
            &copy; 2026 Monsoon-X. Engineered for Agricultural Decision Support.
          </div>
        </div>
      </footer>

      {/* Authentication and Profile Switcher Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export default Layout;
