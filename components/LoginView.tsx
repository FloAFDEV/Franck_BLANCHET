
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
      // Petit feedback haptique visuel
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className={`w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl border border-slate-100 transition-all duration-300 ${error ? 'translate-x-2 bg-rose-50' : ''}`}>
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-24 h-24 rounded-[2rem] bg-primary-soft border-4 border-white shadow-xl overflow-hidden flex items-center justify-center text-primary relative">
          {practitioner.photo ? (
            <img src={practitioner.photo} alt="Praticien" className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={48} />
          )}
          <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-sm">
            <Lock size={14} className="text-slate-400" />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
            Bonjour Dr. {practitioner.lastName || 'Praticien'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Espace de soin sécurisé
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative group">
            <input 
              type="password"
              placeholder="Mot de passe"
              autoFocus
              className={`w-full p-5 bg-slate-50 border-2 rounded-[1.5rem] text-center text-lg font-bold tracking-widest focus:outline-none focus:bg-white transition-all ${error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-100 focus:border-primary'}`}
              value={password}
              onChange={(e) => {
                setError(false);
                setPassword(e.target.value);
              }}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-soft hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            Accéder au cabinet
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={14} /> Mot de passe incorrect
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;
