
import React, { useState, useEffect, useRef } from 'react';
import { db } from './db';
import { View, Practitioner } from './types';
import Dashboard from './components/Dashboard';
import PatientForm from './components/PatientForm';
import PatientDetail from './components/PatientDetail';
import PractitionerProfile from './components/PractitionerProfile';
import { Plus, ChevronLeft, UserCircle, RefreshCcw, Settings, Download, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.profile.get(1).then(p => {
      if (p) {
        setPractitioner(p);
      } else {
        const defaultProfile = { id: 1, firstName: '', lastName: '', themeColor: '#14b8a6' };
        db.profile.put(defaultProfile);
        setPractitioner(defaultProfile);
      }
    });
  }, [currentView]);

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
    try {
      const patients = await db.patients.toArray();
      const sessions = await db.sessions.toArray();
      const profile = await db.profile.toArray();
      
      const dataToExport = {
        version: "1.0",
        practitioner: profile,
        patients: patients,
        sessions: sessions,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `osteo_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erreur lors de l'exportation des données.");
      console.error(error);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("Importer ces données écrasera votre base actuelle. Continuer ?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validation basique
        if (!json.patients || !json.sessions) {
          throw new Error("Format de fichier invalide");
        }

        // Nettoyage et Import
        await db.resetDatabase();
        if (json.patients.length > 0) await db.patients.bulkAdd(json.patients);
        if (json.sessions.length > 0) await db.sessions.bulkAdd(json.sessions);
        if (json.practitioner && json.practitioner.length > 0) {
          await db.profile.bulkPut(json.practitioner);
        }

        alert("Données importées avec succès !");
        window.location.reload();
      } catch (error) {
        alert("Erreur lors de l'importation : " + (error as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={themeStyles} className="max-w-4xl mx-auto min-h-screen flex flex-col bg-slate-50 font-sans">
      <style>{`
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .border-primary { border-color: var(--primary); }
        .ring-primary { --tw-ring-color: var(--primary); }
        .bg-primary-soft { background-color: var(--primary-soft); }
        .border-primary-soft { border-color: var(--primary-border); }
        .shadow-primary-soft { --tw-shadow-color: var(--primary-soft); }
      `}</style>

      {/* Hidden file input for import */}
      <input 
        type="file" 
        ref={importFileRef} 
        onChange={handleImportData} 
        accept=".json" 
        className="hidden" 
      />

      {/* Header */}
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
                  Dr. {practitioner.lastName}
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
                title="Importer des données (Restauration)"
              >
                <Upload size={18} />
              </button>
              <button
                onClick={handleExportData}
                className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                title="Exporter les données (Sauvegarde)"
              >
                <Download size={18} />
              </button>
              <button
                onClick={handleResetExpress}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                title="Réinitialiser l'application"
              >
                <RefreshCcw size={18} />
              </button>
              <button
                onClick={() => navigateTo('PRACTITIONER_PROFILE')}
                className="p-2 text-slate-400 hover:text-primary transition-colors mr-1"
                title="Mon Profil"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={() => navigateTo('ADD_PATIENT')}
                className="bg-primary text-white p-2 sm:px-4 sm:py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-primary-soft hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus size={20} />
                <span className="hidden sm:inline text-xs uppercase tracking-widest">Nouveau</span>
              </button>
            </>
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
    </div>
  );
};

export default App;
