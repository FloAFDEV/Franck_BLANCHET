
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../db';
import { Patient } from '../types';
import { Search, User, SortAsc, SortDesc, UserRoundSearch, X, Users, AlertTriangle, Download, Plus } from 'lucide-react';
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

  const borderColor = patient.gender === 'F' ? 'border-pink-300' : 'border-blue-300';
  const age = useMemo(() => getAge(patient.birthDate), [patient.birthDate]);

  return (
    <button onClick={() => onSelect(patient.id!)} className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all text-left w-full">
      <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 ${borderColor} flex items-center justify-center text-slate-200`}>
        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase truncate leading-none mb-1">{patient.lastName} {patient.firstName}</span>
          <span className="text-[11px] text-slate-500 truncate">{patient.profession || 'Profession non renseignée'}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-medium text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">{age} ans</span>
          <span className="text-[10px] font-semibold text-primary/80 uppercase truncate tracking-tight">{patient.phone}</span>
        </div>
      </div>
    </button>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectPatient, isBackupDue, onExportRequest }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { db.patients.toArray().then(setPatients); }, []);

  const filteredPatients = useMemo(() => {
    return patients
      .filter(p => `${p.firstName} ${p.lastName} ${p.profession}`.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => sortOrder === 'asc' ? a.lastName.localeCompare(b.lastName) : b.lastName.localeCompare(a.lastName));
  }, [patients, search, sortOrder]);

  return (
    <div className="space-y-6">
      {isBackupDue && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-center gap-4">
          <AlertTriangle className="text-amber-500 shrink-0" size={20} />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-800 dark:text-amber-400">Action recommandée</p>
            <p className="text-amber-700 dark:text-amber-500 mt-0.5">Veuillez exporter vos données récentes pour plus de sécurité.</p>
          </div>
          <button onClick={onExportRequest} className="p-2 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg"><Download size={18} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Recherche patient..." className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={14} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary">
            {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          </button>
          <button onClick={() => onSelectPatient(-1)} className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm hover:brightness-105 transition-all">
            <Plus size={16} /> Nouveau Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map(p => <PatientCard key={p.id} patient={p} onSelect={onSelectPatient} />)}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
            <UserRoundSearch size={32} className="opacity-20 mb-4" />
            <p className="text-xs font-medium uppercase tracking-wider">Aucun patient trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
