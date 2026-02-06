
import React, { useState } from 'react';
import { db } from '../db';
import { Session } from '../types';
import { Save, X, Calendar, Stethoscope, ClipboardList, Activity, Lightbulb } from 'lucide-react';

interface SessionFormProps {
  patientId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const SessionForm: React.FC<SessionFormProps> = ({ patientId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Session>>({
    date: new Date().toISOString().split('T')[0],
    hdlm: '',
    tests: '',
    treatment: '',
    advice: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sessionData = {
      ...formData,
      patientId,
      createdAt: Date.now(),
    } as Session;

    await db.sessions.add(sessionData);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl shadow-slate-200/50 animate-in slide-in-from-top-6 duration-300 relative overflow-hidden">
      {/* Accent bar at the top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-primary opacity-20"></div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter flex items-center gap-2">
            <ClipboardList className="text-primary" size={24} />
            Nouvelle Séance
          </h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Saisie du compte-rendu clinique</p>
        </div>
        <button onClick={onCancel} className="p-3 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
            <Calendar size={12} /> Date du soin
          </label>
          <input 
            required
            type="date"
            className="w-full p-4 bg-slate-50 text-slate-800 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none font-bold transition-all"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
            <Stethoscope size={12} /> Motif / HDLM
          </label>
          <textarea 
            required
            rows={2}
            placeholder="Description des symptômes et motif de consultation..."
            className="w-full p-5 bg-slate-50 text-slate-700 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
            value={formData.hdlm}
            onChange={(e) => setFormData({...formData, hdlm: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
              <Activity size={12} /> Tests & Objectifs
            </label>
            <textarea 
              rows={3}
              placeholder="Constats cliniques, tests ostéopathiques..."
              className="w-full p-5 bg-slate-50 text-slate-700 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
              value={formData.tests}
              onChange={(e) => setFormData({...formData, tests: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
              <ClipboardList size={12} /> Traitement
            </label>
            <textarea 
              rows={3}
              placeholder="Techniques utilisées (structurel, fascia, viscéral...)"
              className="w-full p-5 bg-slate-50 text-slate-700 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
              value={formData.treatment}
              onChange={(e) => setFormData({...formData, treatment: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
            <Lightbulb size={12} /> Conseils & Exercices
          </label>
          <textarea 
            rows={2}
            placeholder="Recommandations post-séance et exercices à domicile..."
            className="w-full p-5 bg-slate-50 text-slate-700 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
            value={formData.advice}
            onChange={(e) => setFormData({...formData, advice: e.target.value})}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 py-5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] hover:opacity-90 transition-all shadow-xl shadow-primary-soft active:scale-95 flex items-center justify-center gap-3"
          >
            <Save size={20} />
            Enregistrer la séance
          </button>
        </div>
      </form>
    </div>
  );
};

export default SessionForm;
