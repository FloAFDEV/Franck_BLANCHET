
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Camera, Upload, X, Save, Check, Loader2 } from 'lucide-react';
import { processAndStoreImage, getImageUrl, revokeUrl } from '../services/imageService';

interface PatientFormProps {
  patientId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patientId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '', lastName: '', birthDate: '', gender: 'M', phone: '', email: '', profession: '', medicalHistory: '',
  });
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (patientId) {
      db.patients.get(patientId).then(p => { 
        if (p) { 
          setFormData(p); 
          if (p.photoId) setPhotoId(p.photoId);
        } 
      });
    }
  }, [patientId]);

  useEffect(() => {
    let url: string | null = null;
    if (photoId) {
      getImageUrl(photoId, 'thumb').then(u => {
        url = u;
        setPhotoUrl(u);
      });
    } else {
      setPhotoUrl(null);
    }
    return () => { if (url) revokeUrl(url); };
  }, [photoId]);

  const toggleCamera = async () => {
    if (isCameraOpen) {
      (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
      setIsCameraOpen(false);
    } else {
      setIsCameraOpen(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { setIsCameraOpen(false); }
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
        if (blob) {
          const id = await processAndStoreImage(blob, undefined, undefined, 'photo_patient');
          setPhotoId(id);
        }
        setIsProcessing(false);
        toggleCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      try {
        const id = await processAndStoreImage(file, undefined, undefined, 'upload_patient');
        setPhotoId(id);
      } catch (err) { alert("Erreur traitement image"); }
      finally { setIsProcessing(false); }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, photoId: photoId || undefined, createdAt: formData.createdAt || Date.now() } as Patient;
    if (patientId) await db.patients.update(patientId, data); else await db.patients.add(data);
    onSuccess();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
          {patientId ? 'Mise à jour Dossier' : 'Nouveau Dossier Médical'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-lg border-2 border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <Camera className="text-slate-200" size={32} />}
            {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />}
            {isProcessing && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
          </div>
          <div className="flex gap-2">
            {!isCameraOpen ? (
              <>
                <button type="button" onClick={toggleCamera} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500"><Camera size={18} /></button>
                <label className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 cursor-pointer hover:bg-slate-50">
                  <Upload size={18} />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
                {photoId && <button type="button" onClick={() => setPhotoId(null)} className="p-2 border border-rose-100 text-rose-500 rounded-lg"><X size={18} /></button>}
              </>
            ) : <button type="button" onClick={capturePhoto} className="px-6 py-2 bg-primary text-white rounded-lg font-bold text-xs uppercase shadow-sm">Capturer</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom</label>
            <input required type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-sm uppercase" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prénom</label>
            <input required type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-bold text-sm capitalize" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date de Naissance</label>
            <input required type="date" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Genre</label>
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {['M', 'F'].map(g => (
                <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as Gender})} className={`flex-1 py-2 text-[10px] font-black rounded transition-all ${formData.gender === g ? (g === 'M' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white shadow-sm') : 'text-slate-400'}`}>
                  {g === 'M' ? 'HOMME' : 'FEMME'}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase border border-slate-200 dark:border-slate-800 rounded-lg">Annuler</button>
          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold text-xs uppercase rounded-lg shadow-sm hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Save size={18} /> Enregistrer le dossier</button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
