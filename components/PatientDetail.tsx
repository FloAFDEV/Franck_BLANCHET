
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, ChevronDown, BookOpen, Mail } from 'lucide-react';
import SessionForm from './SessionForm';
import { getImageUrl, revokeUrl } from '../services/imageService';

interface PatientDetailProps {
  patientId: number;
  onEdit: () => void;
  onDelete: () => void;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onEdit, onDelete }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    const p = await db.patients.get(patientId); 
    if (p) {
      setPatient(p);
      if (p.photoId) {
        const url = await getImageUrl(p.photoId, 'thumb');
        setPhotoUrl(url);
      }
    }
    const s = await db.sessions.where('patientId').equals(patientId).reverse().sortBy('date'); 
    setSessions(s);
  };

  useEffect(() => { 
    fetchData(); 
    return () => { if (photoUrl) revokeUrl(photoUrl); };
  }, [patientId]);

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

  const genderBorderColor = patient.gender === 'F' ? 'border-pink-500' : 'border-blue-500';

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header Fiche Patient */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-8 flex flex-col items-center sm:items-start sm:flex-row gap-6 sm:gap-8">
          {/* Avatar Photo */}
          <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-50 dark:bg-slate-800 border-[4px] ${genderBorderColor} overflow-hidden flex items-center justify-center shrink-0 shadow-inner`}>
            {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={48} className="text-slate-200 dark:text-slate-700" />}
          </div>
          
          <div className="flex-1 w-full space-y-5">
            {/* Identity & Actions */}
            <div className="flex flex-col gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight leading-none mb-2">
                  {patient.lastName} <span className="text-primary capitalize">{patient.firstName}</span>
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${patient.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                    {patient.gender === 'M' ? 'Homme' : 'Femme'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Né(e) le {new Date(patient.birthDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2">
                <button onClick={onEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"><Edit3 size={14} /> Modifier</button>
                <button onClick={handleDelete} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-rose-100 dark:border-rose-900/30 text-rose-500 bg-rose-50/30 dark:bg-rose-900/10 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all"><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>

            {/* Infos Contact - Amélioré pour ne pas couper le texte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400"><Phone size={14} /></div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Téléphone</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 break-all">{patient.phone || '-- -- -- -- --'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400"><Mail size={14} /></div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 break-all">{patient.email || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400"><Briefcase size={14} /></div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Profession</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{patient.profession || 'Non renseigné'}</p>
                </div>
              </div>
            </div>

            {/* Antécédents */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-primary uppercase tracking-widest">
                <History size={12} /> Antécédents Médicaux
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic whitespace-pre-wrap">
                {patient.medicalHistory || "Aucun antécédent renseigné."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des Séances */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Historique des Soins</h3>
          <button onClick={() => setIsAddingSession(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
            <Plus size={16} /> Séance
          </button>
        </div>

        {isAddingSession && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <SessionForm patientId={patientId} onCancel={() => setIsAddingSession(false)} onSuccess={() => { setIsAddingSession(false); fetchData(); }} />
          </div>
        )}

        <div className="space-y-3">
          {sessions.length > 0 ? sessions.map(session => {
            const isExpanded = expandedSessions.has(session.id!);
            return (
              <div key={session.id} className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 ${isExpanded ? 'border-primary ring-4 ring-primary-soft shadow-lg' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
                <div onClick={() => toggleSession(session.id!)} className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner"><Calendar size={18} /></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px] sm:max-w-xs">{session.hdlm}</span>
                    </div>
                  </div>
                  <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                    {[
                      { l: 'Motif / HDLM', v: session.hdlm, i: <BookOpen size={12} /> },
                      { l: 'Tests Cliniques', v: session.tests, i: <History size={12} /> },
                      { l: 'Traitement effectué', v: session.treatment, i: <Plus size={12} /> },
                      { l: 'Conseils & Exercices', v: session.advice, i: <Edit3 size={12} /> }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <span className="p-1 bg-slate-100 dark:bg-slate-800 rounded">{item.i}</span> {item.l}
                        </label>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                          {item.v || <span className="text-slate-400 italic font-medium">Non renseigné.</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aucune séance dans l'historique</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
