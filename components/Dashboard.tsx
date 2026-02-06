
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch } from 'lucide-react';

interface DashboardProps {
  onSelectPatient: (id: number) => void;
}

const getGenderColor = (gender: Gender) => {
  switch (gender) {
    case 'M': return 'border-blue-400 bg-blue-50 text-blue-600';
    case 'F': return 'border-pink-400 bg-pink-50 text-pink-600';
    default: return 'border-slate-400 bg-slate-50 text-slate-600';
  }
};

const calculateAge = (birthDate: string) => {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'M' | 'F'>('ALL');

  useEffect(() => {
    const fetchPatients = async () => {
      const allPatients = await db.patients.toArray();
      setPatients(allPatients);
    };
    fetchPatients();
  }, []);

  const filteredAndSortedPatients = patients
    .filter(p => {
      const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase());
      const matchesGender = genderFilter === 'ALL' || p.gender === genderFilter;
      return matchesSearch && matchesGender;
    })
    .sort((a, b) => {
      const nameA = a.lastName.toLowerCase();
      const nameB = b.lastName.toLowerCase();
      if (sortOrder === 'asc') return nameA.localeCompare(nameB);
      return nameB.localeCompare(nameA);
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Search & Filters Toolbar */}
      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Rechercher un dossier..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-4 focus:ring-primary-soft focus:border-primary transition-all font-medium text-slate-700"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            <button 
              onClick={() => setSortOrder('asc')}
              className={`p-2 rounded-xl transition-all ${sortOrder === 'asc' ? 'bg-primary-soft text-primary' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Trier A-Z"
            >
              <SortAsc size={20} />
            </button>
            <button 
              onClick={() => setSortOrder('desc')}
              className={`p-2 rounded-xl transition-all ${sortOrder === 'desc' ? 'bg-primary-soft text-primary' : 'text-slate-400 hover:bg-slate-50'}`}
              title="Trier Z-A"
            >
              <SortDesc size={20} />
            </button>
          </div>

          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm overflow-hidden">
            <button 
              onClick={() => setGenderFilter('ALL')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${genderFilter === 'ALL' ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => setGenderFilter('M')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${genderFilter === 'M' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              H
            </button>
            <button 
              onClick={() => setGenderFilter('F')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${genderFilter === 'F' ? 'bg-pink-500 text-white shadow-lg shadow-pink-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              F
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedPatients.length > 0 ? (
          filteredAndSortedPatients.map(patient => (
            <button
              key={patient.id}
              onClick={() => patient.id && onSelectPatient(patient.id)}
              className="group flex items-center gap-4 p-5 bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:border-primary hover:shadow-xl hover:shadow-primary-soft transition-all text-left active:scale-[0.98]"
            >
              <div className={`w-16 h-16 rounded-3xl border-2 overflow-hidden flex items-center justify-center shrink-0 transition-all group-hover:scale-105 ${getGenderColor(patient.gender)}`}>
                {patient.photo ? (
                  <img src={patient.photo} alt={patient.lastName} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-800 truncate uppercase tracking-tight text-sm">
                    {patient.lastName} <span className="capitalize font-bold text-slate-500">{patient.firstName}</span>
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1">
                  {calculateAge(patient.birthDate)} ans <span className="opacity-30">•</span> {patient.gender === 'M' ? 'Homme' : 'Femme'}
                </p>
                <p className="text-xs text-primary font-black truncate mt-1 uppercase tracking-widest">
                  {patient.profession || '...'}
                </p>
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[3rem] border-4 border-dashed border-slate-50">
            <UserRoundSearch size={64} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Aucun dossier trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
