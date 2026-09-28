import { Link } from 'react-router-dom';
import { ArrowRight, CloudLightning, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="space-y-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
          <Activity className="w-3 h-3" />
          Live Prototype Simulation
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          False-Onset & Break-Aware <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Hyperlocal Monsoon Intelligence
          </span>
        </h1>
        
        <p className="text-xl text-textMuted max-w-2xl mx-auto leading-relaxed">
          Predicting monsoon behavior 7–30 days ahead and translating climate uncertainty into actionable agricultural decisions.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Link to="/command-center" className="btn-primary flex items-center gap-2 text-lg px-8 py-3">
            Explore Forecast <ArrowRight className="w-5 h-5" />
          </Link>
          <button className="btn-secondary flex items-center gap-2 text-lg px-8 py-3">
            Open Risk Map
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="glass-panel p-6">
            <CloudLightning className="w-8 h-8 text-warning mb-4" />
            <h3 className="font-semibold text-lg mb-2">False-Onset Detection</h3>
            <p className="text-sm text-textMuted">Distinguish between temporary rainfall events and stable monsoon establishment.</p>
          </div>
          <div className="glass-panel p-6">
            <AlertTriangle className="w-8 h-8 text-danger mb-4" />
            <h3 className="font-semibold text-lg mb-2">Break & Revival Cycle</h3>
            <p className="text-sm text-textMuted">Predict dry spells and rainfall recovery up to 30 days in advance.</p>
          </div>
          <div className="glass-panel p-6 border-primary/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity className="w-24 h-24 text-primary" />
            </div>
            <Activity className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2">Decision Simulator</h3>
            <p className="text-sm text-textMuted">Evaluate "What if I sow today?" vs waiting 7 days based on probabilistic models.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
