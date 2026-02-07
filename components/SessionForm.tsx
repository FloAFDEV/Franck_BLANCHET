
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Session } from '../types';
import { Save, X, Calendar, Stethoscope, Activity, HeartPulse, ClipboardList, BookOpen } from 'lucide-react';

interface SessionFormProps {
  patientId: number;
  sessionToEdit?: Session; // Prop optionnelle pour le mode édition
  onCancel: () => void;
  onSuccess: () => void;
}

const TextAreaField = ({ label, value, onChange, placeholder = "", icon: Icon, required = false, id }: any) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
      {Icon && <Icon size={12} className="text-primary/60" aria-hidden="true" />} {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <textarea 
      id={id}
      required={required} 
      rows={3} 
      placeholder={placeholder} 
      className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm transition-all" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      aria-required={required}
    />
  </div>
);

const SessionForm: React.FC<SessionFormProps> = ({ patientId, sessionToEdit, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Session>>({
    date: new Date().toISOString().split('T')[0], hdlm: '', tests: '', treatment: '', advice: '',
  });

  useEffect(() => {
    if (sessionToEdit) {
      setFormData(sessionToEdit);
    }
  }, [sessionToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, patientId, createdAt: formData.createdAt || Date.now() } as Session;
    
    if (sessionToEdit?.id) {
      await db.sessions.update(sessionToEdit.id, data);
    } else {
      await db.sessions.add(data);
    }
    onSuccess();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300" role="dialog" aria-labelledby="session-form-title">
      <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 id="session-form-title" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Stethoscope size={16} className="text-primary" aria-hidden="true" /> 
          {sessionToEdit ? 'Modifier la séance' : 'Nouveau Compte Rendu'}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-rose-500 transition-colors" aria-label="Fermer le formulaire"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-1/3 space-y-1.5">
            <label htmlFor="session-date" className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1"><Calendar size={12} aria-hidden="true" /> Date Séance</label>
            <input id="session-date" required type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 text-sm border border-slate-200 dark:border-slate-800 rounded-xl focus:border-primary outline-none font-semibold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} aria-required="true" />
          </div>
          <div className="flex-1">
            <TextAreaField id="hdlm" label="Motif / HDLM" icon={BookOpen} required value={formData.hdlm} onChange={(v:any) => setFormData({...formData, hdlm: v})} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <TextAreaField id="tests" label="Tests Cliniques" icon={Activity} value={formData.tests} onChange={(v:any) => setFormData({...formData, tests: v})} />
          <TextAreaField id="treatment" label="Traitement" icon={HeartPulse} value={formData.treatment} onChange={(v:any) => setFormData({...formData, treatment: v})} />
        </div>

        <TextAreaField id="advice" label="Conseils & Recommandations" icon={ClipboardList} value={formData.advice} onChange={(v:any) => setFormData({...formData, advice: v})} />

        <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold text-[11px] uppercase tracking-widest rounded-xl hover:brightness-105 active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2">
          <Save size={18} aria-hidden="true" /> {sessionToEdit ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
};

export default SessionForm;
