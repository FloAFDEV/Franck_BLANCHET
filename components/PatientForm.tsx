
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db';
import { Patient, Gender, Laterality } from '../types';
import { Camera, Upload, X, Save, Loader2, User, Activity, HeartPulse, UserPlus, Phone, Mail, Briefcase, Users, Stethoscope, ClipboardList, Eye, History, Scissors, Bone, Ear, Pill, StickyNote } from 'lucide-react';
import { processAndStoreImage, getImageUrl, revokeUrl } from '../services/imageService';

interface PatientFormProps {
  patientId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 mb-6 mt-10 first:mt-0 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 pb-2">
    <Icon size={14} className="text-primary" aria-hidden="true" /> {title}
  </div>
);

const InputField = ({ label, value, onChange, type = "text", placeholder = "", required = false, id }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input 
      id={id}
      type={type} 
      required={required}
      placeholder={placeholder}
      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm font-medium transition-all" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
      aria-required={required}
    />
  </div>
);

const TextAreaField = ({ label, value, onChange, icon: Icon, iconColor = "text-primary/50", rows = 3, id }: any) => (
  <div className="space-y-1">
    <label htmlFor={id} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
      {Icon && <Icon size={12} className={iconColor} aria-hidden="true" />} {label}
    </label>
    <textarea 
      id={id}
      rows={rows} 
      className="w-full p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary text-sm font-medium transition-all" 
      value={value || ''} 
      onChange={e => onChange(e.target.value)} 
    />
  </div>
);

const PatientForm: React.FC<PatientFormProps> = ({ patientId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Patient>>({
    firstName: '', lastName: '', birthDate: '', gender: 'M', phone: '', email: '', address: '',
    familyStatus: 'Célibataire', hasChildren: '', profession: '', physicalActivity: '', 
    isSmoker: false, isFormerSmoker: false, smokerSince: '',
    contraception: '', currentTreatment: '', laterality: 'D', gpName: 'Dr. ', gpCity: '',
    antSurgical: '', antTraumaRhuma: '', antOphtalmo: '', antORL: '', antDigestive: '', antNotes: '', medicalHistory: ''
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

  const toggleCamera = useCallback(async () => {
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
  }, [isCameraOpen]);

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

  const capitalizeFirst = (str: string) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lastName || !formData.firstName || !formData.birthDate) {
      alert("Nom, Prénom et Date de naissance sont obligatoires.");
      return;
    }
    const data = { ...formData, photoId: photoId || undefined, createdAt: formData.createdAt || Date.now() } as Patient;
    try {
      if (patientId && patientId !== -1) await db.patients.update(patientId, data);
      else await db.patients.add(data);
      onSuccess();
    } catch (err) { alert("Erreur d'enregistrement."); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-w-4xl mx-auto" role="dialog" aria-labelledby="form-title">
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <h2 id="form-title" className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
          <UserPlus size={16} className="text-primary" /> 
          {patientId && patientId !== -1 ? 'Modifier le Dossier' : 'Nouveau Dossier Patient'}
        </h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-rose-500" aria-label="Fermer le formulaire"><X size={18} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-2">
        <SectionHeader icon={User} title="Identité & Photo" />
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className={`w-32 h-32 rounded-3xl border-2 ${formData.gender === 'F' ? 'border-pink-100' : 'border-blue-100'} dark:border-slate-800 bg-slate-50 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center text-slate-200 shadow-inner`} role="img" aria-label="Photo du patient">
              {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={40} />}
              {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />}
              {isProcessing && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center z-20" aria-busy="true"><Loader2 className="animate-spin text-primary" /></div>}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={toggleCamera} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm" aria-label="Ouvrir la caméra"><Camera size={16} /></button>
              {isCameraOpen && <button type="button" onClick={capturePhoto} className="px-3 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-tight">Capture</button>}
              <label className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-primary hover:bg-primary hover:text-white transition-all cursor-pointer shadow-sm" aria-label="Importer une photo">
                <Upload size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                  const f = e.target.files?.[0]; if (f) { setIsProcessing(true); try { const id = await processAndStoreImage(f); setPhotoId(id); } catch(e) { alert(e); } setIsProcessing(false); }
                }} />
              </label>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField id="lastName" label="Nom" required value={formData.lastName} onChange={(v:string) => setFormData({...formData, lastName: v.toUpperCase()})} />
            <InputField id="firstName" label="Prénom" required value={formData.firstName} onChange={(v:string) => setFormData({...formData, firstName: capitalizeFirst(v)})} />
            <InputField id="birthDate" label="Date de Naissance" required type="date" value={formData.birthDate} onChange={(v:string) => setFormData({...formData, birthDate: v})} />
            <div className="space-y-1">
              <label id="gender-label" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Genre</label>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl" role="radiogroup" aria-labelledby="gender-label">
                {(['M', 'F'] as const).map(g => (
                  <button key={g} type="button" role="radio" aria-checked={formData.gender === g} onClick={() => setFormData({...formData, gender: g})} className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${formData.gender === g ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400'}`}>
                    {g === 'M' ? 'HOMME' : 'FEMME'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <SectionHeader icon={Phone} title="Coordonnées & Social" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField id="phone" label="Téléphone Mobile" type="tel" value={formData.phone} onChange={(v:string) => setFormData({...formData, phone: v})} />
          <InputField id="email" label="Email" type="email" value={formData.email} onChange={(v:string) => setFormData({...formData, email: v})} />
          <InputField id="address" label="Adresse Postale" value={formData.address} onChange={(v:string) => setFormData({...formData, address: v})} />
          <InputField id="profession" label="Profession" value={formData.profession} onChange={(v:string) => setFormData({...formData, profession: v})} />
          <div className="space-y-1">
            <label htmlFor="familyStatus" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">État Civil</label>
            <select id="familyStatus" className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-primary font-medium appearance-none" value={formData.familyStatus} onChange={e => setFormData({...formData, familyStatus: e.target.value})}>
              <option value="Célibataire">Célibataire</option>
              <option value="Marié(e)">Marié(e) / Pacsé(e)</option>
              <option value="Divorcé(e)">Divorcé(e)</option>
              <option value="Veuf/Veuve">Veuf/Veuve</option>
            </select>
          </div>
          <InputField id="hasChildren" label="Enfants" value={formData.hasChildren} placeholder="ex: 2 enfants" onChange={(v:string) => setFormData({...formData, hasChildren: v})} />
        </div>

        <SectionHeader icon={Activity} title="Mode de vie" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InputField id="physicalActivity" label="Sport" value={formData.physicalActivity} onChange={(v:string) => setFormData({...formData, physicalActivity: v})} />
          <div className="space-y-1">
            <label id="laterality-label" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Latéralité</label>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl" role="radiogroup" aria-labelledby="laterality-label">
              {(['D', 'G'] as const).map(l => (
                <button key={l} type="button" role="radio" aria-checked={formData.laterality === l} onClick={() => setFormData({...formData, laterality: l})} className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${formData.laterality === l ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400'}`}>
                  {l === 'D' ? 'DROITIER' : 'GAUCHER'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label id="smoking-label" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">Tabac</label>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-2" role="radiogroup" aria-labelledby="smoking-label">
              <button 
                type="button" 
                role="radio"
                aria-checked={!formData.isSmoker && !formData.isFormerSmoker}
                onClick={() => setFormData({...formData, isSmoker: false, isFormerSmoker: false})} 
                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${!formData.isSmoker && !formData.isFormerSmoker ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400'}`}>
                NON
              </button>
              <button 
                type="button" 
                role="radio"
                aria-checked={formData.isSmoker}
                onClick={() => setFormData({...formData, isSmoker: true, isFormerSmoker: false})} 
                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${formData.isSmoker ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400'}`}>
                OUI
              </button>
              <button 
                type="button" 
                role="radio"
                aria-checked={formData.isFormerSmoker}
                onClick={() => setFormData({...formData, isSmoker: false, isFormerSmoker: true})} 
                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-lg transition-all ${formData.isFormerSmoker ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400'}`}>
                ANCIEN
              </button>
            </div>
            {(formData.isSmoker || formData.isFormerSmoker) && (
              <input 
                id="smokerSince"
                type="text" 
                placeholder="Depuis quand / Combien de temps ?" 
                className="w-full p-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-primary"
                value={formData.smokerSince || ''}
                onChange={e => setFormData({...formData, smokerSince: e.target.value})}
                aria-label="Détail durée tabagique"
              />
            )}
          </div>
        </div>

        <SectionHeader icon={Stethoscope} title="Suivi Médical" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField id="gpName" label="Médecin Traitant" value={formData.gpName} placeholder="ex: Dr. Martin" onChange={(v:string) => setFormData({...formData, gpName: v})} />
          <InputField id="gpCity" label="Ville Médecin" value={formData.gpCity} onChange={(v:string) => setFormData({...formData, gpCity: v})} />
          <div className="sm:col-span-2">
            <InputField id="currentTreatment" label="Traitements actuels" value={formData.currentTreatment} onChange={(v:string) => setFormData({...formData, currentTreatment: v})} />
          </div>
          {formData.gender === 'F' && (
            <div className="sm:col-span-2">
              <InputField id="contraception" label="Contraception" value={formData.contraception} onChange={(v:string) => setFormData({...formData, contraception: v})} />
            </div>
          )}
        </div>

        <SectionHeader icon={History} title="Antécédents" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextAreaField id="antSurgical" label="Chirurgicaux" icon={Scissors} iconColor="text-rose-500" value={formData.antSurgical} onChange={(v:string) => setFormData({...formData, antSurgical: v})} />
          <TextAreaField id="antTraumaRhuma" label="Traumato & Rhumato" icon={Bone} iconColor="text-blue-500" value={formData.antTraumaRhuma} onChange={(v:string) => setFormData({...formData, antTraumaRhuma: v})} />
          <TextAreaField id="antOphtalmo" label="Ophtalmo" icon={Eye} iconColor="text-cyan-500" value={formData.antOphtalmo} onChange={(v:string) => setFormData({...formData, antOphtalmo: v})} />
          <TextAreaField id="antORL" label="ORL" icon={Ear} iconColor="text-amber-500" value={formData.antORL} onChange={(v:string) => setFormData({...formData, antORL: v})} />
          <TextAreaField id="antDigestive" label="Digestifs" icon={Pill} iconColor="text-emerald-500" value={formData.antDigestive} onChange={(v:string) => setFormData({...formData, antDigestive: v})} />
          <TextAreaField id="antNotes" label="Notes liées à l'antécédent" icon={StickyNote} iconColor="text-slate-500" value={formData.antNotes} onChange={(v:string) => setFormData({...formData, antNotes: v})} />
          <div className="sm:col-span-2">
            <TextAreaField id="medicalHistory" label="Autres notes médicales" icon={ClipboardList} value={formData.medicalHistory} onChange={(v:string) => setFormData({...formData, medicalHistory: v})} />
          </div>
        </div>

        <div className="flex gap-4 pt-10 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-500 font-semibold text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all">Annuler</button>
          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-semibold text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2">
            <Save size={18} aria-hidden="true" /> Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
