
import React, { useState } from 'react';
import { db } from '../db';
import { Session } from '../types';
import { Save, X, Calendar, Stethoscope, ClipboardList, Activity } from 'lucide-react';

interface SessionFormProps {
  patientId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const SessionForm: React.FC<SessionFormProps> = ({ patientId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Session>>({
    date: new Date().toISOString().split('T')[0], hdlm: '', tests: '', treatment: '', advice: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.sessions.add({ ...formData, patientId, createdAt: Date.now() } as Session);
    onSuccess();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
          <Stethoscope size={16} className="text-primary" /> Nouveau Compte Rendu
        </h3>
        <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-1/3 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Calendar size={12} /> Date Séance</label>
            <input required type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none font-semibold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><ClipboardList size={12} /> Motif / HDLM</label>
            <textarea required rows={1} className="w-full p-2 bg-slate-50 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none" placeholder="..." value={formData.hdlm} onChange={e => setFormData({...formData, hdlm: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Activity size={12} /> Tests Cliniques</label>
            <textarea rows={3} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none" value={formData.tests} onChange={e => setFormData({...formData, tests: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Save size={12} /> Traitement</label>
            <textarea rows={3} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none" value={formData.treatment} onChange={e => setFormData({...formData, treatment: e.target.value})} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Conseils & Recommandations</label>
          <textarea rows={2} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none" value={formData.advice} onChange={e => setFormData({...formData, advice: e.target.value})} />
        </div>

        <button type="submit" className="w-full py-3 bg-primary text-white font-bold text-xs uppercase rounded-lg hover:brightness-95 active:scale-[0.99] transition-all shadow-sm flex items-center justify-center gap-2">
          <Save size={16} /> Enregistrer la séance
        </button>
      </form>
    </div>
  );
};

export default SessionForm;
