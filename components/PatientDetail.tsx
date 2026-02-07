
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db';
import { Patient, Session } from '../types';
import { User, Phone, Briefcase, Calendar, History, Plus, Edit3, Trash2, ChevronDown, Mail, Search, MapPin, Users, Activity, HeartPulse, Stethoscope, ClipboardList, BookOpen, ExternalLink, Eye, Info, X, Scissors, Bone, Ear, Pill, StickyNote, FileText } from 'lucide-react';
import SessionForm from './SessionForm';
import { getImageUrl, revokeUrl } from '../services/imageService';
import jsPDF from 'https://esm.sh/jspdf';
import autoTable from 'https://esm.sh/jspdf-autotable';

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

const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const SectionHeader = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-2 mb-6 text-[10px] font-medium text-slate-400 uppercase tracking-[0.25em] px-1 border-b border-slate-100 dark:border-slate-800 pb-3">
    <Icon size={16} className="text-primary/70" /> {title}
  </div>
);

const InfoTag = ({ label, value, icon: Icon, href }: any) => {
  const displayValue = value && value !== "undefined" ? value : "-";
  const Content = (
    <div className={`flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all ${href && value ? 'hover:border-primary group cursor-pointer' : ''}`}>
      {Icon && <Icon size={16} className={`shrink-0 ${href && value ? 'text-slate-400 group-hover:text-primary' : 'text-slate-400'}`} />}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
        <p className={`text-xs font-semibold truncate ${href && value ? 'text-slate-700 dark:text-slate-200 group-hover:text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
          {displayValue}
        </p>
      </div>
      {href && value && <ExternalLink size={10} className="text-slate-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />}
    </div>
  );

  return href && value ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined} className="block no-underline">
      {Content}
    </a>
  ) : Content;
};

const MedicalCard = ({ title, content, icon: Icon, iconColor = "text-primary/60" }: any) => (
  <div className="bg-white dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-3 shadow-sm hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
    <div className="flex items-center gap-2">
      <Icon size={14} className={iconColor} />
      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</h4>
    </div>
    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic font-medium">{content || "-"}</p>
  </div>
);

const PatientDetail: React.FC<PatientDetailProps> = ({ patientId, onEdit, onDelete }) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(new Set());
  
  const [sessionSearch, setSessionSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'MONTH' | 'YEAR'>('ALL');

  const fetchData = useCallback(async () => {
    const p = await db.patients.get(patientId); 
    if (p) {
      setPatient(p);
      if (p.photoId) { const url = await getImageUrl(p.photoId, 'thumb'); setPhotoUrl(url); }
    }
    const s = await db.sessions.where('patientId').equals(patientId).reverse().sortBy('date'); 
    setSessions(s);
  }, [patientId]);

  useEffect(() => { fetchData(); return () => { if (photoUrl) revokeUrl(photoUrl); }; }, [fetchData]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const sessionDate = new Date(s.date);
      const yearStr = sessionDate.getFullYear().toString();
      
      const matchesSearch = s.hdlm.toLowerCase().includes(sessionSearch.toLowerCase()) || 
                           s.treatment.toLowerCase().includes(sessionSearch.toLowerCase()) ||
                           yearStr.includes(sessionSearch);
      
      if (!matchesSearch) return false;
      if (dateFilter === 'ALL') return true;
      const now = new Date();
      
      if (dateFilter === 'MONTH') {
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'YEAR') {
        return sessionDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sessions, sessionSearch, dateFilter]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const currentYear = new Date().getFullYear();
    const thisYear = sessions.filter(s => new Date(s.date).getFullYear() === currentYear).length;
    const lastSessionDate = sessions.length > 0 ? sessions[0].date : null;
    return { total, thisYear, lastSessionDate };
  }, [sessions]);

  const exportPDF = useCallback(() => {
    if (!patient) return;
    
    const doc = new jsPDF();
    const primaryColor = [20, 184, 166]; // #14b8a6

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text(`${patient.lastName.toUpperCase()} ${capitalize(patient.firstName)}`, 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Né(e) le ${new Date(patient.birthDate).toLocaleDateString()} (${getAge(patient.birthDate)} ans) - ${patient.gender === 'M' ? 'Homme' : 'Femme'}`, 20, 28);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 32, 190, 32);

    // Patient Info Table
    autoTable(doc, {
      startY: 38,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
      body: [
        ['Profession', patient.profession || '-'],
        ['Téléphone', patient.phone || '-'],
        ['Email', patient.email || '-'],
        ['Adresse', patient.address || '-'],
        ['Médecin Traitant', patient.gpName || '-'],
        ['Situation Familiale', `${patient.familyStatus || '-'} ${patient.hasChildren && patient.hasChildren !== 'Non' ? `(${patient.hasChildren})` : ''}`],
      ],
    });

    // Medical History Section
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const medicalStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Antécédents & Terrain", 20, medicalStartY);

    autoTable(doc, {
      startY: medicalStartY + 5,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: primaryColor, textColor: 255 },
      body: [
        ['Chirurgicaux', patient.antSurgical || '-'],
        ['Traumato/Rhumato', patient.antTraumaRhuma || '-'],
        ['Digestifs', patient.antDigestive || '-'],
        ['ORL / Ophtalmo', `${patient.antORL || '-'} / ${patient.antOphtalmo || '-'}`],
        ['Mode de vie', `${patient.isSmoker ? 'Fumeur' : patient.isFormerSmoker ? 'Ancien Fumeur' : 'Non fumeur'} ${patient.smokerSince ? `(${patient.smokerSince})` : ''} - Sport: ${patient.physicalActivity || '-'}`],
        ['Traitements', patient.currentTreatment || '-'],
        ['Notes médicales', patient.medicalHistory || '-'],
      ],
    });

    // Sessions History Section
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const sessionsStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Historique des consultations", 20, sessionsStartY);

    const sessionData = sessions.map(s => [
      new Date(s.date).toLocaleDateString(),
      s.hdlm || '-',
      s.treatment || '-',
      s.advice || '-'
    ]);

    autoTable(doc, {
      startY: sessionsStartY + 5,
      head: [['Date', 'Motif / HDLM', 'Traitement', 'Conseils']],
      body: sessionData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: primaryColor, textColor: 255 },
      columnStyles: {
        0: { width: 25 },
        1: { width: 50 },
        2: { width: 50 },
        3: { width: 45 },
      }
    });

    doc.save(`Fiche_${patient.lastName}_${patient.firstName}.pdf`);
  }, [patient, sessions]);

  if (!patient) return null;

  const toggleSession = (id: number) => {
    const next = new Set(expandedSessions);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSessions(next);
  };

  const handleDelete = async () => {
    if (confirm(`Supprimer définitivement le dossier de ${patient.firstName} ${patient.lastName} ?`)) {
      await db.patients.delete(patientId);
      await db.sessions.where('patientId').equals(patientId).delete();
      onDelete();
    }
  };

  const handleEditSession = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingSession(session);
    setIsAddingSession(true);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    if (confirm("Supprimer cette séance de l'historique ? Cette action est irréversible.")) {
      await db.sessions.delete(sessionId);
      fetchData();
    }
  };

  const genderBorder = patient.gender === 'F' 
    ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' 
    : 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]';

  const formattedGpName = useMemo(() => {
    if (!patient.gpName || patient.gpName === "Dr. ") return "-";
    const name = patient.gpName.trim();
    if (name.toLowerCase().startsWith("dr")) return name;
    return `Dr. ${name}`;
  }, [patient.gpName]);

  const smokerLabel = useMemo(() => {
    if (patient.isSmoker) return `Fumeur${patient.smokerSince ? ` (${patient.smokerSince})` : ''}`;
    if (patient.isFormerSmoker) return `Ancien fumeur${patient.smokerSince ? ` (${patient.smokerSince})` : ''}`;
    return "Non fumeur";
  }, [patient.isSmoker, patient.isFormerSmoker, patient.smokerSince]);

  const familyLabel = useMemo(() => {
    if (!patient.familyStatus) return "-";
    const status = patient.familyStatus;
    const children = patient.hasChildren && patient.hasChildren !== "Non" ? ` (${patient.hasChildren})` : '';
    return `${status}${children}`;
  }, [patient.familyStatus, patient.hasChildren]);

  return (
    <div className="space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="px-2 flex items-center justify-between">
        <p className="text-[10px] font-extralight text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Fiche Patient</p>
        <button 
          onClick={exportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all shadow-sm active:scale-95"
        >
          <FileText size={14} /> Exporter PDF
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col lg:flex-row gap-10 items-center lg:items-start">
        <div className={`w-44 h-44 sm:w-52 sm:h-52 rounded-[2.5rem] border-[5px] ${genderBorder} bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 shadow-inner flex items-center justify-center text-slate-100`}>
          {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={56} />}
        </div>
        
        <div className="flex-1 w-full text-center lg:text-left">
          <div className="flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6 mb-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight uppercase tracking-tight">
                {patient.lastName} <span className="font-light text-slate-400 lowercase">{capitalize(patient.firstName)}</span>
              </h2>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-3">
                <span className={`px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-widest ${patient.gender === 'F' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'}`}>
                  {patient.gender === 'M' ? 'HOMME' : 'FEMME'} • {getAge(patient.birthDate)} ANS
                </span>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-medium text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> {new Date(patient.birthDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-8 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100/50 dark:border-slate-800/50">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">Dernière Séance</span>
                  <span className="text-sm font-bold text-primary">
                    {stats.lastSessionDate ? new Date(stats.lastSessionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Première visite'}
                  </span>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">Total</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.total} séance{stats.total > 1 ? 's' : ''}</span>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none">Année {new Date().getFullYear()}</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{stats.thisYear} séance{stats.thisYear > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={onEdit} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-primary transition-all shadow-md active:scale-95" title="Modifier"><Edit3 size={20} /></button>
              <button onClick={handleDelete} className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-95" title="Supprimer"><Trash2 size={20} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <InfoTag label="Téléphone" value={patient.phone} icon={Phone} href={patient.phone ? `tel:${patient.phone.replace(/\s/g, '')}` : undefined} />
            <InfoTag label="Email" value={patient.email} icon={Mail} href={patient.email ? `mailto:${patient.email}` : undefined} />
            <InfoTag label="Localité" value={patient.address} icon={MapPin} href={patient.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}` : undefined} />
            <InfoTag label="Profession" value={patient.profession} icon={Briefcase} />
            <InfoTag label="Famille" value={familyLabel} icon={Users} />
            <InfoTag label="Latéralité" value={patient.laterality === 'G' ? 'Gaucher' : 'Droitier'} icon={Activity} />
          </div>

          <div className="mt-6 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Stethoscope size={20} />
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-0.5">Médecin Référent</p>
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{formattedGpName}</span>
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{patient.gpCity && `à ${patient.gpCity}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        <div className="space-y-6">
          <SectionHeader icon={Info} title="Suivi & Habitudes de vie" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2 px-1">Activité Sportive</p>
              <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{patient.physicalActivity || "-"}</p>
            </div>
            <div className="p-6 bg-primary-soft border border-primary-border rounded-[2rem] shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-primary uppercase tracking-widest px-1">
                <Activity size={16} /> Mode de vie
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{smokerLabel}</p>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter mt-1">{patient.physicalActivity || "-"}</p>
            </div>
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-[2rem] shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-[10px] font-semibold text-amber-600 uppercase tracking-widest px-1">
                <HeartPulse size={16} /> Traitement actuel
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic font-medium">{patient.currentTreatment || "-"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SectionHeader icon={History} title="Antécédents & Notes Médicales" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <MedicalCard title="Chirurgicaux" content={patient.antSurgical} icon={Scissors} iconColor="text-rose-500" />
            <MedicalCard title="Traumato / Rhumato" content={patient.antTraumaRhuma} icon={Bone} iconColor="text-blue-500" />
            <MedicalCard title="Ophtalmo" content={patient.antOphtalmo} icon={Eye} iconColor="text-cyan-500" />
            <MedicalCard title="ORL" content={patient.antORL} icon={Ear} iconColor="text-amber-500" />
            <MedicalCard title="Digestifs" content={patient.antDigestive} icon={Pill} iconColor="text-emerald-500" />
            <MedicalCard title="Notes libres" content={patient.medicalHistory} icon={StickyNote} iconColor="text-slate-500" />
          </div>
        </div>
      </div>

      <section className="pt-12 border-t border-slate-100 dark:border-slate-800 space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <SectionHeader icon={BookOpen} title="Historique des consultations (HDLM)" />
            <button onClick={() => { setEditingSession(null); setIsAddingSession(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:brightness-105 active:scale-95 transition-all">
              <Plus size={18} /> Nouvelle Séance
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Filtrer par motif, traitement ou année (ex: 2024)..." 
                className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-primary"
                value={sessionSearch}
                onChange={e => setSessionSearch(e.target.value)}
              />
              {sessionSearch && <button onClick={() => setSessionSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500"><X size={12} /></button>}
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              {(['ALL', 'MONTH', 'YEAR'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${dateFilter === f ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {f === 'ALL' ? 'Toutes' : f === 'MONTH' ? 'Ce mois' : 'Cette année'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isAddingSession && (
          <SessionForm 
            patientId={patientId} 
            sessionToEdit={editingSession || undefined}
            onCancel={() => { setIsAddingSession(false); setEditingSession(null); }} 
            onSuccess={() => { setIsAddingSession(false); setEditingSession(null); fetchData(); }} 
          />
        )}

        <div className="space-y-5">
          {filteredSessions.length > 0 ? filteredSessions.map(s => {
            const open = expandedSessions.has(s.id!);
            return (
              <div key={s.id} className={`bg-white dark:bg-slate-900 border rounded-[2rem] transition-all duration-300 ${open ? 'border-primary shadow-2xl scale-[1.01]' : 'border-slate-100 dark:border-slate-800 shadow-sm hover:border-slate-200'}`}>
                <div onClick={() => toggleSession(s.id!)} className="px-8 py-5 flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-6">
                    <div className={`p-3.5 rounded-2xl transition-colors ${open ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary'}`}><Calendar size={22} /></div>
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">{new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter truncate max-w-[200px] sm:max-w-md">{s.hdlm}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => handleEditSession(e, s)} className="p-2.5 text-slate-300 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all" title="Modifier"><Edit3 size={16} /></button>
                    <button onClick={(e) => handleDeleteSession(e, s.id!)} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Supprimer"><Trash2 size={16} /></button>
                    <ChevronDown size={24} className={`text-slate-300 transition-transform duration-500 ${open ? 'rotate-180 text-primary' : ''}`} />
                  </div>
                </div>
                {open && (
                  <div className="px-8 pb-10 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-50 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={14} className="text-primary/50" /> Motif / HDLM</label>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border border-slate-100 dark:border-slate-800">{s.hdlm || "-"}</div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-primary/50" /> Tests Cliniques</label>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border border-slate-100 dark:border-slate-800">{s.tests || "-"}</div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><HeartPulse size={14} className="text-primary/50" /> Traitement</label>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border border-slate-100 dark:border-slate-800">{s.treatment || "-"}</div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2"><ClipboardList size={14} className="text-primary/50" /> Conseils</label>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic border border-slate-100 dark:border-slate-800">{s.advice || "-"}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="py-16 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
              <History size={32} className="opacity-10 mb-4" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">
                {sessionSearch || dateFilter !== 'ALL' ? 'Aucun résultat pour ces filtres' : 'Aucune séance enregistrée'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PatientDetail;
