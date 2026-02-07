
import React, { useState, useEffect, useCallback } from 'react';
import { db, checkAndRequestPersistence } from './db';
import { View, Practitioner } from './types';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import PatientDetail from './components/PatientDetail';
import PractitionerProfile from './components/PractitionerProfile';
import LoginView from './components/LoginView';
import { Plus, ChevronLeft, UserCircle, Settings, LogOut, HardDrive, ShieldCheck, AlertTriangle } from 'lucide-react';

const DUCK_AVATAR = "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/duck.png";

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<boolean | null>(null);

  // Charger le profil et gérer l'initialisation
  const loadProfile = useCallback(async () => {
    let p = await db.profile.get(1);
    if (!p) {
      // Profil initial avec le canard
      p = {
        id: 1,
        firstName: '',
        lastName: 'Praticien',
        themeColor: '#14b8a6',
        photo: DUCK_AVATAR,
        password: '',
        isDarkMode: false
      };
      await db.profile.put(p);
    }
    setPractitioner(p);
    
    // Appliquer le thème
    document.documentElement.style.setProperty('--primary', p.themeColor);
    if (p.isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    // Verrouillage auto si un mot de passe existe
    setIsLocked(!!p.password);
    setInitialized(true);
  }, []);

  useEffect(() => {
    loadProfile();
    checkAndRequestPersistence().then(setPersistenceStatus);
  }, [loadProfile]);

  // Inactivité: Verrouiller après 15 minutes
  useEffect(() => {
    let timer: number;
    const resetTimer = () => {
      clearTimeout(timer);
      if (practitioner?.password) {
        timer = window.setTimeout(() => setIsLocked(true), 15 * 60 * 1000);
      }
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      clearTimeout(timer);
    };
  }, [practitioner]);

  if (!initialized) return null;

  if (isLocked && practitioner?.password) {
    return <LoginView practitioner={practitioner} onUnlock={() => setIsLocked(false)} />;
  }

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard onSelectPatient={(id) => {
          if (id === -1) setView('ADD_PATIENT');
          else { setSelectedPatientId(id); setView('PATIENT_DETAIL'); }
        }} />;
      case 'ADD_PATIENT':
        return <PatientForm onCancel={() => setView('DASHBOARD')} onSuccess={() => setView('DASHBOARD')} />;
      case 'EDIT_PATIENT':
        return <PatientForm patientId={selectedPatientId!} onCancel={() => setView('PATIENT_DETAIL')} onSuccess={() => setView('PATIENT_DETAIL')} />;
      case 'PATIENT_DETAIL':
        return <PatientDetail patientId={selectedPatientId!} onEdit={() => setView('EDIT_PATIENT')} onDelete={() => setView('DASHBOARD')} />;
      case 'PRACTITIONER_PROFILE':
        return <PractitionerProfile onCancel={() => setView('DASHBOARD')} onSuccess={() => { loadProfile(); setView('DASHBOARD'); }} />;
      default:
        return <Dashboard onSelectPatient={(id) => {
          if (id === -1) setView('ADD_PATIENT');
          else { setSelectedPatientId(id); setView('PATIENT_DETAIL'); }
        }} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-primary/20">
      {/* Header Raffiné */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {view !== 'DASHBOARD' && (
              <button onClick={() => setView(view === 'EDIT_PATIENT' ? 'PATIENT_DETAIL' : 'DASHBOARD')} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all active:scale-90">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
                Ostéo<span className="text-primary">Suivi</span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-primary/10 text-primary text-[8px] rounded-full border border-primary/20">v1.2</span>
              </h1>
              {persistenceStatus === false && (
                <div className="flex items-center gap-1 text-[8px] font-bold text-amber-500 uppercase tracking-tighter mt-0.5">
                  <AlertTriangle size={8} /> Données non persistées (Installez l'app)
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setView('PRACTITIONER_PROFILE')} className="flex items-center gap-3 p-1.5 pr-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all group">
              <div className="w-9 h-9 rounded-xl border-2 border-white dark:border-slate-700 overflow-hidden shadow-sm">
                {practitioner?.photo ? <img src={practitioner.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none">{practitioner?.lastName || 'Praticien'}</p>
                <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">Paramètres</p>
              </div>
            </button>
            {practitioner?.password && (
              <button onClick={() => setIsLocked(true)} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all shadow-sm" title="Verrouiller">
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {renderView()}
      </main>

      {/* Bottom Footer Info */}
      <footer className="py-8 px-8 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-primary" /> Stockage Chiffré Local Uniquement
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-primary transition-colors">Aide</a>
            <span className="opacity-20">•</span>
            <a href="#" className="hover:text-primary transition-colors">Conditions</a>
            <span className="opacity-20">•</span>
            <span className="flex items-center gap-1.5"><HardDrive size={10} /> IndexedDB Actif</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
