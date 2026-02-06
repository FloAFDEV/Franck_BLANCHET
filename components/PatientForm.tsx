
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
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: 'M',
    phone: '',
    email: '',
    profession: '',
    medicalHistory: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (patientId) {
      db.patients.get(patientId).then(p => {
        if (p) {
          setFormData(p);
          if (p.photo) setPhoto(p.photo);
        }
      });
    }
  }, [patientId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, phone: value });
  };

  const toggleCamera = async () => {
    if (isCameraOpen) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOpen(false);
    } else {
      setIsCameraOpen(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        alert("Impossible d'accéder à la caméra");
        setIsCameraOpen(false);
      }
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhoto(dataUrl);
      toggleCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientData = {
      ...formData,
      photo: photo || undefined,
      createdAt: formData.createdAt || Date.now(),
    } as Patient;

    if (patientId) {
      await db.patients.update(patientId, patientData);
    } else {
      await db.patients.add(patientData);
    }
    onSuccess();
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-8 bg-primary-soft border-b border-primary-soft/20">
        <h2 className="text-xl font-black text-primary uppercase tracking-widest">
          {patientId ? 'Mise à jour dossier' : 'Nouveau dossier patient'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className={`relative w-32 h-32 rounded-[2.5rem] border-4 overflow-hidden flex items-center justify-center bg-slate-50 transition-all ${
            formData.gender === 'M' ? 'border-blue-100 ring-4 ring-blue-50' : 'border-pink-100 ring-4 ring-pink-50'
          }`}>
            {photo ? (
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="text-slate-200" size={48} />
            )}
            {isCameraOpen && (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover z-10"
              />
            )}
          </div>
          
          <div className="flex gap-2">
            {!isCameraOpen ? (
              <>
                <button 
                  type="button" 
                  onClick={toggleCamera}
                  className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  <Camera size={20} className="text-slate-600" />
                </button>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
                >
                  <Upload size={20} className="text-slate-600" />
                </button>
                {photo && (
                  <button 
                    type="button" 
                    onClick={() => setPhoto(null)}
                    className="p-4 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors"
                  >
                    <X size={20} className="text-rose-600" />
                  </button>
                )}
              </>
            ) : (
              <button 
                type="button" 
                onClick={capturePhoto}
                className="px-8 py-3 bg-primary text-white rounded-2xl flex items-center gap-2 font-black text-xs uppercase shadow-lg shadow-primary-soft transition-all z-20"
              >
                <Check size={18} /> Capturer
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nom</label>
            <input 
              required
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none uppercase font-bold text-slate-800"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Prénom</label>
            <input 
              required
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none capitalize font-bold text-slate-800"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Date de Naissance</label>
            <input 
              required
              type="date"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none font-bold text-slate-800"
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Genre</label>
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
              {(['M', 'F'] as Gender[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({...formData, gender: g})}
                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
                    formData.gender === g 
                      ? (g === 'M' ? 'bg-blue-500 text-white shadow-lg shadow-blue-100' : 'bg-pink-500 text-white shadow-lg shadow-pink-100')
                      : 'text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {g === 'M' ? 'HOMME' : 'FEMME'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Téléphone</label>
            <input 
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none font-bold text-slate-800"
              placeholder="061234..."
              value={formData.phone}
              onChange={handlePhoneChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Profession</label>
            <input 
              type="text"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none font-bold text-slate-800"
              value={formData.profession}
              onChange={(e) => setFormData({...formData, profession: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Antécédents Médicaux</label>
          <textarea 
            rows={4}
            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-primary-soft focus:border-primary focus:bg-white focus:outline-none font-medium text-slate-700 leading-relaxed"
            value={formData.medicalHistory}
            onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-5 text-slate-400 font-black text-xs uppercase border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-[2] py-5 bg-primary text-white font-black text-xs uppercase rounded-2xl shadow-xl shadow-primary-soft hover:opacity-90 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Save size={20} />
            {patientId ? 'Mettre à jour le dossier' : 'Créer le dossier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
