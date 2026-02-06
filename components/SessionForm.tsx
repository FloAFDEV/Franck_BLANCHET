
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
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl animate-in slide-in-from-top-6 duration-300">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-black text-xl text-slate-900 uppercase tracking-tighter flex items-center gap-2">
          <ClipboardList className="text-primary" size={24} />
          Nouveau Compte-rendu
        </h3>
        <button onClick={onCancel} className="p-3 text-slate-300 hover:text-slate-500 hover:bg-slate-100 rounded-2xl transition-all">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
            <Calendar size={12} /> Date de la séance
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
            placeholder="Motif de consultation, histoire de la maladie..."
            className="w-full p-5 bg-slate-50 text-slate-700 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
            value={formData.hdlm}
            onChange={(e) => setFormData({...formData, hdlm: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-2 flex items-center gap-2">
              <Activity size={12} /> Tests & Diagnostics
            </label>
            <textarea 
              rows={3}
              placeholder="Constats cliniques, tests effectués..."
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
              placeholder="Techniques utilisées..."
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
            placeholder="Recommandations..."
            className="w-full p-5 bg-slate-50 text-slate-700 border border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none placeholder:text-slate-300 font-medium leading-relaxed transition-all"
            value={formData.advice}
            onChange={(e) => setFormData({...formData, advice: e.target.value})}
          />
        </div>

        <button
          type="submit"
          className="w-full py-5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-[1.5rem] hover:opacity-90 transition-all shadow-xl shadow-primary-soft active:scale-95 flex items-center justify-center gap-3"
        >
          <Save size={20} />
          Enregistrer la séance
        </button>
      </form>
    </div>
  );
};

export default SessionForm;
