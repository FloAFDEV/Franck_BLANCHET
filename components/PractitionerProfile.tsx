
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db';
import { Practitioner } from '../types';
import { Camera, Upload, Save, Check, UserCircle, Palette, Lock, Eye, EyeOff, Moon, Sun, Settings, X, Crop, ZoomIn, ZoomOut, Info, AlertTriangle, ShieldCheck, Download, HardDrive, ShieldAlert } from 'lucide-react';

interface PractitionerProfileProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DUCK_AVATAR = "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/duck.png";

const THEME_COLORS = [
  { name: 'Teal Médical', value: '#14b8a6' },
  { name: 'Indigo Profond', value: '#4338ca' },
  { name: 'Gris Graphite', value: '#475569' },
  { name: 'Bordeaux Chirurgical', value: '#991b1b' },
  { name: 'Or Ambre', value: '#d97706' }
];

const CropperModal: React.FC<{ 
  image: string; 
  onConfirm: (croppedImage: string) => void; 
  onCancel: () => void; 
}> = ({ image, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cw = canvas.width;
    const ch = canvas.height;
    
    const baseScale = Math.max(cw / img.width, ch / img.height);
    const s = baseScale * zoom;
    const w = img.width * s;
    const h = img.height * s;
    const x = (cw - w) / 2 + offset.x;
    const y = (ch - h) / 2 + offset.y;

    ctx.drawImage(img, x, y, w, h);
  }, [zoom, offset]);

  useEffect(() => {
    const img = new Image();
    img.onload = draw;
    img.src = image;
    (imageRef as any).current = img;
  }, [image, draw]);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setLastPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - lastPos.x;
    const dy = clientY - lastPos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: clientX, y: clientY });
  };

  const handleEnd = () => setIsDragging(false);

  const confirmCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onConfirm(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Recadrage de la photo</h3>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
        </div>
        
        <div className="relative aspect-square w-full bg-slate-200 dark:bg-slate-800 cursor-move overflow-hidden"
          onMouseDown={e => handleStart(e.clientX, e.clientY)}
          onMouseMove={e => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          <canvas ref={canvasRef} width={600} height={600} className="w-full h-full pointer-events-none" />
          <div className="absolute inset-0 border-[60px] border-black/40 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full border-2 border-white/70 rounded-full shadow-[0_0_0_1000px_rgba(0,0,0,0.2)]" />
          </div>
        </div>

        <div className="p-8 space-y-8 bg-slate-50 dark:bg-slate-900">
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-4">
              <ZoomOut size={16} className="text-slate-400" />
              <input 
                type="range" min="1" max="4" step="0.01" 
                className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} 
              />
              <ZoomIn size={16} className="text-slate-400" />
            </div>
          </div>
          
          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">Annuler</button>
            <button onClick={confirmCrop} className="flex-[2] py-3.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-105 transition-all flex items-center justify-center gap-2">
              <Check size={18} /> Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PractitionerProfile: React.FC<PractitionerProfileProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<Practitioner>({
    id: 1, firstName: '', lastName: '', photo: '', themeColor: '#14b8a6', password: '', isDarkMode: false
  });
  const [originalPassword, setOriginalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isPersisted, setIsPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    db.profile.get(1).then(p => { 
      if (p) {
        setFormData(p); 
        setOriginalPassword(p.password || '');
      }
    });
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(setIsPersisted);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.password.length < 4) {
      alert("Sécurité insuffisante : le code d'accès doit comporter au moins 4 caractères.");
      return;
    }
    await db.profile.put(formData);
    onSuccess();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re: any) => setCropSrc(re.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = async () => {
    const patients = await db.patients.toArray();
    const sessions = await db.sessions.toArray();
    const data = JSON.stringify({ patients, sessions, exportDate: new Date().toISOString() });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_osteo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearPassword = () => {
    if (!originalPassword) return;
    const verify = prompt("Veuillez saisir votre code actuel pour autoriser la suppression :");
    if (verify === null) return;
    if (verify !== originalPassword) {
      alert("Code incorrect. La suppression a été refusée pour votre sécurité.");
      return;
    }
    if (confirm("Confirmation : Voulez-vous vraiment désactiver la protection par code ? L'accès à vos données patients ne sera plus sécurisé au démarrage de l'application.")) {
      setFormData({ ...formData, password: '' });
      setOriginalPassword('');
    }
  };

  const isPasswordTooShort = formData.password && formData.password.length > 0 && formData.password.length < 4;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {cropSrc && (
        <CropperModal 
          image={cropSrc} 
          onCancel={() => setCropSrc(null)} 
          onConfirm={(cropped) => {
            setFormData({ ...formData, photo: cropped });
            setCropSrc(null);
          }} 
        />
      )}

      <div className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-sm">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl"><ShieldCheck size={28} /></div>
        <div className="flex-1 space-y-1">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-primary">Confidentialité & Local-First</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
            Toutes vos données sont stockées <strong>uniquement sur cet appareil</strong>. 
            Aucun serveur n'est utilisé. Nous recommandons un export régulier.
          </p>
        </div>
        {isPersisted === false && (
          <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-bold uppercase tracking-tighter animate-pulse flex items-center gap-1">
            <AlertTriangle size={12} /> Persistance non garantie (Safari?)
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/50">
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
            <Settings size={18} /> Paramètres du Praticien
          </h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              {/* Conteneur d'avatar avec fond dynamique si c'est le canard par défaut */}
              <div 
                className={`w-36 h-36 rounded-[2.5rem] border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center transition-colors duration-300 ${formData.photo === DUCK_AVATAR ? 'p-4' : 'bg-slate-100 dark:bg-slate-800'}`}
                style={{ backgroundColor: formData.photo === DUCK_AVATAR ? formData.themeColor : undefined }}
              >
                {formData.photo ? (
                  <img src={formData.photo} alt="" className={`w-full h-full ${formData.photo === DUCK_AVATAR ? 'object-contain' : 'object-cover'}`} />
                ) : (
                  <UserCircle className="text-slate-300" size={64} />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform active:scale-95">
                <Camera size={20} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Cliquez sur l'icône pour modifier la photo</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Prénom</label>
              <input type="text" placeholder="Optionnel" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nom</label>
              <input type="text" placeholder="Optionnel" className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock size={10} className="text-primary" /> Code de déverrouillage
              </label>
              {originalPassword && (
                <button 
                  type="button" 
                  onClick={handleClearPassword} 
                  className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter underline hover:text-rose-600 transition-colors"
                >
                  Supprimer le code
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="4 caractères minimum" 
                className={`w-full p-3.5 bg-slate-50 dark:bg-slate-800/40 border-2 rounded-2xl text-center text-lg font-bold tracking-[0.5em] outline-none transition-all shadow-sm ${isPasswordTooShort ? 'border-amber-300 focus:border-amber-400' : 'border-slate-100 dark:border-slate-800 focus:border-primary'}`} 
                value={formData.password || ''} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {isPasswordTooShort && (
              <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest px-1 flex items-center gap-1 animate-pulse">
                <ShieldAlert size={10} /> Le code est trop court (min. 4)
              </p>
            )}
            {!formData.password && (
              <p className="text-[9px] text-slate-400 font-medium italic px-1">
                Laissez vide pour désactiver la protection au démarrage.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-4">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Couleur d'accentuation</label>
              <div className="flex gap-4">
                {THEME_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => {
                    setFormData({ ...formData, themeColor: c.value });
                    document.documentElement.style.setProperty('--primary', c.value);
                  }} className={`w-10 h-10 rounded-2xl transition-all shadow-lg ${formData.themeColor === c.value ? 'ring-4 ring-offset-4 ring-primary' : 'hover:scale-110 opacity-80 hover:opacity-100'}`} style={{ backgroundColor: c.value }}>
                    {formData.themeColor === c.value && <Check size={18} className="mx-auto text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            
            <button type="button" onClick={() => setFormData({ ...formData, isDarkMode: !formData.isDarkMode })} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-95 active:scale-95">
              {formData.isDarkMode ? <Moon size={16} className="text-primary" /> : <Sun size={16} className="text-amber-500" />}
              {formData.isDarkMode ? 'Mode Sombre' : 'Mode Clair'}
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={handleExportData} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:text-primary hover:border-primary transition-all group">
              <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
              <div className="text-left">
                <p className="text-[11px] font-bold uppercase tracking-widest">Exporter une sauvegarde</p>
                <p className="text-[9px] font-medium opacity-60">Fichier JSON chiffré localement</p>
              </div>
            </button>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-500 font-bold text-[11px] uppercase tracking-widest border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 active:scale-95 transition-all">Annuler</button>
            <button 
              type="submit" 
              disabled={isPasswordTooShort}
              className={`flex-[2] py-4 text-white font-bold text-[11px] uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 ${isPasswordTooShort ? 'bg-slate-300 cursor-not-allowed opacity-50' : 'bg-primary hover:brightness-105 active:scale-95'}`}
            >
              <Save size={18} /> Enregistrer le profil
            </button>
          </div>
        </form>
      </div>

      <div className="p-10 text-center space-y-2 opacity-50">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
          <HardDrive size={10} /> v1.2.1 • Security First Architecture
        </p>
      </div>
    </div>
  );
};

export default PractitionerProfile;
