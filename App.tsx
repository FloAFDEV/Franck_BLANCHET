
import React, { useState, useEffect, useRef } from 'react';
import { db } from './db';
import { View, Practitioner } from './types';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import PatientDetail from './components/PatientDetail';
import PractitionerProfile from './components/PractitionerProfile';
import LoginView from './components/LoginView';
import { Plus, ChevronLeft, UserCircle, Settings, Download, Upload, HardDrive, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number, total: number } | null>(null);
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

  const updateStorageEstimate = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      setStorageUsage({
        used: estimate.usage || 0,
        total: estimate.quota || 0
      });
    }
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
  };

  useEffect(() => {
    refreshPractitioner();
    updateStorageEstimate();
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

  const handleExportData = async () => {
    setIsProcessing(true);
    try {
      const patients = await db.patients.toArray();
      const sessions = await db.sessions.toArray();
      const profiles = await db.profile.toArray();
      const mediaMeta = await db.media_metadata.toArray();
      
      const dataToExport = { 
        app: "OstéoSuivi", 
        version: "3.0",
        exportDate: new Date().toISOString(),
        practitioner: profiles, 
        patients, 
        sessions,
        mediaMeta
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `osteosuivi_backup_${new Date().toISOString().split('T')[0]}.json`;
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

    const confirmMessage = "ATTENTION : L'importation va EFFACER TOUTES VOS DONNÉES ACTUELLES (patients, séances, photos) pour les remplacer par celles du fichier.\n\nCette action est irréversible. Souhaitez-vous continuer ?";
    
    if (!confirm(confirmMessage)) {
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.app !== "OstéoSuivi") {
          throw new Error("Ce fichier n'est pas un format de sauvegarde OstéoSuivi valide.");
        }

        await db.transaction('rw', [db.patients, db.sessions, db.profile, db.media_metadata, db.media_blobs, db.thumbnails], async () => {
          await db.patients.clear();
          await db.sessions.clear();
          await db.profile.clear();
          await db.media_metadata.clear();
          await db.media_blobs.clear();
          await db.thumbnails.clear();

          if (data.patients) await db.patients.bulkAdd(data.patients);
          if (data.sessions) await db.sessions.bulkAdd(data.sessions);
          if (data.practitioner) await db.profile.bulkPut(data.practitioner);
          if (data.mediaMeta) await db.media_metadata.bulkAdd(data.mediaMeta);
          // Note: Les blobs d'images ne sont généralement pas dans le JSON à cause de leur taille, 
          // sauf s'ils ont été encodés en base64, ce qui n'est pas recommandé pour IndexedDB.
        });

        alert("Importation réussie ! L'application va redémarrer.");
        window.location.reload();
      } catch (err) {
        alert("Erreur lors de l'importation : " + (err as Error).message);
      } finally {
        setIsProcessing(false);
        if (importFileRef.current) importFileRef.current.value = '';
      }
    };
    reader.onerror = () => {
      alert("Le fichier n'a pas pu être lu.");
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const usagePercent = storageUsage ? Math.round((storageUsage.used / storageUsage.total) * 100) : 0;

  if (isLocked && practitioner?.password) {
    return (
      <div style={themeStyles} className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
        <LoginView practitioner={practitioner} onUnlock={() => setIsLocked(false)} />
      </div>
    );
  }

  return (
    <div style={themeStyles} className={`mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200 ${isProcessing ? 'pointer-events-none' : ''}`}>
      <style>{`
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .bg-primary-soft { background-color: var(--primary-soft); }
      `}</style>

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500 text-center">Restauration des données...</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          {currentView !== 'DASHBOARD' && (
            <button onClick={() => navigateTo('DASHBOARD')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigateTo('DASHBOARD')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl overflow-hidden flex items-center justify-center text-white shadow-sm">
              {practitioner?.photo ? <img src={practitioner.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-none">OstéoSuivi</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Local-DB</span>
                <div className="flex items-center gap-1 text-[8px] font-black text-primary leading-none">
                  <HardDrive size={8} /> {usagePercent}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {currentView === 'DASHBOARD' && (
            <>
              <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
              <button onClick={() => importFileRef.current?.click()} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Importer une sauvegarde JSON"><Upload size={18} /></button>
              <button onClick={handleExportData} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Exporter les données actuelles"><Download size={18} /></button>
              <button onClick={() => navigateTo('PRACTITIONER_PROFILE')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Paramètres du profil"><Settings size={18} /></button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {currentView === 'DASHBOARD' && <Dashboard onSelectPatient={(id) => navigateTo('PATIENT_DETAIL', id)} />}
        {currentView === 'ADD_PATIENT' && <PatientForm onCancel={() => navigateTo('DASHBOARD')} onSuccess={() => { updateStorageEstimate(); navigateTo('DASHBOARD'); }} />}
        {currentView === 'EDIT_PATIENT' && selectedPatientId && <PatientForm patientId={selectedPatientId} onCancel={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} onSuccess={() => { updateStorageEstimate(); navigateTo('PATIENT_DETAIL', selectedPatientId); }} />}
        {currentView === 'PATIENT_DETAIL' && selectedPatientId && <PatientDetail patientId={selectedPatientId} onEdit={() => navigateTo('EDIT_PATIENT', selectedPatientId)} onDelete={() => { updateStorageEstimate(); navigateTo('DASHBOARD'); }} />}
        {currentView === 'PRACTITIONER_PROFILE' && <PractitionerProfile onSuccess={() => { refreshPractitioner(); navigateTo('DASHBOARD'); }} onCancel={() => navigateTo('DASHBOARD')} />}
      </main>

      {currentView === 'DASHBOARD' && (
        <div className="fixed bottom-6 right-6 z-40 sm:hidden">
          <button onClick={() => navigateTo('ADD_PATIENT')} className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/40 active:scale-90 transition-transform">
            <Plus size={28} />
          </button>
        </div>
      )}
      
      {currentView === 'DASHBOARD' && (
        <div className="hidden sm:block fixed bottom-8 right-8">
           <button onClick={() => navigateTo('ADD_PATIENT')} className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-primary/20 transition-all active:scale-95">
            <Plus size={20} /> Nouveau Patient
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
