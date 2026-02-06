
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, ChevronDown, Mail, Search, MapPin, Users, Activity, HeartPulse, Stethoscope, ClipboardList, BookOpen, ExternalLink } from 'lucide-react';
import SessionForm from './SessionForm';
import { getImageUrl, revokeUrl } from '../services/imageService';

interface PatientDetailProps {
  patientId: number;
  onEdit: () => void;
  onDelete: () => void;
}

const getAge = (birthDate: string) => {
  if (!birthDate) return 0;
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
      if (p.photoId) { const url = await getImageUrl(p.photoId, 'thumb'); setPhotoUrl(url); }
    }
    const s = await db.sessions.where('patientId').equals(patientId).reverse().sortBy('date'); 
    setSessions(s);
  };

  useEffect(() => { fetchData(); return () => { if (photoUrl) revokeUrl(photoUrl); }; }, [patientId]);

  if (!patient) return null;

  const toggleSession = (id: number) => {
    const next = new Set(expandedSessions);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSessions(next);
  };

  const handleDelete = async () => {
    if (confirm(`Confirmer la suppression du dossier de ${patient.firstName} ${patient.lastName} ?`)) {
      await db.patients.delete(patientId);
      await db.sessions.where('patientId').equals(patientId).delete();
      onDelete();
    }
  };

  const handleGoogleSearch = () => {
    if (patient.gpName && patient.gpCity) {
      const query = encodeURIComponent(`${patient.gpName} ${patient.gpCity} médecin`);
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    }
  };

  const age = getAge(patient.birthDate);

  const SectionHeader = ({ icon: Icon, title }: any) => (
    <div className="flex items-center gap-2 mb-4 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] px-1">
      <Icon size={14} className="text-primary/70" /> {title}
    </div>
  );

  const InfoTag = ({ label, value, icon: Icon, href }: any) => {
    const Content = (
      <div className={`flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 transition-all ${href ? 'hover:border-primary group cursor-pointer' : ''}`}>
        {Icon && <Icon size={14} className={`shrink-0 ${href ? 'text-slate-400 group-hover:text-primary' : 'text-slate-400'}`} />}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">{label}</p>
          <p className={`text-xs font-medium truncate ${href ? 'text-slate-700 dark:text-slate-300 group-hover:text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
            {value || '—'}
          </p>
        </div>
        {href && <ExternalLink size={10} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />}
      </div>
    );

    if (href && value) {
      return (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className="block no-underline">
          {Content}
        </a>
      );
    }

    return Content;
  };

  const MedicalCard = ({ title, content, icon: Icon }: any) => (
    <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-primary/60" />
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">{content || "Aucun antécédent répertorié"}</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Profil Header */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-lg flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className={`w-36 h-36 sm:w-40 sm:h-40 rounded-3xl border-2 ${patient.gender === 'F' ? 'border-pink-100 dark:border-pink-900/30' : 'border-blue-100 dark:border-blue-900/30'} bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 shadow-inner flex items-center justify-center text-slate-100`}>
          {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={48} />}
        </div>
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {patient.lastName} <span className="font-light text-slate-500">{patient.firstName}</span>
              </h2>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${patient.gender === 'F' ? 'bg-pink-50 text-pink-500 dark:bg-pink-950/20' : 'bg-blue-50 text-blue-500 dark:bg-blue-950/20'}`}>{patient.gender === 'M' ? 'Homme' : 'Femme'} • {age} ans</span>
                <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> {new Date(patient.birthDate).toLocaleDateString()}</span>
                {patient.isSmoker && <span className="px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/20 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">Fumeur</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-primary transition-all shadow-sm"><Edit3 size={18} /></button>
              <button onClick={handleDelete} className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <InfoTag label="Téléphone" value={patient.phone} icon={Phone} href={patient.phone ? `tel:${patient.phone.replace(/\s/g, '')}` : undefined} />
            <InfoTag label="Email" value={patient.email} icon={Mail} href={patient.email ? `mailto:${patient.email}` : undefined} />
            <InfoTag label="Localité" value={patient.address} icon={MapPin} href={patient.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}` : undefined} />
            <InfoTag label="Profession" value={patient.profession} icon={Briefcase} />
            <InfoTag label="Famille" value={`${patient.familyStatus}${patient.hasChildren ? ` (${patient.hasChildren})` : ''}`} icon={Users} />
            <InfoTag label="Latéralité" value={patient.laterality === 'G' ? 'Gaucher' : 'Droitier'} icon={Activity} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Médicale */}
        <div className="lg:col-span-1 space-y-8">
          <section>
            <SectionHeader icon={Activity} title="Suivi & Habitudes" />
            <div className="space-y-3">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Activité Sportive</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{patient.physicalActivity || "Sédentaire"}</p>
              </div>
              
              <div className="p-5 bg-primary-soft border border-primary-border rounded-3xl relative group overflow-hidden">
                <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-primary uppercase tracking-widest">
                  <Stethoscope size={14} /> Médecin Traitant
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">{patient.gpName || "Non déclaré"}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-tight">{patient.gpCity}</p>
                  </div>
                  {patient.gpName && patient.gpCity && (
                    <button 
                      onClick={handleGoogleSearch}
                      title="Chercher les coordonnées sur Google"
                      className="p-2 bg-white dark:bg-slate-800 rounded-lg text-primary shadow-sm hover:scale-110 active:scale-95 transition-all"
                    >
                      <Search size={14} />
                    </button>
                  )}
                </div>
                {!patient.gpName && (
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Stethoscope size={40} />
                  </div>
                )}
              </div>

              <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-3xl">
                <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-amber-600 uppercase tracking-widest"><HeartPulse size={14} /> Traitement en cours</div>
                <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">{patient.currentTreatment || "Aucun traitement déclaré"}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Colonne Antécédents */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionHeader icon={History} title="Antécédents Spécifiques" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MedicalCard title="Chirurgicaux" content={patient.antSurgical} icon={ClipboardList} />
              <MedicalCard title="Traumato & Rhumato" content={patient.antTraumaRhuma} icon={Activity} />
              <MedicalCard title="Digestifs" content={patient.antDigestive} icon={Activity} />
              <MedicalCard title="Notes Médicales Libres" content={patient.medicalHistory} icon={ClipboardList} />
            </div>
          </section>
        </div>
      </div>

      {/* Sessions */}
      <section className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center justify-between px-1">
          <SectionHeader icon={BookOpen} title="Histoire de la maladie (HDLM)" />
          <button onClick={() => setIsAddingSession(true)} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:brightness-105 transition-all">
            <Plus size={16} /> Nouvelle Séance
          </button>
        </div>

        {isAddingSession && <SessionForm patientId={patientId} onCancel={() => setIsAddingSession(false)} onSuccess={() => { setIsAddingSession(false); fetchData(); }} />}

        <div className="space-y-4">
          {sessions.map(s => {
            const open = expandedSessions.has(s.id!);
            return (
              <div key={s.id} className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-300 ${open ? 'border-primary shadow-lg scale-[1.01]' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}>
                <div onClick={() => toggleSession(s.id!)} className="px-6 py-4 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl transition-colors ${open ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary'}`}><Calendar size={18} /></div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight truncate max-w-[200px] sm:max-w-xs">{s.hdlm}</span>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`text-slate-300 transition-transform ${open ? 'rotate-180 text-primary' : ''}`} />
                </div>
                {open && (
                  <div className="px-6 pb-8 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                    {[
                      { l: 'Motif / HDLM', v: s.hdlm, i: BookOpen },
                      { l: 'Tests Cliniques', v: s.tests, i: Activity },
                      { l: 'Traitement effectué', v: s.treatment, i: HeartPulse },
                      { l: 'Conseils donnés', v: s.advice, i: ClipboardList }
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5 px-1"><item.i size={12} className="text-primary/50" /> {item.l}</label>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.v || "Aucune note saisie"}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default PatientDetail;
