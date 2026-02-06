
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch } from 'lucide-react';

interface DashboardProps {
  onSelectPatient: (id: number) => void;
}

const getGenderStyles = (gender: Gender) => {
  switch (gender) {
    case 'M': return {
      container: 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500',
      avatar: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
      tag: 'text-blue-500'
    };
    case 'F': return {
      container: 'border-slate-200 dark:border-slate-800 hover:border-pink-400 dark:hover:border-pink-500',
      avatar: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
      tag: 'text-pink-500'
    };
    default: return {
      container: 'border-slate-200 dark:border-slate-800 hover:border-primary',
      avatar: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
      tag: 'text-slate-400'
    };
  }
};

const calculateAge = (birthDate: string) => {
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  return age;
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
      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher par nom..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none text-sm transition-all"
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            {['ALL', 'M', 'F'].map(g => (
              <button 
                key={g} 
                onClick={() => setGenderFilter(g as any)} 
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${genderFilter === g ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {g === 'ALL' ? 'Tous' : g}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 rounded p-0.5">
            <button onClick={() => setSortOrder('asc')} className={`p-1.5 rounded transition-all ${sortOrder === 'asc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}><SortAsc size={16} /></button>
            <button onClick={() => setSortOrder('desc')} className={`p-1.5 rounded transition-all ${sortOrder === 'desc' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400'}`}><SortDesc size={16} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedPatients.length > 0 ? filteredAndSortedPatients.map(patient => {
          const styles = getGenderStyles(patient.gender);
          return (
            <button 
              key={patient.id} 
              onClick={() => onSelectPatient(patient.id!)} 
              className={`group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-sm transition-all text-left ${styles.container} hover:shadow-md active:scale-[0.99]`}
            >
              <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700 ${styles.avatar}`}>
                {patient.photo ? <img src={patient.photo} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  <span className="uppercase">{patient.lastName}</span>
                  <span className="capitalize font-medium text-slate-500">{patient.firstName}</span>
                  {patient.gender === 'F' && (
                    <span className={`text-[10px] font-black ml-auto px-1.5 py-0.5 rounded border border-current bg-white dark:bg-slate-900 ${styles.tag}`}>F</span>
                  )}
                  {patient.gender === 'M' && (
                    <span className="text-[10px] font-black ml-auto px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400">M</span>
                  )}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{calculateAge(patient.birthDate)} ans</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                  <span className="text-[10px] font-bold text-primary uppercase truncate">{patient.profession || '...'}</span>
                </div>
              </div>
            </button>
          );
        }) : (
          <div className="col-span-full py-12 flex flex-col items-center text-slate-400">
            <UserRoundSearch size={48} className="mb-3 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Aucun résultat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
