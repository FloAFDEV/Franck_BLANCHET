
import React, { useState } from 'react';
import { Practitioner } from '../types';
import { Lock, UserCircle, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  practitioner: Practitioner;
  onUnlock: () => void;
}

const DUCK_AVATAR = "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/duck.png";

const LoginView: React.FC<LoginViewProps> = ({ practitioner, onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === practitioner.password) {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className={`w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300 ${error ? 'translate-x-2 bg-rose-50 dark:bg-rose-900/10' : ''}`}>
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="relative">
            {/* Avatar avec fond dynamique si c'est le canard par défaut */}
            <div 
              className={`w-28 h-28 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center transition-colors duration-300 ${practitioner.photo === DUCK_AVATAR ? 'p-3' : 'bg-primary/10'}`}
              style={{ backgroundColor: practitioner.photo === DUCK_AVATAR ? practitioner.themeColor : undefined }}
            >
              {practitioner.photo ? (
                <img src={practitioner.photo} alt="" className={`w-full h-full ${practitioner.photo === DUCK_AVATAR ? 'object-contain' : 'object-cover'}`} />
              ) : (
                <UserCircle size={56} className="text-primary" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-2xl shadow-lg border-2 border-white dark:border-slate-800">
              <Lock size={16} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">
              {practitioner.firstName || practitioner.lastName ? `Dr. ${practitioner.lastName}` : 'Session Verrouillée'}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-primary" /> Accès Sécurisé Local
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            <div className="space-y-1">
              <input 
                type="password" 
                placeholder="Entrez votre code" 
                autoFocus 
                className={`w-full p-4 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-[1.5rem] text-center text-2xl font-bold tracking-[0.5em] outline-none transition-all ${error ? 'border-rose-300' : 'border-slate-100 dark:border-slate-800 focus:border-primary'}`} 
                value={password} 
                onChange={(e) => { setError(false); setPassword(e.target.value); }} 
              />
              <p className="text-[9px] text-slate-400 font-medium italic mt-2">Le code défini dans vos réglages est requis.</p>
            </div>
            <button type="submit" className="w-full py-4 bg-primary text-white rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest shadow-xl hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2">
              Déverrouiller <ChevronRight size={18} />
            </button>
          </form>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={14} /> Code d'accès invalide
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
