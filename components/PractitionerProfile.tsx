
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Practitioner } from '../types';
import { Camera, Upload, X, Save, Check, UserCircle, Palette, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface PractitionerProfileProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const THEME_COLORS = [
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Gris', value: '#475569' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#ec4899' }
];

const PractitionerProfile: React.FC<PractitionerProfileProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Practitioner>({
    id: 1,
    firstName: '',
    lastName: '',
    photo: '',
    themeColor: '#14b8a6',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.profile.get(1).then(p => {
      if (p) setFormData(p);
    });
  }, []);

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
        alert("Caméra indisponible");
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
      setFormData({ ...formData, photo: dataUrl });
      toggleCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.profile.put(formData);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="p-8 bg-primary text-white text-center">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Mon Profil</h2>
        <p className="text-white/70 text-xs font-bold uppercase tracking-tighter">Configuration de l'espace</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32 rounded-[2.5rem] border-4 border-primary-soft shadow-inner overflow-hidden flex items-center justify-center bg-slate-50">
            {formData.photo ? (
              <img src={formData.photo} alt="Ostéopathe" className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="text-slate-200" size={64} />
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
                  className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  <Camera size={20} className="text-slate-600" />
                </button>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"
                >
                  <Upload size={20} className="text-slate-600" />
                </button>
              </>
            ) : (
              <button 
                type="button" 
                onClick={capturePhoto}
                className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-primary-soft transition-all z-20"
              >
                <Check size={18} /> Capturer
              </button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Votre Nom</label>
              <input 
                required
                type="text"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none uppercase font-bold text-slate-800"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Votre Prénom</label>
              <input 
                required
                type="text"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none font-bold text-slate-800"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
              <Lock size={14} className="text-primary" /> Sécurité de l'accès (Optionnel)
            </label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Laisser vide pour désactiver le verrouillage"
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none font-bold text-slate-800"
                value={formData.password || ''}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="flex items-center gap-2 px-3 text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
              Si vous oubliez ce mot de passe, vous ne pourrez plus accéder à vos données locales.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
              <Palette size={14} className="text-primary" /> Couleur de l'interface
            </label>
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
              {THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({...formData, themeColor: color.value})}
                  className={`relative group w-10 h-10 rounded-xl transition-all ${formData.themeColor === color.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-110 opacity-60'}`}
                  style={{ backgroundColor: color.value }}
                >
                  {formData.themeColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <Check size={18} strokeWidth={4} />
                    </div>
                  )}
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 text-slate-400 font-black text-xs uppercase border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-[2] py-4 bg-primary text-white font-black text-xs uppercase rounded-2xl shadow-xl shadow-primary-soft hover:opacity-90 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Save size={18} />
            Enregistrer Profil
          </button>
        </div>
      </form>
    </div>
  );
};

export default PractitionerProfile;
