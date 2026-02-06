
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, ChevronDown, BookOpen, Mail, Download } from 'lucide-react';
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

  const handleDownloadPhoto = async () => {
    if (!patient.photoId) return;
    const hdUrl = await getImageUrl(patient.photoId, 'hd');
    if (hdUrl) {
      const a = document.createElement('a');
      a.href = hdUrl;
      a.download = `photo_${patient.lastName}_${patient.firstName}.jpg`;
      a.click();
      revokeUrl(hdUrl);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Confirmer la suppression définitive du dossier de ${patient.lastName} ?`)) {
      await db.patients.delete(patientId);
      await db.sessions.where('patientId').equals(patientId).delete();
      onDelete();
    }
  };

  const genderBorderColor = patient.gender === 'F' ? 'border-pink-500' : 'border-blue-500';
  const genderBgSoft = patient.gender === 'F' ? 'bg-pink-50 dark:bg-pink-950/20' : 'bg-blue-50 dark:bg-blue-950/20';

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Header Fiche Patient */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-10 flex flex-col items-center sm:items-start sm:flex-row gap-8 sm:gap-10">
          {/* Avatar Photo avec Action Télécharger */}
          <div className="relative group shrink-0">
            <div className={`w-32 h-32 sm:w-44 sm:h-44 rounded-3xl bg-slate-50 dark:bg-slate-800 border-[5px] ${genderBorderColor} ${genderBgSoft} overflow-hidden flex items-center justify-center shadow-xl`}>
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className={patient.gender === 'F' ? 'text-pink-300' : 'text-blue-300'} />
              )}
            </div>
            {patient.photoId && (
              <button 
                onClick={handleDownloadPhoto}
                className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-lg text-primary hover:scale-110 active:scale-95 transition-all"
                title="Télécharger la photo HD"
              >
                <Download size={18} />
              </button>
            )}
          </div>
          
          <div className="flex-1 w-full space-y-6">
            {/* Identity & Actions */}
            <div className="flex flex-col gap-6">
              <div className="text-center sm:text-left">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter leading-none mb-3">
                  {patient.lastName} <span className="text-primary font-medium capitalize">{patient.firstName}</span>
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${patient.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                    {patient.gender === 'M' ? 'Homme' : 'Femme'}
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <Calendar size={12} /> Né(e) le {new Date(patient.birthDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button onClick={onEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"><Edit3 size={16} /> Modifier</button>
                <button onClick={handleDelete} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-rose-100 dark:border-rose-900/30 text-rose-500 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95 shadow-sm"><Trash2 size={16} /> Supprimer</button>
              </div>
            </div>

            {/* Infos Contact - Layout flexible anti-coupure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 shadow-sm"><Phone size={16} /></div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Téléphone</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">{patient.phone || '-- -- -- --'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 shadow-sm"><Mail size={16} /></div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-all">{patient.email || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 shadow-sm"><Briefcase size={16} /></div>
                <div className="min-w-0 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Profession</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{patient.profession || '...'}</p>
                </div>
              </div>
            </div>

            {/* Antécédents - Boite Stylisée */}
            <div className="relative p-5 rounded-3xl bg-primary-soft border border-primary-border">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                <History size={14} strokeWidth={2.5} /> Antécédents Médicaux
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                {patient.medicalHistory || "Aucun antécédent médical enregistré."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des Séances */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Historique des Soins</h3>
          <button onClick={() => setIsAddingSession(true)} className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Séance
          </button>
        </div>

        {isAddingSession && (
          <div className="animate-in slide-in-from-top-4 duration-300 px-2 sm:px-0">
            <SessionForm patientId={patientId} onCancel={() => setIsAddingSession(false)} onSuccess={() => { setIsAddingSession(false); fetchData(); }} />
          </div>
        )}

        <div className="space-y-3">
          {sessions.length > 0 ? sessions.map(session => {
            const isExpanded = expandedSessions.has(session.id!);
            return (
              <div key={session.id} className={`bg-white dark:bg-slate-900 border-2 rounded-3xl overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary ring-8 ring-primary-soft shadow-2xl' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200'}`}>
                <div onClick={() => toggleSession(session.id!)} className="px-6 py-5 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform"><Calendar size={22} /></div>
                    <div className="flex flex-col">
                      <span className="text-base font-black text-slate-800 dark:text-slate-100">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[140px] sm:max-w-md">{session.hdlm}</span>
                    </div>
                  </div>
                  <ChevronDown size={24} className={`text-slate-300 transition-all duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="px-6 pb-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                    {[
                      { l: 'Motif / HDLM', v: session.hdlm, i: <BookOpen size={14} /> },
                      { l: 'Tests Cliniques', v: session.tests, i: <History size={14} /> },
                      { l: 'Traitement effectué', v: session.treatment, i: <Plus size={14} /> },
                      { l: 'Conseils & Exercices', v: session.advice, i: <Edit3 size={14} /> }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <span className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-primary">{item.i}</span> {item.l}
                        </label>
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                          {item.v || <span className="text-slate-300 italic">Information non renseignée lors de la séance.</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 border-3 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] text-center">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <History size={32} />
              </div>
              <p className="text-[11px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">Aucun soin enregistré</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
