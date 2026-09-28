import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserCheck, ShieldCheck, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, switchRole } = useAuth();
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone || '');
  const [language, setLanguage] = useState<'hi' | 'en'>(user.language || 'hi');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      phone,
      language,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6 relative border-panelBorder shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-textMuted hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-textMain">Farmer &amp; Officer Profile</h2>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-semibold uppercase">
              Demo Mode &middot; Local Storage
            </span>
            <span className="text-xs text-textMuted">Zero external keys needed</span>
          </div>
        </div>

        {/* Quick Role Switcher */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-textMuted uppercase tracking-wider block mb-2">
            Active Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => switchRole('farmer')}
              className={`p-3 rounded-lg border text-left transition-all ${
                user.role === 'farmer'
                  ? 'border-primary bg-primary/15 text-white shadow-sm'
                  : 'border-panelBorder bg-panel hover:border-primary/40 text-textMuted hover:text-white'
              }`}
            >
              <div className="font-semibold text-sm">Farmer Mode</div>
              <div className="text-[11px] text-textMuted mt-0.5">Hyperlocal onset &amp; sowing advisory</div>
            </button>

            <button
              type="button"
              onClick={() => switchRole('officer')}
              className={`p-3 rounded-lg border text-left transition-all ${
                user.role === 'officer'
                  ? 'border-primary bg-primary/15 text-white shadow-sm'
                  : 'border-panelBorder bg-panel hover:border-primary/40 text-textMuted hover:text-white'
              }`}
            >
              <div className="font-semibold text-sm">Officer Mode</div>
              <div className="text-[11px] text-textMuted mt-0.5">Block matrix &amp; SMS dispatch</div>
            </button>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="space-y-3 pt-2 border-t border-panelBorder/40">
          <div>
            <label className="text-xs text-textMuted block mb-1">Full Name / किसान का नाम</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Kailash Choudhary"
              className="w-full bg-background border border-panelBorder rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-textMuted block mb-1">Phone Number (For Advisory SMS)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98290 12345"
              className="w-full bg-background border border-panelBorder rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <div>
            <label className="text-xs text-textMuted block mb-1">Advisory Language / भाषा</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'hi' | 'en')}
              className="w-full bg-background border border-panelBorder rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary"
            >
              <option value="hi">हिंदी (Hindi - Recommended)</option>
              <option value="en">English</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full btn-primary py-2.5 text-sm font-semibold mt-3 flex items-center justify-center gap-1.5"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Profile Saved!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save Profile Locally</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
