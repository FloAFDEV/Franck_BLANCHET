
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

  const genderBorderColor = patient.gender === 'F' ? 'border-pink-500' : 'border-blue-500';
  const genderBgSoft = patient.gender === 'F' ? 'bg-pink-50 dark:bg-pink-950/20' : 'bg-blue-50 dark:bg-blue-950/20';

  return (
    <button 
      onClick={() => onSelect(patient.id!)} 
      className="group flex items-center gap-4 p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-left hover:shadow-md hover:border-primary active:scale-[0.98] w-full"
    >
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border-[3px] ${genderBorderColor} ${genderBgSoft} text-slate-400 shadow-sm transition-transform group-hover:scale-105`}>
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <User size={28} className={patient.gender === 'F' ? 'text-pink-400' : 'text-blue-400'} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase truncate leading-tight">
            {patient.lastName}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize truncate">
            {patient.firstName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} ans
          </span>
          <span className="text-[10px] font-black text-primary uppercase truncate tracking-tight max-w-[100px]">
            {patient.profession || '...'}
          </span>
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
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4 sticky top-[72px] sm:top-[88px] z-20 backdrop-blur-md bg-white/90 dark:bg-slate-900/90">
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
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1">
            {(['ALL', 'M', 'F'] as const).map(g => (
              <button key={g} onClick={() => setGenderFilter(g)} className={`px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${genderFilter === g ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {g === 'ALL' ? 'Tous' : (g === 'M' ? 'H' : 'F')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={() => setSortOrder('asc')} className={`p-2 rounded-md transition-all ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}><SortAsc size={18} /></button>
            <button onClick={() => setSortOrder('desc')} className={`p-2 rounded-md transition-all ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}><SortDesc size={18} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-24 sm:pb-4">
        {filteredAndSortedPatients.length > 0 ? filteredAndSortedPatients.map(patient => (
          <PatientCard key={patient.id} patient={patient} onSelect={onSelectPatient} />
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <UserRoundSearch size={64} className="mb-4 opacity-10" />
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Aucun patient</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
