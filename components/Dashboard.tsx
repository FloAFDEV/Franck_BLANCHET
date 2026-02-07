
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch, X, Plus, Check, LayoutGrid, List, ChevronRight } from 'lucide-react';
import { getImageUrl, revokeUrl } from '../services/imageService';

interface DashboardProps {
  onSelectPatient: (id: number) => void;
  isBackupDue?: boolean;
  onExportRequest?: () => void;
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

const PatientCard: React.FC<{ patient: Patient, onSelect: (id: number) => void }> = ({ patient, onSelect }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (patient.photoId) getImageUrl(patient.photoId, 'thumb').then(u => { url = u; setThumbUrl(u); });
    return () => { if (url) revokeUrl(url); };
  }, [patient.photoId]);

  const genderStyles = patient.gender === 'F' 
    ? 'border-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.3)] dark:border-pink-400' 
    : 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)] dark:border-blue-400';
    
  const age = useMemo(() => getAge(patient.birthDate), [patient.birthDate]);

  return (
    <button onClick={() => onSelect(patient.id!)} className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all text-left w-full">
      <div className={`w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-4 ${genderStyles} flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 transition-transform group-hover:scale-105`}>
        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <User size={28} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase truncate leading-none mb-1">{patient.lastName} {patient.firstName}</span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate uppercase tracking-tight">{patient.profession || 'Sans profession'}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{age} ans</span>
          <span className="text-[10px] font-bold text-primary truncate tracking-tight">{patient.phone}</span>
        </div>
      </div>
    </button>
  );
};

const PatientListItem: React.FC<{ patient: Patient, onSelect: (id: number) => void }> = ({ patient, onSelect }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (patient.photoId) getImageUrl(patient.photoId, 'thumb').then(u => { url = u; setThumbUrl(u); });
    return () => { if (url) revokeUrl(url); };
  }, [patient.photoId]);

  const genderColor = patient.gender === 'F' ? 'border-pink-500 dark:border-pink-400' : 'border-blue-500 dark:border-blue-400';
  const age = useMemo(() => getAge(patient.birthDate), [patient.birthDate]);

  return (
    <button onClick={() => onSelect(patient.id!)} className="group flex items-center gap-4 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-primary transition-all text-left w-full">
      <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-[3px] ${genderColor} flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300`}>
        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
      </div>
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase truncate leading-none">{patient.lastName} {patient.firstName}</span>
          <span className="text-[10px] text-slate-400 truncate mt-0.5 sm:hidden">{patient.profession}</span>
        </div>
        <div className="hidden sm:block min-w-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{patient.profession || '—'}</span>
        </div>
        <div className="flex items-center gap-2 sm:justify-center">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${patient.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>{patient.gender}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{age} ans</span>
        </div>
        <div className="flex items-center justify-end gap-3">
          <span className="text-[10px] font-bold text-primary uppercase truncate tracking-tight hidden sm:block">{patient.phone}</span>
          <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </button>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectPatient, isBackupDue, onExportRequest }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<Gender | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => { db.patients.toArray().then(setPatients); }, []);

  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => {
        // Recherche étendue incluant l'adresse
        const searchTerms = [p.firstName, p.lastName, p.profession, p.phone, p.address].join(' ').toLowerCase();
        const matchesSearch = searchTerms.includes(search.toLowerCase());
        const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
        return matchesSearch && matchesGender;
      })
      .sort((a, b) => sortOrder === 'asc' ? a.lastName.localeCompare(b.lastName) : b.lastName.localeCompare(a.lastName));
  }, [patients, search, genderFilter, sortOrder]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher nom, métier, adresse, mobile..." 
            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-primary text-sm shadow-sm transition-all" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={14} /></button>}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Grille">
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`} title="Liste">
              <List size={18} />
            </button>
          </div>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary shadow-sm transition-colors flex justify-center items-center" title="Trier">
            {sortOrder === 'asc' ? <SortAsc size={20} /> : <SortDesc size={20} />}
          </button>
          <button onClick={() => onSelectPatient(-1)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider shadow-lg hover:brightness-105 active:scale-95 transition-all">
            <Plus size={18} /> <span className="sm:inline">Nouveau</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full sm:w-auto">
          {(['ALL', 'M', 'F'] as const).map(f => (
            <button key={f} onClick={() => setGenderFilter(f)} className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${genderFilter === f ? 'bg-white dark:bg-slate-700 text-primary shadow-md border border-slate-200 dark:border-slate-600' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}>
              {f === 'ALL' ? 'Tous' : f === 'M' ? 'Hommes' : 'Femmes'}
            </button>
          ))}
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">
          {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "flex flex-col gap-3"}>
        {filteredPatients.map(p => (
          viewMode === 'grid' 
            ? <PatientCard key={p.id} patient={p} onSelect={onSelectPatient} />
            : <PatientListItem key={p.id} patient={p} onSelect={onSelectPatient} />
        ))}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-24 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
            <UserRoundSearch size={48} className="opacity-10 mb-6" />
            <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Aucun patient trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
