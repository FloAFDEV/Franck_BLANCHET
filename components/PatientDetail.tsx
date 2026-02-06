
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, AlertTriangle, ChevronDown, BookOpen } from 'lucide-react';
import SessionForm from './SessionForm';

interface PatientDetailProps {
  patientId: number;
  onEdit: () => void;
  onDelete: () => void;
}

const getGenderStyle = (gender: string) => {
  switch (gender) {
    case 'M': return 'ring-blue-400 bg-blue-50 border-blue-100';
    case 'F': return 'ring-pink-400 bg-pink-50 border-pink-100';
    default: return 'ring-slate-400 bg-slate-50 border-slate-100';
  }
};

const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onEdit, onDelete }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [securityCode, setSecurityCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());

  const fetchData = async () => {
    const p = await db.patients.get(patientId);
    if (p) setPatient(p);
    
    const s = await db.sessions
      .where('patientId')
      .equals(patientId)
      .reverse()
      .sortBy('date');
    setSessions(s);
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  if (!patient) return <div className="p-8 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Chargement dossier...</div>;

  const toggleSession = (id: number) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSessions(newExpanded);
  };

  const initiateDelete = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSecurityCode(code);
    setUserInputCode('');
    setShowDeleteModal(true);
  };

  const handleFinalDelete = async () => {
    if (userInputCode === securityCode) {
      await db.sessions.where('patientId').equals(patientId).delete();
      await db.patients.delete(patientId);
      onDelete();
    } else {
      alert("Code incorrect.");
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce compte-rendu ? Cette action est irréversible.')) {
      await db.sessions.delete(id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      {/* Profile Header */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className={`w-32 h-32 rounded-[2.5rem] border-2 ring-4 shrink-0 overflow-hidden flex items-center justify-center transition-all ${getGenderStyle(patient.gender)}`}>
            {patient.photo ? (
              <img src={patient.photo} alt={`${patient.firstName} ${patient.lastName}`} className="w-full h-full object-cover" />
            ) : (
              <User size={56} className="text-slate-200" />
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                {patient.lastName} <span className="capitalize text-primary font-bold">{patient.firstName}</span>
              </h2>
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <button 
                  onClick={onEdit}
                  className="p-4 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary-soft rounded-[1.5rem] transition-all border border-slate-100"
                >
                  <Edit3 size={20} />
                </button>
                <button 
                  onClick={initiateDelete}
                  className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-[1.5rem] transition-all border border-slate-100"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-3">
              <span className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                <Calendar size={14} className="text-primary" /> 
                {new Date(patient.birthDate).toLocaleDateString('fr-FR')} <span className="opacity-20">•</span> {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans
              </span>
              <span className="flex items-center gap-2 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                <Phone size={14} className="text-primary" /> {patient.phone || 'Non renseigné'}
              </span>
              <span className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest bg-primary-soft px-4 py-1.5 rounded-full border border-primary-soft/50">
                <Briefcase size={14} /> {patient.profession || '...'}
              </span>
            </div>

            <div className="mt-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                <History size={14} className="text-primary" />
                Antécédents
              </h4>
              <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                {patient.medicalHistory || "Aucun antécédent renseigné."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Patient) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-rose-50 text-rose-500 rounded-[2rem]">
                <AlertTriangle size={40} />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2 uppercase tracking-tighter">Supprimer le dossier ?</h3>
            <div className="text-slate-400 text-xs text-center mb-8 px-2 font-bold uppercase tracking-widest leading-relaxed">
              Action irréversible. Entrez le code de sécurité :
              <div className="mt-4 font-black text-rose-600 text-4xl tracking-[0.2em] bg-rose-50 py-4 rounded-3xl border border-rose-100">{securityCode}</div>
            </div>
            <input 
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              className="w-full p-6 mb-6 text-center text-4xl font-black tracking-[0.5em] bg-slate-50 border-2 border-slate-200 rounded-3xl focus:border-rose-500 focus:bg-white focus:outline-none transition-all"
              value={userInputCode}
              onChange={(e) => setUserInputCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-slate-400">Annuler</button>
              <button
                onClick={handleFinalDelete}
                disabled={userInputCode !== securityCode}
                className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all ${
                  userInputCode === securityCode 
                    ? 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700 active:scale-95' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center gap-2">
            Historique <span className="bg-slate-200 text-slate-500 px-3 py-1 rounded-full text-[9px]">{sessions.length}</span>
          </h3>
          <button 
            onClick={() => setIsAddingSession(true)}
            className="text-[10px] font-black uppercase tracking-widest bg-primary text-white px-6 py-3 rounded-2xl hover:opacity-90 shadow-xl shadow-primary-soft transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Nouvelle Séance
          </button>
        </div>

        {isAddingSession && (
          <SessionForm 
            patientId={patientId}
            onCancel={() => setIsAddingSession(false)}
            onSuccess={() => {
              setIsAddingSession(false);
              fetchData();
            }}
          />
        )}

        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map(session => {
              const isExpanded = expandedSessions.has(session.id!);
              return (
                <div 
                  key={session.id} 
                  className={`bg-white rounded-[2rem] border transition-all duration-300 ${isExpanded ? 'border-primary ring-4 ring-primary-soft shadow-xl' : 'border-slate-200 shadow-sm'}`}
                >
                  <div 
                    onClick={() => toggleSession(session.id!)}
                    className="px-6 py-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-300 ${isExpanded ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                        <Calendar size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-black text-slate-800 uppercase text-xs tracking-tight block">
                          {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {!isExpanded && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-bold uppercase tracking-tighter opacity-60">
                            {session.hdlm || 'Cliquez pour voir les détails...'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => deleteSession(e, session.id!)}
                        className="p-3 text-slate-200 hover:text-rose-400 hover:bg-rose-50 rounded-xl transition-all"
                        title="Supprimer la séance"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-slate-300'}`}>
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-6 pb-8 pt-2 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] px-3 flex items-center gap-1.5">
                            <BookOpen size={10} className="text-primary" /> Motif / HDLM
                          </label>
                          <div className="bg-slate-50 p-4 rounded-[1.25rem] border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-wrap">{session.hdlm || 'Non renseigné'}</div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] px-3 flex items-center gap-1.5">
                            <History size={10} className="text-primary" /> Tests & Diagnostics
                          </label>
                          <div className="bg-slate-50 p-4 rounded-[1.25rem] border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-wrap">{session.tests || 'Non renseigné'}</div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] px-3 flex items-center gap-1.5">
                            <Plus size={10} className="text-primary" /> Traitement
                          </label>
                          <div className="bg-slate-50 p-4 rounded-[1.25rem] border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-wrap">{session.treatment || 'Non renseigné'}</div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] px-3 flex items-center gap-1.5">
                            <Edit3 size={10} className="text-primary" /> Conseils & Exercices
                          </label>
                          <div className="bg-slate-50 p-4 rounded-[1.25rem] border border-slate-100 text-slate-700 text-xs font-medium leading-relaxed whitespace-pre-wrap">{session.advice || 'Aucun conseil spécifique'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : !isAddingSession && (
            <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-50 text-slate-300 italic font-black uppercase tracking-widest text-[10px] opacity-50">
              Aucun historique de soin disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
