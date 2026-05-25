import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Mail, Lock, User, Sparkles, AlertCircle, Info, ShieldCheck, LogIn, Keyboard, Play } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../lib/firebase';

interface AuthDialogProps {
  onClose: () => void;
}

export function AuthDialog({ onClose }: AuthDialogProps) {
  const { simulateLogin } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          throw new Error("Display Name / Artist Name is required.");
        }
        await signUpWithEmail(email, password, displayName);
        onClose();
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err: any) {
      console.error("Auth error Details:", err);
      let errMsg = err.message || JSON.stringify(err);
      
      if (err.code === 'auth/operation-not-allowed' || errMsg.includes('operation-not-allowed')) {
        setError(
          "Firebase Email/Password provider is not yet enabled in your Firebase Console. " +
          "You can enable it in the console, or click 'Simulate Sandbox Studio' below to log in instantly without any cloud setup!"
        );
      } else if (err.code === 'auth/invalid-credential' || errMsg.includes('invalid-credential')) {
        setError("Invalid credentials. Please verify your email and password.");
      } else if (err.code === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
        setError("This email is already registered. Try logging in instead.");
      } else if (err.code === 'auth/weak-password' || errMsg.includes('weak-password')) {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
        setError("Invalid email address format.");
      } else {
        setError(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateAndGo = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const chosenName = displayName.trim() || email.split('@')[0] || 'Artist Fallback';
      await simulateLogin(chosenName, email);
      onClose();
    } catch (err: any) {
      setError("Failed to simulate credential: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleBackup = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setError(err.message || "Google Authenticate aborted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-[0_12px_60px_rgba(0,0,0,0.9)] text-left relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Head branding header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-black text-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] select-none">G</div>
            <div>
              <h2 className="text-sm font-black text-emerald-400 tracking-widest uppercase">GROOVE STAGE</h2>
              <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wide">Artist Frequency Node</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2">
            {isRegisterMode ? "REGISTER NEW COORDINATES" : "BRIDGE NATIVE SIGNAL"}
          </h3>
          <p className="text-zinc-500 text-xs">
            {isRegisterMode 
              ? "Join the local Jakarta & Bandung musician collective instantly." 
              : "Log in with your app credentials to connect and negotiate gear."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-400 leading-relaxed space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.includes("provider is not yet enabled") && (
              <div className="mt-2 pt-2 border-t border-red-500/10 flex flex-col gap-2">
                <p className="text-zinc-500 font-bold">Recommended action:</p>
                <button
                  type="button"
                  onClick={handleSimulateAndGo}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wide transition-all w-fit"
                >
                  ⚡ Simulate Sandbox Studio (Instant Bypass)
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-400" /> Display Name / Studio Identity
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Andi Wijaya" 
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-400" /> Email Address
            </label>
            <input 
              type="email" 
              required
              placeholder="you@email.com" 
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> Password
            </label>
            <input 
              type="password" 
              required
              placeholder={isRegisterMode ? "Min 6 characters..." : "Enter your password..."} 
              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 text-black font-black uppercase text-xs tracking-wider py-4 rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.2)] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? "Establishing security..." : isRegisterMode ? "Generate credentials" : "Open Tunnel System"}
          </button>
        </form>

        {/* Sandbox Simulation alternative action card */}
        <div className="bg-zinc-900/50 rounded-2xl p-4.5 border border-white/5 space-y-3.5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#FFFF00] shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <h4 className="text-xs font-black text-[#FFFF00] uppercase tracking-wide">Developer Sandbox Session</h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold">
                Bypass standard Firebase registration entirely & immediately broadcast as Andy or donny locally in offline-first mode.
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleSimulateAndGo}
            className="w-full bg-white/5 hover:bg-emerald-500 border border-white/5 hover:border-emerald-400 text-white hover:text-black font-black py-2.5 rounded-xl transition-all uppercase tracking-wide text-[9px] flex items-center justify-center gap-1.5"
          >
            <Keyboard className="w-3.5 h-3.5" /> Initialize In-App Simulated Profile
          </button>
        </div>

        {/* Footer info/controls toggles */}
        <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-500 gap-3">
          <button 
            type="button"
            className="hover:text-white underline font-semibold transition-colors"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(null);
            }}
          >
            {isRegisterMode ? "Already have a coordinate? Sign In" : "Don't have an account? Sign Up"}
          </button>

          {/* Backup Google login just in case */}
          <button 
            type="button"
            onClick={handleGoogleBackup}
            className="hover:text-white flex items-center gap-1 font-semibold transition-colors text-[10px]"
          >
            Or authenticate with Google →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
