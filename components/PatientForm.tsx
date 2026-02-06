
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Patient, Gender, Laterality } from '../types';
import { Camera, Upload, X, Save, Loader2, User, Activity, HeartPulse, UserPlus, Home } from 'lucide-react';
import { processAndStoreImage, getImageUrl, revokeUrl } from '../services/imageService';

interface PatientFormProps {
  patientId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const getAge = (birthDate: string) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const PatientForm: React.FC<PatientFormProps> = ({ patientId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '', lastName: '', birthDate: '', gender: 'M', phone: '', email: '', address: '',
    familyStatus: '', hasChildren: '', profession: '', physicalActivity: '', isSmoker: false,
    contraception: '', currentTreatment: '', laterality: 'D', gpName: '', gpCity: '',
    antSurgical: '', antTraumaRhuma: '', antOphtalmo: '', antORL: '', antDigestive: '', medicalHistory: ''
  });
  
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (patientId && patientId !== -1) {
      db.patients.get(patientId).then(p => { 
        if (p) { setFormData(p); setPhotoId(p.photoId || null); } 
      });
    }
  }, [patientId]);

  useEffect(() => {
    let url: string | null = null;
    if (photoId) getImageUrl(photoId, 'thumb').then(u => { url = u; setPhotoUrl(u); });
    else setPhotoUrl(null);
    return () => { if (url) revokeUrl(url); };
  }, [photoId]);

  const toggleCamera = async () => {
    if (isCameraOpen) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      setIsCameraOpen(false);
    } else {
      setIsCameraOpen(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { alert("Accès caméra refusé."); setIsCameraOpen(false); }
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      setIsProcessing(true);
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; 
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) { const id = await processAndStoreImage(blob); setPhotoId(id); }
        setIsProcessing(false); toggleCamera();
      }, 'image/jpeg', 0.85);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lastName || !formData.firstName || !formData.birthDate) {
      alert("Champs obligatoires manquants.");
      return;
    }

    const data = { ...formData, photoId: photoId || undefined, createdAt: formData.createdAt || Date.now() } as Patient;

    try {
      if (patientId && patientId !== -1) await db.patients.update(patientId, data);
      else await db.patients.add(data);
      onSuccess();
    } catch (err) { alert("Erreur d'enregistrement."); }
  };

  const age = getAge(formData.birthDate || '');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <UserPlus size={16} className="text-primary" /> 
          {patientId && patientId !== -1 ? 'Dossier Patient' : 'Nouveau Dossier'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-rose-500"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className={`w-32 h-32 rounded-3xl border-2 ${formData.gender === 'F' ? 'border-pink-100' : 'border-blue-100'} dark:border-slate-800 bg-slate-50 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center text-slate-200 shadow-inner`}>
              {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={40} />}
              {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />}
              {isProcessing && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-20"><Loader2 className="animate-spin text-primary" /></div>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={toggleCamera} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm"><Camera size={16} /></button>
              {isCameraOpen && <button type="button" onClick={capturePhoto} className="px-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-tight">Capture</button>}
              <label className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm">
                <Upload size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                  const f = e.target.files?.[0]; if (f) { setIsProcessing(true); try { const id = await processAndStoreImage(f); setPhotoId(id); } catch(e) { alert(e); } setIsProcessing(false); }
                }} />
              </label>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Nom</label>
              <input required type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm font-medium uppercase" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value.toUpperCase()})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Prénom</label>
              <input required type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm font-medium" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Date de Naissance {age !== null && <span className="text-primary/70">({age} ans)</span>}</label>
              <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-primary font-medium" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Genre</label>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                {(['M', 'F'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setFormData({...formData, gender: g})} className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${formData.gender === g ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400'}`}>
                    {g === 'M' ? 'HOMME' : 'FEMME'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1"><Home size={14} /> Situation & Contact</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Mobile', key: 'phone', type: 'tel' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Profession', key: 'profession', type: 'text' }
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">{f.label}</label>
                <input type={f.type} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-primary font-medium" value={(formData as any)[f.key]} onChange={e => setFormData({...formData, [f.key]: e.target.value})} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-semibold text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all">Annuler</button>
          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2">
            <Save size={18} /> Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
