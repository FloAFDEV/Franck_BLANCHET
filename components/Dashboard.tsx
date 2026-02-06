
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch, X, Filter, Users } from 'lucide-react';
import { getImageUrl, revokeUrl } from '../services/imageService';

interface DashboardProps {
  onSelectPatient: (id: number) => void;
}

const getAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

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
  const age = useMemo(() => getAge(patient.birthDate), [patient.birthDate]);

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
            {age} ans
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

  const filteredAndSortedPatients = useMemo(() => {
    return patients
      .filter(p => {
        const age = getAge(p.birthDate);
        const searchLower = search.toLowerCase().trim();
        
        const matchesSearch = searchLower === '' || (
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.profession.toLowerCase().includes(searchLower) ||
          age.toString() === searchLower
        );

        const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
        return matchesSearch && matchesGender;
      })
      .sort((a, b) => {
        const res = a.lastName.localeCompare(b.lastName);
        return sortOrder === 'asc' ? res : -res;
      });
  }, [patients, search, genderFilter, sortOrder]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4 sticky top-[72px] sm:top-[88px] z-20 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${search ? 'text-primary' : 'text-slate-400'}`} size={18} />
            <input 
              type="text" 
              placeholder="Nom, Prénom, Profession ou Âge..." 
              className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-2xl outline-none text-sm font-bold transition-all ${search ? 'border-primary ring-4 ring-primary/5' : 'border-slate-100 dark:border-slate-700 focus:border-primary/50'}`}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-500 hover:bg-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
              {(['ALL', 'M', 'F'] as const).map(g => (
                <button 
                  key={g} 
                  onClick={() => setGenderFilter(g)} 
                  className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all ${genderFilter === g ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {g === 'ALL' ? 'Tous' : (g === 'M' ? 'H' : 'F')}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
              <button onClick={() => setSortOrder('asc')} className={`p-2.5 rounded-xl transition-all ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600'}`} title="Trier A-Z"><SortAsc size={20} /></button>
              <button onClick={() => setSortOrder('desc')} className={`p-2.5 rounded-xl transition-all ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-100 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600'}`} title="Trier Z-A"><SortDesc size={20} /></button>
            </div>
          </div>
        </div>

        {/* Stats Indicator Only */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Users size={14} className="text-primary" />
            <span>{filteredAndSortedPatients.length} patient{filteredAndSortedPatients.length > 1 ? 's' : ''} trouvé{filteredAndSortedPatients.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-24 sm:pb-4">
        {filteredAndSortedPatients.length > 0 ? (
          filteredAndSortedPatients.map(patient => (
            <PatientCard key={patient.id} patient={patient} onSelect={onSelectPatient} />
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center text-slate-400 bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <UserRoundSearch size={40} className="opacity-20" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">Aucun patient trouvé</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2">Modifiez vos critères de recherche</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
