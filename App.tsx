
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
      // Si pas de mot de passe, on déverrouille automatiquement
      if (!p.password) {
        setIsLocked(false);
      }
    } else {
      const defaultProfile = { id: 1, firstName: '', lastName: '', themeColor: '#14b8a6' };
      await db.profile.put(defaultProfile);
      setPractitioner(defaultProfile);
      setIsLocked(false);
    }
  };

  useEffect(() => {
    refreshPractitioner();
  }, []);

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
    if (confirm("ATTENTION : Cette action supprimera DÉFINITIVEMENT toutes les données (patients, séances et profil). Continuer ?")) {
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
      
      const dataToExport = {
        app: "OstéoSuivi",
        version: "1.3",
        exportDate: new Date().toISOString(),
        practitioner: profiles,
        patients: patients,
        sessions: sessions
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const nameTag = practitioner?.lastName ? practitioner.lastName.toUpperCase() : 'BACKUP';
      const dateTag = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.download = `osteo_backup_${nameTag}_${dateTag}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

    if (!confirm("L'importation remplacera TOUTES vos données (patients, séances ET profil). Voulez-vous continuer ?")) {
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!json.patients || !json.sessions || !json.practitioner) {
          throw new Error("Le fichier de sauvegarde semble incomplet ou incompatible.");
        }

        await db.transaction('rw', db.patients, db.sessions, db.profile, async () => {
          await db.patients.clear();
          await db.sessions.clear();
          await db.profile.clear();
          
          if (json.patients.length > 0) await db.patients.bulkAdd(json.patients);
          if (json.sessions.length > 0) await db.sessions.bulkAdd(json.sessions);
          if (json.practitioner.length > 0) await db.profile.bulkAdd(json.practitioner);
        });

        alert("Données et profil praticien restaurés avec succès !");
        window.location.reload();
      } catch (error) {
        alert("Échec de l'importation : " + (error as Error).message);
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Si l'app est verrouillée, on affiche uniquement la vue Login
  if (isLocked && practitioner?.password) {
    return (
      <div style={themeStyles} className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <style>{`
          .bg-primary { background-color: var(--primary); }
          .text-primary { color: var(--primary); }
          .shadow-primary-soft { --tw-shadow-color: var(--primary-soft); }
        `}</style>
        <LoginView 
          practitioner={practitioner} 
          onUnlock={() => setIsLocked(false)} 
        />
      </div>
    );
  }

  return (
    <div style={themeStyles} className={`max-w-4xl mx-auto min-h-screen flex flex-col bg-slate-50 font-sans ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}>
      <style>{`
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .ring-primary { --tw-ring-color: var(--primary); }
        .bg-primary-soft { background-color: var(--primary-soft); }
        .border-primary-soft { border-color: var(--primary-border); }
        .shadow-primary-soft { --tw-shadow-color: var(--primary-soft); }
      `}</style>

      <input 
        type="file" 
        ref={importFileRef} 
        onChange={handleImportData} 
        accept=".json" 
        className="hidden" 
      />

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          {currentView !== 'DASHBOARD' && (
            <button 
              onClick={() => navigateTo('DASHBOARD')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigateTo('DASHBOARD')}
          >
            <div className="w-10 h-10 bg-primary rounded-xl overflow-hidden flex items-center justify-center text-white shadow-primary-soft shadow-lg border border-primary-soft">
              {practitioner?.photo ? (
                <img src={practitioner.photo} alt="Moi" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={26} />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-800 leading-none">OstéoSuivi</span>
              {practitioner?.lastName && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-tighter truncate max-w-[100px]">
                  {practitioner.firstName ? practitioner.firstName[0] + '.' : ''} {practitioner.lastName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {currentView === 'DASHBOARD' && (
            <>
              <button
                onClick={() => importFileRef.current?.click()}
                className="p-2 text-slate-300 hover:text-amber-500 transition-colors"
                title="Importer une sauvegarde"
              >
                <Upload size={18} />
              </button>
              <button
                onClick={handleExportData}
                className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                title="Exporter tout le cabinet"
              >
                <Download size={18} />
              </button>
              <button
                onClick={handleResetExpress}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                title="Remise à zéro"
              >
                <RefreshCcw size={18} />
              </button>
              <button
                onClick={() => navigateTo('PRACTITIONER_PROFILE')}
                className="p-2 text-slate-400 hover:text-primary transition-colors mr-1"
                title="Paramètres Praticien"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => navigateTo('ADD_PATIENT')}
                className="bg-primary text-white p-2 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-soft hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={20} />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">Nouveau Patient</span>
              </button>
            </>
          )}
          {practitioner?.password && (
            <button 
              onClick={() => setIsLocked(true)}
              className="p-2 text-slate-300 hover:text-primary transition-colors"
              title="Verrouiller"
            >
              <Lock size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 pb-12">
        {currentView === 'DASHBOARD' && (
          <Dashboard onSelectPatient={(id) => navigateTo('PATIENT_DETAIL', id)} />
        )}
        
        {currentView === 'ADD_PATIENT' && (
          <PatientForm 
            onCancel={() => navigateTo('DASHBOARD')} 
            onSuccess={() => navigateTo('DASHBOARD')} 
          />
        )}

        {currentView === 'EDIT_PATIENT' && selectedPatientId && (
          <PatientForm 
            patientId={selectedPatientId}
            onCancel={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} 
            onSuccess={() => navigateTo('PATIENT_DETAIL', selectedPatientId)} 
          />
        )}

        {currentView === 'PATIENT_DETAIL' && selectedPatientId && (
          <PatientDetail 
            patientId={selectedPatientId} 
            onEdit={() => navigateTo('EDIT_PATIENT', selectedPatientId)}
            onDelete={() => navigateTo('DASHBOARD')}
          />
        )}

        {currentView === 'PRACTITIONER_PROFILE' && (
          <PractitionerProfile 
            onSuccess={() => navigateTo('DASHBOARD')}
            onCancel={() => navigateTo('DASHBOARD')}
          />
        )}
      </main>
      
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-[2px]">
          <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Traitement en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
