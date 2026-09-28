import { Outlet, Link } from 'react-router-dom';
import { CloudRain } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="glass-panel sticky top-0 z-50 rounded-none border-t-0 border-l-0 border-r-0 border-b-panelBorder px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <CloudRain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-textMain leading-tight">MONSOON-X</h1>
            <p className="text-[10px] text-primary tracking-widest uppercase font-semibold">Climate Command Center</p>
          </div>
        </Link>
        <nav className="flex gap-4 items-center">
          <Link to="/command-center" className="text-sm text-textMuted hover:text-white transition-colors">Dashboard</Link>
          <Link to="/map" className="text-sm text-textMuted hover:text-white transition-colors">Map</Link>
          <Link to="/false-onset" className="text-sm text-textMuted hover:text-white transition-colors">False Onset</Link>
          <Link to="/simulator" className="text-sm text-textMuted hover:text-white transition-colors">Simulator</Link>
          <Link to="/sowing-window" className="text-sm text-textMuted hover:text-white transition-colors">Sowing</Link>
          <Link to="/officer" className="text-sm text-textMuted hover:text-white transition-colors text-primary font-semibold">Officer Mode</Link>
          <Link to="/methodology" className="text-sm text-textMuted hover:text-white transition-colors">Methodology</Link>
          <div className="h-4 w-px bg-panelBorder mx-2"></div>
          <button className="btn-primary py-1.5 px-4 text-sm">Demo</button>
        </nav>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
