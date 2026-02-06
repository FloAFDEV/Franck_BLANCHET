
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch, X, Filter, Download, Plus, Check } from 'lucide-react';
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

  const genderColor = patient.gender === 'F' ? 'border-pink-200 dark:border-pink-900/40' : 'border-blue-200 dark:border-blue-900/40';
  const age = useMemo(() => getAge(patient.birthDate), [patient.birthDate]);

  return (
    <button onClick={() => onSelect(patient.id!)} className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all text-left w-full">
      <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 ${genderColor} flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300`}>
        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase truncate leading-none mb-1">{patient.lastName} {patient.firstName}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{patient.profession || 'Profession non renseignée'}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded">{age} ans</span>
          <span className="text-[10px] font-medium text-primary/80 uppercase truncate tracking-tight">{patient.phone}</span>
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

  useEffect(() => { db.patients.toArray().then(setPatients); }, []);

  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => {
        const matchesSearch = `${p.firstName} ${p.lastName} ${p.profession} ${p.phone}`.toLowerCase().includes(search.toLowerCase());
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
            placeholder="Rechercher (Nom, Mobile, Profession...)" 
            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm transition-all" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"><X size={14} /></button>}
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} 
            className="flex-1 sm:flex-none p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary transition-colors flex justify-center items-center gap-2"
            title="Trier par nom"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider sm:hidden">Trier</span>
            {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>
          <button 
            onClick={() => onSelectPatient(-1)} 
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={16} /> <span className="sm:inline">Nouveau Patient</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto">
          {(['ALL', 'M', 'F'] as const).map(f => (
            <button
              key={f}
              onClick={() => setGenderFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                genderFilter === f 
                  ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              {genderFilter === f && <Check size={10} />}
              {f === 'ALL' ? 'Tous' : f === 'M' ? 'Hommes' : 'Femmes'}
            </button>
          ))}
        </div>
        
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-1">
          {filteredPatients.length} patient{filteredPatients.length > 1 ? 's' : ''} trouvé{filteredPatients.length > 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(p => <PatientCard key={p.id} patient={p} onSelect={onSelectPatient} />)}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
            <UserRoundSearch size={32} className="opacity-20 mb-4" />
            <p className="text-[11px] font-medium uppercase tracking-widest">Aucun résultat pour cette recherche</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
