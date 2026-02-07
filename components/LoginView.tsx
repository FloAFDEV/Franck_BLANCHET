
import React, { useState } from 'react';
import { Practitioner } from '../types';
import { Lock, UserCircle, ChevronRight, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  practitioner: Practitioner;
  onUnlock: () => void;
}

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
    <div className={`w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300 ${error ? 'translate-x-2 bg-rose-50 dark:bg-rose-900/10' : ''}`}>
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-primary-soft border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center text-primary relative">
          {practitioner.photo ? <img src={practitioner.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={40} />}
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-1 rounded-full shadow-sm"><Lock size={10} className="text-slate-400" /></div>
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight">Dr. {practitioner.lastName}</h2>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Espace sécurisé</p>
        </div>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input type="password" placeholder="Code d'accès" autoFocus className={`w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl text-center text-lg font-bold tracking-widest outline-none transition-all ${error ? 'border-rose-300' : 'border-slate-100 dark:border-slate-800 focus:border-primary'}`} value={password} onChange={(e) => { setError(false); setPassword(e.target.value); }} />
          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2">Déverrouiller <ChevronRight size={16} /></button>
        </form>
        {error && <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest animate-in fade-in"><AlertCircle size={12} /> Incorrect</div>}
      </div>
    </div>
  );
};

export default LoginView;
