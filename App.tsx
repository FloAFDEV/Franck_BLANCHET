
import React, { useState, useEffect, useRef } from 'react';
import { db } from './db';
import { View, Practitioner } from './types';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import PatientDetail from './components/PatientDetail';
import PractitionerProfile from './components/PractitionerProfile';
import LoginView from './components/LoginView';
import { Plus, ChevronLeft, UserCircle, Settings, Download, Upload, HardDrive, Loader2, Bell, X, DownloadCloud, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number, total: number } | null>(null);
  const [isBackupDue, setIsBackupDue] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWA, setIsPWA] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Détection PWA
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsPWA(true);
    });

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWA(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const checkBackupStatus = async (p: Practitioner) => {
    const patientCount = await db.patients.count();
    const sessionCount = await db.sessions.count();
    const currentTotalRecords = patientCount + sessionCount;
    const lastDate = p.lastExportDate || 0;
    const lastCount = p.lastExportRecordCount || 0;
    
    const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
    const isDue = (Date.now() - lastDate > fortyEightHoursInMs) || (currentTotalRecords - lastCount >= 20);
    
    setIsBackupDue(isDue);
    if (isDue) {
      setShowNotification(true);
    }
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
    if (!confirm("Exporter toutes vos données ? Le fichier contiendra les dossiers patients, les séances et les photos.")) return;
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
        setShowNotification(false);
      }
    } catch (error) { alert("Erreur export: " + error); } finally { setIsProcessing(false); }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("ATTENTION : L'importation va supprimer TOUTES les données actuelles de l'application (Patients, Séances, Photos) pour les remplacer par celles du fichier. Continuer ?")) {
      e.target.value = '';
      return;
    }
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.app !== "OstéoSuivi") throw new Error("Le fichier n'est pas une sauvegarde valide d'OstéoSuivi.");
        
        await (db as any).transaction('rw', [db.patients, db.sessions, db.profile, db.media_metadata], async () => {
          await db.patients.clear(); 
          await db.sessions.clear(); 
          await db.profile.clear(); 
          await db.media_metadata.clear();
          if (data.patients) await db.patients.bulkAdd(data.patients);
          if (data.sessions) await db.sessions.bulkAdd(data.sessions);
          if (data.practitioner) await db.profile.bulkPut(data.practitioner);
          if (data.mediaMeta) await db.media_metadata.bulkAdd(data.mediaMeta);
        });
        alert("Import réussi. L'application va redémarrer.");
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
        <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center" aria-busy="true">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      {/* Notification de sauvegarde discrète */}
      {showNotification && isBackupDue && (
        <div className="fixed bottom-24 right-6 left-6 sm:left-auto sm:w-80 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-primary-soft rounded-lg text-primary">
              <Bell size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">Rappel de sauvegarde</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Pensez à exporter vos données. Dernière sauvegarde : {practitioner?.lastExportDate ? new Date(practitioner.lastExportDate).toLocaleDateString() : 'jamais'}.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={handleExportData} className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline">Exporter maintenant</button>
                <button onClick={() => setShowNotification(false)} className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Plus tard</button>
              </div>
            </div>
            <button onClick={() => setShowNotification(false)} className="text-slate-300 hover:text-slate-500" aria-label="Fermer la notification">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {currentView !== 'DASHBOARD' && (
            <button onClick={() => navigateTo('DASHBOARD')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500" aria-label="Retour au tableau de bord">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('DASHBOARD')} role="button" aria-label="Logo OstéoSuivi">
            <div className="w-9 h-9 bg-primary rounded-lg overflow-hidden flex items-center justify-center text-white">
              {practitioner?.photo ? <img src={practitioner.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-none">OstéoSuivi</span>
              <div className="flex items-center gap-2 mt-1">
                {!isPWA && deferredPrompt ? (
                  <button 
                    onClick={handleInstallClick}
                    className="flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors uppercase tracking-wider"
                  >
                    <DownloadCloud size={10} /> Installer l'App
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight flex items-center gap-1">
                      <ShieldCheck size={10} className="text-emerald-500" /> Données sécurisées
                    </span>
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-primary/80">
                      <HardDrive size={10} /> {usagePercent}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {currentView === 'DASHBOARD' && (
            <>
              <input type="file" ref={importFileRef} className="hidden" accept=".json" onChange={handleImportData} aria-hidden="true" />
              <button onClick={() => importFileRef.current?.click()} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Importer une sauvegarde" aria-label="Importer une sauvegarde">
                <Download size={18} />
              </button>
              <div className="relative">
                <button onClick={handleExportData} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Exporter une sauvegarde" aria-label="Exporter une sauvegarde">
                  <Upload size={18} />
                </button>
                {isBackupDue && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />}
              </div>
              <button onClick={() => navigateTo('PRACTITIONER_PROFILE')} className="p-2 text-slate-400 hover:text-primary transition-colors" title="Paramètres" aria-label="Accéder aux paramètres">
                <Settings size={18} />
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {currentView === 'DASHBOARD' && (
            <Dashboard 
              onSelectPatient={(id) => id === -1 ? navigateTo('ADD_PATIENT') : navigateTo('PATIENT_DETAIL', id)} 
              isBackupDue={isBackupDue}
              onExportRequest={handleExportData}
            />
          )}
          {currentView === 'ADD_PATIENT' && (
            <PatientForm onCancel={() => navigateTo('DASHBOARD')} onSuccess={() => navigateTo('DASHBOARD')} />
          )}
          {currentView === 'EDIT_PATIENT' && selectedPatientId && (
            <PatientForm patientId={selectedPatientId} onCancel={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} onSuccess={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} />
          )}
          {currentView === 'PATIENT_DETAIL' && selectedPatientId && (
            <PatientDetail 
              patientId={selectedPatientId} 
              onEdit={() => navigateTo('EDIT_PATIENT', selectedPatientId)} 
              onDelete={() => navigateTo('DASHBOARD')} 
            />
          )}
          {currentView === 'PRACTITIONER_PROFILE' && (
            <PractitionerProfile onSuccess={() => { refreshPractitioner(); navigateTo('DASHBOARD'); }} onCancel={() => navigateTo('DASHBOARD')} />
          )}
        </div>
      </main>

      {currentView === 'DASHBOARD' && (
        <button onClick={() => navigateTo('ADD_PATIENT')} className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all sm:hidden" aria-label="Ajouter un nouveau patient">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default App;
