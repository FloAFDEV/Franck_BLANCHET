
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Camera, Upload, X, Save, Loader2 } from 'lucide-react';
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
  const streamRef = useRef<MediaStream | null>(null);

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
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOpen(false);
    } else {
      setIsCameraOpen(true);
      try {
        // Résolution optimisée pour mobile : haute qualité sans surcharge.
        // On demande une résolution Full HD pour garantir une capture nette.
        const constraints = {
          video: {
            facingMode: 'environment', // Caméra arrière pour les photos patients
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error);
          };
        }
      } catch (err) { 
        console.error("Erreur caméra:", err);
        alert("Accès caméra refusé ou non disponible. Veuillez vérifier les autorisations de votre navigateur.");
        setIsCameraOpen(false); 
      }
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current) {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // Utilisation stricte des dimensions réelles du flux vidéo pour éviter toute distorsion
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width; 
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const id = await processAndStoreImage(blob, undefined, undefined, 'photo_patient');
            setPhotoId(id);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Échec du traitement de la photo.");
          }
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
      } catch (err) { 
        alert(err instanceof Error ? err.message : "Erreur de traitement."); 
      }
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
      <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">
          {patientId ? 'Mise à jour Dossier' : 'Nouveau Dossier Patient'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className={`relative w-32 h-32 rounded-2xl border-[3px] ${formData.gender === 'F' ? 'border-pink-500' : 'border-blue-500'} overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 shadow-inner`}>
            {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <Camera className="text-slate-100 dark:text-slate-800" size={32} />}
            {isCameraOpen && (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover z-10" 
              />
            )}
            {isProcessing && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
          </div>
          <div className="flex gap-3">
            {!isCameraOpen ? (
              <>
                <button type="button" onClick={toggleCamera} className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 dark:text-slate-600 hover:text-primary hover:border-primary/30 transition-all" title="Ouvrir la caméra">
                  <Camera size={18} />
                </button>
                <label className="p-2.5 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-300 dark:text-slate-600 cursor-pointer hover:text-primary hover:border-primary/30 transition-all" title="Téléverser une image">
                  <Upload size={18} />
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                </label>
                {photoId && (
                  <button type="button" onClick={() => setPhotoId(null)} className="p-2.5 border border-rose-50 dark:border-rose-900/20 text-rose-200 hover:text-rose-500 rounded-xl transition-all">
                    <X size={18} />
                  </button>
                )}
              </>
            ) : (
              <button type="button" onClick={capturePhoto} className="px-6 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase shadow-md active:scale-95 transition-all">
                Capturer
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom</label>
            <input required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-black text-sm uppercase focus:border-primary" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prénom</label>
            <input required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm capitalize focus:border-primary" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone</label>
            <input 
              required 
              type="tel" 
              inputMode="numeric"
              placeholder="06..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm focus:border-primary" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Genre</label>
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {['M', 'F'].map(g => (
                <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as Gender})} className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${formData.gender === g ? (g === 'M' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-pink-500 text-white shadow-md shadow-pink-500/20') : 'text-slate-400'}`}>
                  {g === 'M' ? 'HOMME' : 'FEMME'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date de Naissance</label>
            <input required type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
            <input type="email" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-sm focus:border-primary" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-black text-[11px] sm:text-xs uppercase border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors">Annuler</button>
          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-normal text-[11px] sm:text-xs uppercase rounded-xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Save size={16} strokeWidth={2.5} /> Enregistrer le dossier
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
