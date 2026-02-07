
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
  const [isBackupDue, setIsBackupDue] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const checkBackupStatus = async (p: Practitioner) => {
    const patientCount = await db.patients.count();
    const sessionCount = await db.sessions.count();
    const currentTotalRecords = patientCount + sessionCount;
    const lastDate = p.lastExportDate || 0;
    const lastCount = p.lastExportRecordCount || 0;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    setIsBackupDue((Date.now() - lastDate > sevenDaysInMs) || (currentTotalRecords - lastCount >= 20));
  };

  const refreshPractitioner = async () => {
    const p = await db.profile.get(1);
    if (p) {
      setPractitioner(p);
      if (!p.password) setIsLocked(false);
      checkBackupStatus(p);
    } else {
      const defaultProfile: Practitioner = { 
        id: 1, firstName: '', lastName: '', themeColor: '#14b8a6', isDarkMode: false,
        lastExportDate: Date.now(), lastExportRecordCount: 0
      };
      await db.profile.put(defaultProfile);
      setPractitioner(defaultProfile);
      setIsLocked(false);
    }
  };

  const updateStorageEstimate = async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      setStorageUsage({ used: estimate.usage || 0, total: estimate.quota || 0 });
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
    let color = practitioner?.themeColor || '#14b8a6';
    const isDark = practitioner?.isDarkMode;
    
    if (color === '#f59e0b' || color === 'orange') color = '#f59e0b';

    const lighten = (hex: string, percent: number) => {
      const num = parseInt(hex.replace("#",""), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
      return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
    };

    const isGrayish = color === '#64748b' || color === '#475569';
    const textColor = (isDark && isGrayish) ? lighten(color, 60) : color;

    return {
      '--primary': color,
      '--primary-text': textColor,
      '--primary-soft': `${color}15`,
      '--primary-border': `${color}30`,
    } as React.CSSProperties;
  }, [practitioner?.themeColor, practitioner?.isDarkMode]);

  const navigateTo = (view: View, patientId: number | null = null) => {
    setCurrentView(view);
    setSelectedPatientId(patientId);
    window.scrollTo(0, 0);
  };

  const handleExportData = async () => {
    if (!confirm("Voulez-vous générer une sauvegarde de toutes vos données (patients, séances, photos) ?")) return;
    setIsProcessing(true);
    try {
      const patients = await db.patients.toArray();
      const sessions = await db.sessions.toArray();
      const profiles = await db.profile.toArray();
      const mediaMeta = await db.media_metadata.toArray();
      const dataToExport = { app: "OstéoSuivi", version: "3.5", exportDate: new Date().toISOString(), practitioner: profiles, patients, sessions, mediaMeta };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `osteo_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      if (practitioner) {
        const updated = { ...practitioner, lastExportDate: Date.now(), lastExportRecordCount: patients.length + sessions.length };
        await db.profile.put(updated);
        setPractitioner(updated);
        setIsBackupDue(false);
      }
    } catch (error) { alert("Erreur export: " + error); } finally { setIsProcessing(false); }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("ATTENTION : L'importation va supprimer TOUTES les données actuelles de votre application pour les remplacer par celles du fichier. Continuer ?")) {
      e.target.value = '';
      return;
    }
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.app !== "OstéoSuivi") throw new Error("Le fichier n'est pas une sauvegarde valide d'OstéoSuivi.");
        
        // Fix: Use transaction method from db instance, ensuring it is recognized via proper inheritance from Dexie
        await db.transaction('rw', [db.patients, db.sessions, db.profile, db.media_metadata], async () => {
          await db.patients.clear(); 
          await db.sessions.clear(); 
          await db.profile.clear(); 
          await db.media_metadata.clear();
          if (data.patients) await db.patients.bulkAdd(data.patients);
          if (data.sessions) await db.sessions.bulkAdd(data.sessions);
          if (data.practitioner) await db.profile.bulkPut(data.practitioner);
          if (data.mediaMeta) await db.media_metadata.bulkAdd(data.mediaMeta);
        });
        alert("Données importées avec succès. L'application va redémarrer.");
        window.location.reload();
      } catch (err) { alert("Erreur import: " + (err as Error).message); } finally { setIsProcessing(false); }
    };
    reader.readAsText(file);
  };

  const usagePercent = storageUsage ? Math.round((storageUsage.used / storageUsage.total) * 100) : 0;

  if (isLocked && practitioner?.password) {
    return (
      <div style={themeStyles} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <LoginView practitioner={practitioner} onUnlock={() => setIsLocked(false)} />
      </div>
    );
  }

  return (
    <div style={themeStyles} className="mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <style>{`
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary-text); }
        .border-primary { border-color: var(--primary); }
        .bg-primary-soft { background-color: var(--primary-soft); }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .dark input::placeholder, .dark textarea::placeholder { color: #64748b; }
      `}</style>

      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {currentView !== 'DASHBOARD' && (
            <button onClick={() => navigateTo('DASHBOARD')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('DASHBOARD')}>
            <div className="w-9 h-9 bg-primary rounded-lg overflow-hidden flex items-center justify-center text-white">
              {practitioner?.photo ? <img src={practitioner.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">OstéoSuivi</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Stockage local</span>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-primary/80">
                  <HardDrive size={10} /> {usagePercent}%
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {currentView === 'DASHBOARD' && (
            <>
              <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} />
              {/* Icône Import : Flèche vers le bas (entre dans l'app) */}
              <button onClick={() => importFileRef.current?.click()} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Importer une sauvegarde">
                <Download size={18} />
              </button>
              
              <div className="relative">
                {/* Icône Export : Flèche vers le haut (sort de l'app) */}
                <button onClick={handleExportData} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Exporter une sauvegarde">
                  <Upload size={18} />
                </button>
                {isBackupDue && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />}
              </div>
              
              <button onClick={() => navigateTo('PRACTITIONER_PROFILE')} className="p-2 text-slate-400 hover:text-primary" title="Profil & Réglages">
                <Settings size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {currentView === 'DASHBOARD' && (
          <Dashboard 
            onSelectPatient={(id) => id === -1 ? navigateTo('ADD_PATIENT') : navigateTo('PATIENT_DETAIL', id)} 
            isBackupDue={isBackupDue} 
            onExportRequest={handleExportData} 
          />
        )}
        {currentView === 'ADD_PATIENT' && <PatientForm onCancel={() => navigateTo('DASHBOARD')} onSuccess={() => navigateTo('DASHBOARD')} />}
        {currentView === 'EDIT_PATIENT' && selectedPatientId && <PatientForm patientId={selectedPatientId} onCancel={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} onSuccess={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} />}
        {currentView === 'PATIENT_DETAIL' && selectedPatientId && <PatientDetail patientId={selectedPatientId} onEdit={() => navigateTo('EDIT_PATIENT', selectedPatientId)} onDelete={() => navigateTo('DASHBOARD')} />}
        {currentView === 'PRACTITIONER_PROFILE' && <PractitionerProfile onSuccess={() => { refreshPractitioner(); navigateTo('DASHBOARD'); }} onCancel={() => navigateTo('DASHBOARD')} />}
      </main>

      {currentView === 'DASHBOARD' && (
        <button onClick={() => navigateTo('ADD_PATIENT')} className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all sm:hidden">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default App;
