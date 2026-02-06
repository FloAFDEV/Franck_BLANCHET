
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Patient, Gender, Laterality } from '../types';
import { Camera, Upload, X, Save, Loader2, User, Home, Activity, Stethoscope, HeartPulse } from 'lucide-react';
import { processAndStoreImage, getImageUrl, revokeUrl } from '../services/imageService';

interface PatientFormProps {
  patientId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

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
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play();
        }
      } catch (err) { 
        alert("Caméra inaccessible.");
        setIsCameraOpen(false); 
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...formData, photoId: photoId || undefined, createdAt: formData.createdAt || Date.now() } as Patient;
    if (patientId) await db.patients.update(patientId, data); else await db.patients.add(data);
    onSuccess();
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-3 py-4 border-b border-slate-100 dark:border-slate-800 mb-6">
      <div className="p-2 bg-primary-soft text-primary rounded-lg"><Icon size={18} /></div>
      <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{title}</h3>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h2 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">
          {patientId ? 'Mise à jour Dossier' : 'Nouveau Dossier Patient'}
        </h2>
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-12">
        {/* PHOTO & IDENTITÉ DE BASE */}
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex flex-col items-center shrink-0">
            <div className={`relative w-40 h-40 rounded-3xl border-[5px] ${formData.gender === 'F' ? 'border-pink-500' : 'border-blue-500'} overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-800 shadow-xl`}>
              {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : <User className="text-slate-200 dark:text-slate-800" size={48} />}
              {isCameraOpen && <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-10" />}
              {isProcessing && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={toggleCamera} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-primary shadow-sm hover:scale-110 transition-transform">
                {isCameraOpen ? <X size={20} /> : <Camera size={20} />}
              </button>
              {isCameraOpen ? (
                <button type="button" onClick={capturePhoto} className="px-6 bg-primary text-white rounded-xl font-black text-[10px] uppercase shadow-lg">Capturer</button>
              ) : (
                <label className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-primary shadow-sm hover:scale-110 transition-transform cursor-pointer">
                  <Upload size={20} />
                  <input type="file" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) { setIsProcessing(true); const id = await processAndStoreImage(f); setPhotoId(id); setIsProcessing(false); }
                  }} accept="image/*" />
                </label>
              )}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom</label>
              <input required type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-black text-sm uppercase focus:border-primary" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prénom</label>
              <input required type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-primary" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date de Naissance</label>
              <input required type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Genre</label>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                {(['M', 'F'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setFormData({...formData, gender: g})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.gender === g ? (g === 'M' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-pink-500 text-white shadow-lg shadow-pink-500/20') : 'text-slate-400'}`}>
                    {g === 'M' ? 'HOMME' : 'FEMME'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: CONTACT & VIE PRIVÉE */}
        <div>
          <SectionTitle icon={Home} title="Coordonnées & Vie Privée" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Téléphone</label>
              <input required type="tel" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
              <input type="email" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Adresse Complète</label>
              <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Situation Familiale</label>
              <input type="text" placeholder="Marié, Célibataire..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.familyStatus} onChange={e => setFormData({...formData, familyStatus: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Enfants</label>
              <input type="text" placeholder="Nb enfants, âges..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.hasChildren} onChange={e => setFormData({...formData, hasChildren: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Profession</label>
              <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SECTION 2: ACTIVITÉS & HABITUDES */}
        <div>
          <SectionTitle icon={Activity} title="Activités & Habitudes" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Activité Sportive</label>
              <input type="text" placeholder="Type, fréquence..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.physicalActivity} onChange={e => setFormData({...formData, physicalActivity: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fumeur</label>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                {[false, true].map(s => (
                  <button key={s.toString()} type="button" onClick={() => setFormData({...formData, isSmoker: s})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.isSmoker === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'}`}>
                    {s ? 'OUI' : 'NON'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Latéralité</label>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                {(['G', 'D'] as const).map(l => (
                  <button key={l} type="button" onClick={() => setFormData({...formData, laterality: l})} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all ${formData.laterality === l ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400'}`}>
                    {l === 'G' ? 'GAUCHER' : 'DROITIER'}
                  </button>
                ))}
              </div>
            </div>
            {formData.gender === 'F' && (
              <div className="space-y-1.5 lg:col-span-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Méthode de Contraception</label>
                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.contraception} onChange={e => setFormData({...formData, contraception: e.target.value})} />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: MÉDECINE GÉNÉRALE */}
        <div>
          <SectionTitle icon={Stethoscope} title="Suivi Médical" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Médecin Traitant (Nom)</label>
              <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.gpName} onChange={e => setFormData({...formData, gpName: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Commune d'exercice du médecin</label>
              <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.gpCity} onChange={e => setFormData({...formData, gpCity: e.target.value})} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Traitements en cours</label>
              <textarea rows={2} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-sm" value={formData.currentTreatment} onChange={e => setFormData({...formData, currentTreatment: e.target.value})} />
            </div>
          </div>
        </div>

        {/* SECTION 4: ANTÉCÉDENTS MÉDICAUX */}
        <div>
          <SectionTitle icon={HeartPulse} title="Antécédents Spécifiques" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Chirurgicaux', field: 'antSurgical' },
              { label: 'Traumatologiques & Rhumatologiques', field: 'antTraumaRhuma' },
              { label: 'Ophtalmologiques', field: 'antOphtalmo' },
              { label: 'ORL (Oreilles, Nez, Gorge)', field: 'antORL' },
              { label: 'Digestifs', field: 'antDigestive' }
            ].map((ant) => (
              <div key={ant.field} className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{ant.label}</label>
                <textarea rows={2} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-medium text-sm" value={(formData as any)[ant.field]} onChange={e => setFormData({...formData, [ant.field]: e.target.value})} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button type="button" onClick={onCancel} className="flex-1 py-5 text-slate-500 font-black text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-colors">Annuler</button>
          <button type="submit" className="flex-[2] py-5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3">
            <Save size={20} /> Enregistrer le dossier complet
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
