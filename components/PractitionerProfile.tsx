
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Practitioner } from '../types';
import { Camera, Upload, Save, Check, UserCircle, Palette, Lock, Eye, EyeOff, Moon, Sun, Settings, X } from 'lucide-react';

interface PractitionerProfileProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const THEME_COLORS = [
  { name: 'Teal Médical', value: '#14b8a6' },
  { name: 'Orange Amber', value: '#f59e0b' }, // Amber-500
  { name: 'Gris Professionnel', value: '#475569' }
];

const PractitionerProfile: React.FC<PractitionerProfileProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Practitioner>({
    id: 1, firstName: '', lastName: '', photo: '', themeColor: '#14b8a6', password: '', isDarkMode: false
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    db.profile.get(1).then(p => { if (p) setFormData(p); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.profile.put(formData);
    onSuccess();
  };

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200" role="dialog" aria-labelledby="profile-title">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
        <h2 id="profile-title" className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-3">
          <Settings className="text-primary" size={18} aria-hidden="true" /> Profil & Configuration
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Fermer les paramètres"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-28 h-28 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800" role="img" aria-label="Avatar du praticien">
            {formData.photo ? <img src={formData.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle className="text-slate-300" size={48} />}
          </div>
          <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline" onClick={() => {
            const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
            f.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                const r = new FileReader();
                r.onload = (re: any) => setFormData({ ...formData, photo: re.target.result });
                r.readAsDataURL(file);
              }
            }; f.click();
          }} aria-label="Modifier la photo de profil">Changer la photo</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="p-lastName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom</label>
            <input id="p-lastName" required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} aria-required="true" />
          </div>
          <div className="space-y-1">
            <label htmlFor="p-firstName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prénom</label>
            <input id="p-firstName" required type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} aria-required="true" />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="p-password" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mot de passe de verrouillage</label>
          <div className="relative">
            <input id="p-password" type={showPassword ? 'text' : 'password'} placeholder="Optionnel" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold tracking-widest outline-none focus:border-primary" value={formData.password || ''} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </div>

        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <label id="theme-label" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Couleur du cabinet</label>
            <div className="flex gap-3" role="radiogroup" aria-labelledby="theme-label">
              {THEME_COLORS.map(c => (
                <button key={c.value} type="button" role="radio" aria-checked={formData.themeColor === c.value} aria-label={`Couleur ${c.name}`} onClick={() => setFormData({ ...formData, themeColor: c.value })} className={`w-8 h-8 rounded-lg border-2 transition-all ${formData.themeColor === c.value ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c.value }}>
                  {formData.themeColor === c.value && <Check size={14} className="mx-auto text-white" strokeWidth={3} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setFormData({ ...formData, isDarkMode: !formData.isDarkMode })} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-slate-50 dark:hover:bg-slate-800" aria-pressed={formData.isDarkMode}>
            {formData.isDarkMode ? <Moon size={14} aria-hidden="true" /> : <Sun size={14} aria-hidden="true" />} {formData.isDarkMode ? 'Mode Sombre' : 'Mode Clair'}
          </button>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-xl">Annuler</button>
          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:brightness-105 transition-all">Enregistrer</button>
        </div>
      </form>
    </div>
  );
};

export default PractitionerProfile;
