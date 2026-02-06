
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, ChevronDown, BookOpen } from 'lucide-react';
import SessionForm from './SessionForm';

interface PatientDetailProps {
  patientId: number;
  onEdit: () => void;
  onDelete: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onEdit, onDelete }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    const p = await db.patients.get(patientId); if (p) setPatient(p);
    const s = await db.sessions.where('patientId').equals(patientId).reverse().sortBy('date'); setSessions(s);
  };

  useEffect(() => { fetchData(); }, [patientId]);

  if (!patient) return null;

  const toggleSession = (id: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(id)) newExpanded.delete(id); else newExpanded.add(id);
    setExpandedSessions(newExpanded);
  };

  const handleDelete = async () => {
    if (confirm(`Confirmer la suppression définitive du dossier de ${patient.lastName} ?`)) {
      await db.patients.delete(patientId);
      await db.sessions.where('patientId').equals(patientId).delete();
      onDelete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 self-center sm:self-start">
            {patient.photo ? <img src={patient.photo} alt="" className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none mb-1">
                  {patient.lastName} <span className="text-primary capitalize">{patient.firstName}</span>
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.gender === 'M' ? 'Homme' : 'Femme'} • {new Date(patient.birthDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onEdit} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all"><Edit3 size={14} /> Modifier</button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-1.5 border border-rose-100 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg text-xs font-bold transition-all"><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pt-2">
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{patient.phone || '-- -- -- -- --'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase size={14} className="text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{patient.profession || 'Non renseigné'}</span>
              </div>
            </div>

            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <History size={12} /> Antécédents Médicaux
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">{patient.medicalHistory || "Aucune information enregistrée."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] px-2">Comptes Rendus de Séances</h3>
          <button onClick={() => setIsAddingSession(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold hover:brightness-95 transition-all shadow-sm">
            <Plus size={16} /> Nouvelle Séance
          </button>
        </div>

        {isAddingSession && <SessionForm patientId={patientId} onCancel={() => setIsAddingSession(false)} onSuccess={() => { setIsAddingSession(false); fetchData(); }} />}

        <div className="space-y-2">
          {sessions.length > 0 ? sessions.map(session => {
            const isExpanded = expandedSessions.has(session.id!);
            return (
              <div key={session.id} className={`bg-white dark:bg-slate-900 border rounded-lg overflow-hidden transition-all ${isExpanded ? 'border-primary ring-1 ring-primary-soft' : 'border-slate-200 dark:border-slate-800'}`}>
                <div onClick={() => toggleSession(session.id!)} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><Calendar size={16} /></div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Séance du {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="px-5 pb-6 pt-1 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in slide-in-from-top-1">
                    {[
                      { l: 'Motif / HDLM', v: session.hdlm, i: <BookOpen size={12} /> },
                      { l: 'Tests Cliniques', v: session.tests, i: <History size={12} /> },
                      { l: 'Traitement effectué', v: session.treatment, i: <Plus size={12} /> },
                      { l: 'Conseils & Exercices', v: session.advice, i: <Edit3 size={12} /> }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">{item.i} {item.l}</label>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded border border-slate-100 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap min-h-[60px]">{item.v || 'Non renseigné.'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune séance enregistrée</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
