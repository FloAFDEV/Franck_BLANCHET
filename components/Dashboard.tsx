
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch } from 'lucide-react';
import { getImageUrl, revokeUrl } from '../services/imageService';

interface DashboardProps {
  onSelectPatient: (id: number) => void;
}

const PatientCard: React.FC<{ 
  patient: Patient, 
  onSelect: (id: number) => void 
}> = ({ patient, onSelect }) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (patient.photoId) {
      getImageUrl(patient.photoId, 'thumb').then(u => {
        url = u;
        setThumbUrl(u);
      });
    }
    return () => { if (url) revokeUrl(url); };
  }, [patient.photoId]);

  // Style de bordure basé sur le genre
  const genderColorClass = patient.gender === 'F' ? 'border-pink-500' : 'border-blue-500';

  return (
    <button 
      onClick={() => onSelect(patient.id!)} 
      className={`group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-left hover:shadow-md hover:border-primary active:scale-[0.98] w-full`}
    >
      <div className={`w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border-[3px] ${genderColorClass} bg-slate-50 dark:bg-slate-800 text-slate-400 shadow-sm transition-transform group-hover:scale-105`}>
        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <User size={24} />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 truncate flex flex-col leading-none gap-1">
          <span className="uppercase text-sm leading-none">{patient.lastName}</span>
          <span className="capitalize font-medium text-slate-500 dark:text-slate-400 text-xs leading-none">{patient.firstName}</span>
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
          <span className="text-[10px] font-black text-primary uppercase truncate tracking-tight">{patient.profession || 'Sans profession'}</span>
        </div>
      </div>
    </button>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'M' | 'F'>('ALL');

  useEffect(() => { db.patients.toArray().then(setPatients); }, []);

  const filteredAndSortedPatients = patients
    .filter(p => {
      const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      const res = a.lastName.localeCompare(b.lastName);
      return sortOrder === 'asc' ? res : -res;
    });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un patient..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all"
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1">
            {(['ALL', 'M', 'F'] as const).map(g => (
              <button key={g} onClick={() => setGenderFilter(g)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${genderFilter === g ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {g === 'ALL' ? 'Tous' : (g === 'M' ? 'Hommes' : 'Femmes')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={() => setSortOrder('asc')} className={`p-2 rounded-md transition-all ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}><SortAsc size={18} /></button>
            <button onClick={() => setSortOrder('desc')} className={`p-2 rounded-md transition-all ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}><SortDesc size={18} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-20 sm:pb-4">
        {filteredAndSortedPatients.length > 0 ? filteredAndSortedPatients.map(patient => (
          <PatientCard key={patient.id} patient={patient} onSelect={onSelectPatient} />
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <UserRoundSearch size={64} className="mb-4 opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Aucun patient trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
