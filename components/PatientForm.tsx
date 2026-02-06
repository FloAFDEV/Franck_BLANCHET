
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Patient, Gender } from '../types';
import { Camera, Upload, X, Save, Check } from 'lucide-react';

interface PatientFormProps {
  patientId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patientId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '', lastName: '', birthDate: '', gender: 'M', phone: '', email: '', profession: '', medicalHistory: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (patientId) {
      db.patients.get(patientId).then(p => { if (p) { setFormData(p); setPhoto(p.photo || null); } });
    }
  }, [patientId]);

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

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setPhoto(canvas.toDataURL('image/jpeg'));
      toggleCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, photo: photo || undefined, createdAt: formData.createdAt || Date.now() } as Patient;
    if (patientId) await db.patients.update(patientId, data); else await db.patients.add(data);
    onSuccess();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
      <div className="p-8 bg-primary-soft dark:bg-primary/10 border-b border-primary-soft/20">
        <h2 className="text-xl font-black text-primary uppercase tracking-widest">
          {patientId ? 'Mise à jour' : 'Nouveau dossier'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-[2.5rem] border-4 border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <Camera className="text-slate-200 dark:text-slate-700" size={48} />}
            {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />}
          </div>
          <div className="flex gap-2">
            {!isCameraOpen ? (
              <>
                <button type="button" onClick={toggleCamera} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300"><Camera size={20} /></button>
                <button type="button" onClick={() => setPhoto(null)} className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600 dark:text-rose-400"><X size={20} /></button>
              </>
            ) : <button type="button" onClick={capturePhoto} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase">OK</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nom</label>
            <input required type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold uppercase" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Prénom</label>
            <input required type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl outline-none font-bold capitalize" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Date de Naissance</label>
            <input required type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Genre</label>
            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {['M', 'F'].map(g => (
                <button key={g} type="button" onClick={() => setFormData({...formData, gender: g as Gender})} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${formData.gender === g ? (g === 'M' ? 'bg-blue-500 text-white' : 'bg-pink-500 text-white') : 'text-slate-400 dark:text-slate-500'}`}>
                  {g === 'M' ? 'HOMME' : 'FEMME'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="w-full py-5 bg-primary text-white font-black text-xs uppercase rounded-2xl shadow-xl active:scale-95 transition-all"><Save size={20} className="inline mr-2" /> Enregistrer le dossier</button>
      </form>
    </div>
  );
};

export default PatientForm;
