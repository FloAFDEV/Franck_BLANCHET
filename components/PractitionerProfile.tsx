
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Practitioner } from '../types';
// Added 'Settings' to the lucide-react import list
import { Camera, Upload, Save, Check, UserCircle, Palette, Lock, Eye, EyeOff, Moon, Sun, Settings } from 'lucide-react';

interface PractitionerProfileProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const THEME_COLORS = [
  { name: 'Teal Médical', value: '#14b8a6' },
  { name: 'Amber Pro', value: '#d97706' },
  { name: 'Gris Neutre', value: '#475569' }
];

const PractitionerProfile: React.FC<PractitionerProfileProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Practitioner>({
    id: 1, firstName: '', lastName: '', photo: '', themeColor: '#14b8a6', password: '', isDarkMode: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.profile.get(1).then(p => { if (p) setFormData(p); });
  }, []);

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
    const video = videoRef.current;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setFormData({ ...formData, photo: canvas.toDataURL('image/jpeg') });
      toggleCamera();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.profile.put(formData);
    onSuccess();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-primary" size={20} /> Paramètres du Praticien
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-28 h-28 rounded-lg border-2 border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800">
            {formData.photo ? <img src={formData.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle className="text-slate-200 dark:text-slate-700" size={48} />}
            {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />}
          </div>
          <div className="flex gap-2">
            {!isCameraOpen ? (
              <>
                <button type="button" onClick={toggleCamera} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 transition-all"><Camera size={18} /></button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:bg-slate-50 transition-all"><Upload size={18} /></button>
              </>
            ) : (
              <button type="button" onClick={capturePhoto} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm transition-all z-20">Capturer</button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setFormData({...formData, photo: r.result as string}); r.readAsDataURL(f); } }} className="hidden" accept="image/*" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nom</label>
            <input required type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none font-bold text-sm" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Prénom</label>
            <input required type="text" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none font-bold text-sm" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Lock size={12} /> Sécurité Accès</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="Code secret optionnel" className="w-full p-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-primary outline-none text-sm" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Palette size={12} /> Préférences d'affichage</label>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {THEME_COLORS.map(color => (
                <button key={color.value} type="button" title={color.name} onClick={() => setFormData({...formData, themeColor: color.value})} className={`w-8 h-8 rounded border-2 transition-all ${formData.themeColor === color.value ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`} style={{ backgroundColor: color.value }}>
                  {formData.themeColor === color.value && <Check size={14} className="mx-auto text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setFormData({...formData, isDarkMode: !formData.isDarkMode})} className={`flex items-center gap-3 px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.isDarkMode ? 'bg-slate-800 border-primary text-primary shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {formData.isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
              {formData.isDarkMode ? 'Mode Sombre Activé' : 'Mode Clair Actif'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-bold text-xs uppercase border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 transition-colors">Fermer</button>
          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold text-xs uppercase rounded-lg shadow-sm hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Save size={16} /> Enregistrer Profil</button>
        </div>
      </form>
    </div>
  );
};

export default PractitionerProfile;
