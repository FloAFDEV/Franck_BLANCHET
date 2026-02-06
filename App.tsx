
import React, { useState, useEffect, useRef } from 'react';
import { db } from './db';
import { View, Practitioner } from './types';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import PatientDetail from './components/PatientDetail';
import PractitionerProfile from './components/PractitionerProfile';
import LoginView from './components/LoginView';
import { Plus, ChevronLeft, UserCircle, RefreshCcw, Settings, Download, Upload, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const refreshPractitioner = async () => {
    const p = await db.profile.get(1);
    if (p) {
      setPractitioner(p);
      if (!p.password) setIsLocked(false);
    } else {
      const defaultProfile = { id: 1, firstName: '', lastName: '', themeColor: '#14b8a6', isDarkMode: false };
      await db.profile.put(defaultProfile);
      setPractitioner(defaultProfile);
      setIsLocked(false);
    }
  };

  useEffect(() => {
    refreshPractitioner();
  }, []);

  useEffect(() => {
    if (practitioner?.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [practitioner?.isDarkMode]);

  const themeStyles = React.useMemo(() => {
    const color = practitioner?.themeColor || '#14b8a6';
    return {
      '--primary': color,
      '--primary-soft': `${color}15`,
      '--primary-border': `${color}30`,
    } as React.CSSProperties;
  }, [practitioner?.themeColor]);

  const navigateTo = (view: View, patientId: number | null = null) => {
    setCurrentView(view);
    setSelectedPatientId(patientId);
    window.scrollTo(0, 0);
  };

  const handleResetExpress = async () => {
    if (confirm("ATTENTION : Cette action supprimera DÉFINITIVEMENT toutes les données. Continuer ?")) {
      await db.resetDatabase();
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    setIsProcessing(true);
    try {
      const patients = await db.patients.toArray();
      const sessions = await db.sessions.toArray();
      const profiles = await db.profile.toArray();
      
      // Inclusion explicite des configurations dans l'export
      const dataToExport = { 
        app: "OstéoSuivi", 
        version: "2.0",
        config: {
          exportDate: new Date().toISOString(),
          theme: practitioner?.themeColor,
          mode: practitioner?.isDarkMode ? 'dark' : 'light'
        },
        practitioner: profiles, 
        patients, 
        sessions 
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `osteosuivi_export_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erreur lors de l'exportation : " + error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("L'importation remplacera TOUTES vos données. Voulez-vous continuer ?")) {
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.patients || !json.sessions || !json.practitioner) {
          throw new Error("Fichier de sauvegarde invalide.");
        }

        await db.transaction('rw', db.patients, db.sessions, db.profile, async () => {
          await db.patients.clear();
          await db.sessions.clear();
          await db.profile.clear();
          await db.patients.bulkAdd(json.patients);
          await db.sessions.bulkAdd(json.sessions);
          await db.profile.bulkAdd(json.practitioner);
        });

        alert("Données restaurées avec succès.");
        window.location.reload();
      } catch (error) {
        alert("Erreur lors de l'importation.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  if (isLocked && practitioner?.password) {
    return (
      <div style={themeStyles} className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <LoginView practitioner={practitioner} onUnlock={() => setIsLocked(false)} />
      </div>
    );
  }

  return (
    <div style={themeStyles} className={`max-w-5xl mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200 ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
      <style>{`
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .ring-primary { --tw-ring-color: var(--primary); }
        .bg-primary-soft { background-color: var(--primary-soft); }
        .border-primary-soft { border-color: var(--primary-border); }
      `}</style>

      <input type="file" ref={importFileRef} onChange={handleImportData} accept=".json" className="hidden" />

      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          {currentView !== 'DASHBOARD' && (
            <button onClick={() => navigateTo('DASHBOARD')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('DASHBOARD')}>
            <div className="w-9 h-9 bg-primary rounded-lg overflow-hidden flex items-center justify-center text-white border border-white/20">
              {practitioner?.photo ? <img src={practitioner.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={22} />}
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight">OstéoSuivi</span>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Cabinet {practitioner?.lastName || 'Médical'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentView === 'DASHBOARD' && (
            <>
              <button onClick={() => importFileRef.current?.click()} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Importer"><Upload size={18} /></button>
              <button onClick={handleExportData} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Exporter"><Download size={18} /></button>
              <button onClick={() => navigateTo('PRACTITIONER_PROFILE')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Paramètres"><Settings size={18} /></button>
              <button onClick={() => navigateTo('ADD_PATIENT')} className="ml-2 bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:brightness-95 active:scale-95 transition-all shadow-sm">
                <Plus size={18} />
                <span className="hidden sm:inline">Nouveau Patient</span>
              </button>
            </>
          )}
          {practitioner?.password && (
            <button onClick={() => setIsLocked(true)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <Lock size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6">
        {currentView === 'DASHBOARD' && <Dashboard onSelectPatient={(id) => navigateTo('PATIENT_DETAIL', id)} />}
        {currentView === 'ADD_PATIENT' && <PatientForm onCancel={() => navigateTo('DASHBOARD')} onSuccess={() => navigateTo('DASHBOARD')} />}
        {currentView === 'EDIT_PATIENT' && selectedPatientId && <PatientForm patientId={selectedPatientId} onCancel={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} onSuccess={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} />}
        {currentView === 'PATIENT_DETAIL' && selectedPatientId && <PatientDetail patientId={selectedPatientId} onEdit={() => navigateTo('EDIT_PATIENT', selectedPatientId)} onDelete={() => navigateTo('DASHBOARD')} />}
        {currentView === 'PRACTITIONER_PROFILE' && <PractitionerProfile onSuccess={() => { refreshPractitioner(); navigateTo('DASHBOARD'); }} onCancel={() => navigateTo('DASHBOARD')} />}
      </main>

      <footer className="py-4 text-center border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">
        Dispositif de gestion de soins local et sécurisé
      </footer>
    </div>
  );
};

export default App;
