
import React, { useState } from 'react';
import { db } from '../db';
import { Session } from '../types';
import { Save, X, Calendar, Stethoscope, ClipboardList, Activity, HeartPulse } from 'lucide-react';

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

  const TextAreaField = ({ label, value, onChange, placeholder = "", icon: Icon, required = false }: any) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={12} className="text-primary/60" />} {label}
      </label>
      <textarea required={required} rows={3} placeholder={placeholder} className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm transition-all" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Stethoscope size={16} className="text-primary" /> Nouveau Compte Rendu de séance
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-1/3 space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Calendar size={12} /> Date Séance</label>
            <input required type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:border-primary outline-none font-semibold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="flex-1">
            <TextAreaField label="Motif / HDLM" icon={Activity} required value={formData.hdlm} onChange={(v:any) => setFormData({...formData, hdlm: v})} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <TextAreaField label="Tests Cliniques" icon={Activity} value={formData.tests} onChange={(v:any) => setFormData({...formData, tests: v})} />
          <TextAreaField label="Traitement" icon={HeartPulse} value={formData.treatment} onChange={(v:any) => setFormData({...formData, treatment: v})} />
        </div>

        <TextAreaField label="Conseils & Recommandations" icon={ClipboardList} value={formData.advice} onChange={(v:any) => setFormData({...formData, advice: v})} />

        <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:brightness-105 active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2">
          <Save size={18} /> Finaliser l'enregistrement
        </button>
      </form>
    </div>
  );
};

export default SessionForm;
