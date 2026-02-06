
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, ChevronDown, BookOpen, Mail, Download, MapPin, Users, Activity, HeartPulse, Stethoscope, Eye, Ear, ClipboardList } from 'lucide-react';
import SessionForm from './SessionForm';
import { getImageUrl, revokeUrl } from '../services/imageService';

interface PatientDetailProps {
  patientId: number;
  onEdit: () => void;
  onDelete: () => void;
}

const getAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

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
    if (confirm(`Confirmer la suppression définitive du dossier ? Cette action est irréversible.`)) {
      await db.patients.delete(patientId);
      await db.sessions.where('patientId').equals(patientId).delete();
      onDelete();
    }
  };

  const age = getAge(patient.birthDate);
  const genderColor = patient.gender === 'F' ? 'pink' : 'blue';

  const InfoBlock = ({ label, value, icon: Icon, full = false }: { label: string, value: string | boolean | undefined, icon?: any, full?: boolean }) => {
    const displayValue = typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : (value || '--');
    return (
      <div className={`flex items-start gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors ${full ? 'col-span-full' : ''}`}>
        {Icon && <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 shadow-sm"><Icon size={18} /></div>}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 break-words">{displayValue}</p>
        </div>
      </div>
    );
  };

  const MedicalCard = ({ title, content, icon: Icon, colorClass = "primary" }: { title: string, content: string, icon: any, colorClass?: string }) => (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 bg-${colorClass}-soft text-${colorClass} rounded-lg`}><Icon size={16} /></div>
        <h4 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{title}</h4>
      </div>
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap italic">
        {content || "Néant"}
      </p>
    </div>
  );

  return (
    <div className="space-y-8 pb-24">
      {/* 1. HEADER & IDENTITÉ */}
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden print:shadow-none print:border-none">
        <div className="p-8 sm:p-12 flex flex-col md:flex-row gap-10 items-center md:items-start">
          <div className="relative shrink-0">
            <div className={`w-40 h-40 sm:w-52 sm:h-52 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 border-[6px] ${patient.gender === 'F' ? 'border-pink-500/20' : 'border-blue-500/20'} overflow-hidden shadow-2xl`}>
              {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={80} className={`text-${genderColor}-200`} />}
            </div>
            {patient.photoId && (
              <button onClick={async () => { const hd = await getImageUrl(patient.photoId!, 'hd'); if (hd) { const a = document.createElement('a'); a.href = hd; a.download = `photo_${patient.lastName}.jpg`; a.click(); revokeUrl(hd); } }} className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-lg text-primary hover:scale-110 active:scale-95 transition-all"><Download size={20} /></button>
            )}
          </div>

          <div className="flex-1 w-full text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter leading-none mb-3">
                  {patient.lastName} <span className="text-primary font-medium capitalize">{patient.firstName}</span>
                </h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${patient.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                    {patient.gender === 'M' ? 'Homme' : 'Femme'} • {age} ans
                  </span>
                  <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={12} /> {new Date(patient.birthDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <button onClick={onEdit} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:text-primary transition-all shadow-sm"><Edit3 size={20} /></button>
                <button onClick={handleDelete} className="p-4 bg-rose-50/50 dark:bg-rose-900/10 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <InfoBlock label="Téléphone" value={patient.phone} icon={Phone} />
              <InfoBlock label="Email" value={patient.email} icon={Mail} />
              <InfoBlock label="Commune" value={patient.address} icon={MapPin} />
              <InfoBlock label="Profession" value={patient.profession} icon={Briefcase} />
              <InfoBlock label="Latéralité" value={patient.laterality === 'G' ? 'Gaucher' : 'Droitier'} icon={Activity} />
              <InfoBlock label="Famille" value={`${patient.familyStatus || '-'} / ${patient.hasChildren || '-'}`} icon={Users} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLONNE GAUCHE: MÉDICAL GÉNÉRAL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Habitudes & Suivi</h3>
          </div>
          <div className="space-y-4">
            <InfoBlock label="Activité Physique" value={patient.physicalActivity} icon={Activity} full />
            <InfoBlock label="Fumeur" value={patient.isSmoker} icon={HeartPulse} full />
            {patient.gender === 'F' && <InfoBlock label="Contraception" value={patient.contraception} icon={ClipboardList} full />}
            <div className="bg-primary-soft border border-primary-border p-6 rounded-[2rem]">
              <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-primary uppercase tracking-widest">
                <Stethoscope size={16} /> Médecin Traitant
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{patient.gpName || "Non renseigné"}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{patient.gpCity}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 p-6 rounded-[2rem]">
              <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                <Activity size={16} /> Traitement en cours
              </div>
              <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed italic">{patient.currentTreatment || "Aucun"}</p>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE: ANTÉCÉDENTS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Antécédents Spécifiques</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MedicalCard title="Chirurgicaux" content={patient.antSurgical} icon={History} />
            <MedicalCard title="Traumato & Rhumato" content={patient.antTraumaRhuma} icon={Activity} />
            <MedicalCard title="Ophtalmologiques" content={patient.antOphtalmo} icon={Eye} />
            <MedicalCard title="ORL" content={patient.antORL} icon={Ear} />
            <MedicalCard title="Digestifs" content={patient.antDigestive} icon={Activity} />
            <MedicalCard title="Notes Globales" content={patient.medicalHistory} icon={ClipboardList} />
          </div>
        </div>
      </div>

      {/* 3. HISTORIQUE DES SÉANCES */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Historique des Soins (HDLM)</h3>
          <button onClick={() => setIsAddingSession(true)} className="flex items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <Plus size={18} /> Nouvelle Séance
          </button>
        </div>

        {isAddingSession && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <SessionForm patientId={patientId} onCancel={() => setIsAddingSession(false)} onSuccess={() => { setIsAddingSession(false); fetchData(); }} />
          </div>
        )}

        <div className="space-y-4">
          {sessions.map(session => {
            const isExpanded = expandedSessions.has(session.id!);
            return (
              <div key={session.id} className={`bg-white dark:bg-slate-900 border-2 rounded-[2rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'border-primary ring-8 ring-primary-soft shadow-2xl' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                <div onClick={() => toggleSession(session.id!)} className="px-8 py-6 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform"><Calendar size={24} /></div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-800 dark:text-slate-100">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px] sm:max-w-md">{session.hdlm}</span>
                    </div>
                  </div>
                  <ChevronDown size={28} className={`text-slate-300 transition-all duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`} />
                </div>
                {isExpanded && (
                  <div className="px-8 pb-10 pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
                    {[
                      { l: 'Motif / HDLM', v: session.hdlm, i: <BookOpen size={16} /> },
                      { l: 'Tests Cliniques', v: session.tests, i: <Activity size={16} /> },
                      { l: 'Traitement effectué', v: session.treatment, i: <HeartPulse size={16} /> },
                      { l: 'Conseils & Exercices', v: session.advice, i: <ClipboardList size={16} /> }
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                          <span className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-primary">{item.i}</span> {item.l}
                        </label>
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                          {item.v || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
