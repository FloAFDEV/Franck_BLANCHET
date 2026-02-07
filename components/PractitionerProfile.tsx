
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db';
import { Practitioner } from '../types';
import { Camera, Upload, Save, Check, UserCircle, Palette, Lock, Eye, EyeOff, Moon, Sun, Settings, X, Crop, ZoomIn, ZoomOut, Info, BookOpen, Shield, ChevronDown } from 'lucide-react';

interface PractitionerProfileProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const THEME_COLORS = [
  { name: 'Teal Médical', value: '#14b8a6' },
  { name: 'Orange Amber', value: '#f59e0b' },
  { name: 'Gris Professionnel', value: '#475569' }
];

const CollapsibleSection: React.FC<{ icon: any, title: string, children: React.ReactNode }> = ({ icon: Icon, title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className="text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">{title}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-5 bg-white dark:bg-slate-900/50 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 space-y-4">{children}</div>}
    </div>
  );
};

const CropperModal: React.FC<{ 
  image: string; 
  onConfirm: (croppedImage: string) => void; 
  onCancel: () => void; 
}> = ({ image, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div className="fixed inset-0 z-[60] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recadrer la photo</h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-rose-500"><X size={18} /></button>
        </div>
        <div className="relative aspect-square w-full bg-slate-200 dark:bg-slate-800 cursor-move overflow-hidden"
          ref={containerRef}
          onMouseDown={e => handleStart(e.clientX, e.clientY)}
          onMouseMove={e => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={e => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={e => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          <canvas ref={canvasRef} width={400} height={400} className="w-full h-full pointer-events-none" />
          <div className="absolute inset-0 border-[40px] border-black/30 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full border border-white/50 rounded-full" />
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <ZoomOut size={16} className="text-slate-400" />
            <input type="range" min="1" max="3" step="0.01" className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} />
            <ZoomIn size={16} className="text-slate-400" />
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onCancel} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl">Annuler</button>
            <button type="button" onClick={confirmCrop} className="flex-[2] py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2"><Check size={18} /> Valider</button>
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
  const [showPassword, setShowPassword] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  useEffect(() => {
    db.profile.get(1).then(p => { if (p) setFormData(p); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {cropSrc && <CropperModal image={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={(cropped) => { setFormData({ ...formData, photo: cropped }); setCropSrc(null); }} />}
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-3">
            <Settings className="text-primary" size={18} aria-hidden="true" /> Profil & Configuration
          </h2>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Fermer les paramètres"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="group relative w-28 h-28 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800" role="img" aria-label="Avatar du praticien">
              {formData.photo ? <img src={formData.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle className="text-slate-300" size={48} />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer text-white flex flex-col items-center gap-1">
                  <Camera size={20} />
                  <span className="text-[8px] font-bold uppercase">Éditer</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            </div>
            <button type="button" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline" onClick={() => {
              const f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
              f.onchange = handleFileChange;
              f.click();
            }} aria-label="Changer la photo de profil">Sélectionner une photo</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="p-lastName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom</label>
              <input id="p-lastName" type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary" value={formData.lastName || ''} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label htmlFor="p-firstName" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prénom</label>
              <input id="p-firstName" type="text" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-primary" value={formData.firstName || ''} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
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
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Couleur du cabinet</label>
              <div className="flex gap-3">
                {THEME_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => setFormData({ ...formData, themeColor: c.value })} className={`w-8 h-8 rounded-lg border-2 transition-all ${formData.themeColor === c.value ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c.value }}>
                    {formData.themeColor === c.value && <Check size={14} className="mx-auto text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setFormData({ ...formData, isDarkMode: !formData.isDarkMode })} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-slate-50 dark:hover:bg-slate-800">
              {formData.isDarkMode ? <Moon size={14} /> : <Sun size={14} />} {formData.isDarkMode ? 'Sombre' : 'Clair'}
            </button>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onCancel} className="flex-1 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-xl">Annuler</button>
            <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-lg hover:brightness-105 transition-all">Enregistrer</button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <CollapsibleSection icon={BookOpen} title="Aide à l'utilisation">
          <div className="space-y-4">
            <section>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Protection des données</h4>
              <p>OstéoSuivi fonctionne en circuit fermé. Vos données ne quittent jamais votre appareil. Elles sont stockées dans une base sécurisée (IndexedDB) au sein de votre navigateur.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Sauvegardes régulières</h4>
              <p>Il est impératif d'utiliser la fonction <strong>Exporter</strong> (icône nuage dans le tableau de bord) au moins une fois par semaine. Téléchargez le fichier .json et conservez-le sur une clé USB ou un disque dur externe.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Mode Hors-ligne & Installation</h4>
              <p>Pour une fiabilité maximale, installez l'application via le bouton dédié dans le header. Cela permettra d'utiliser OstéoSuivi même sans connexion internet.</p>
            </section>
            <section>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Photos patients</h4>
              <p>Vous pouvez capturer des photos directement via la caméra ou importer des clichés existants. Les photos sont optimisées automatiquement pour ne pas encombrer le stockage.</p>
            </section>
          </div>
        </CollapsibleSection>

        <CollapsibleSection icon={Shield} title="Conditions & Mentions Légales">
          <div className="space-y-4">
            <p><strong>Version :</strong> 3.5 "Pure Privacy Edition"</p>
            <p><strong>Usage :</strong> Cette application est un outil d'aide à la gestion de cabinet. Le praticien est seul responsable du respect du secret médical et de la protection des données de santé de ses patients.</p>
            <p><strong>Responsabilité :</strong> L'éditeur d'OstéoSuivi ne collecte AUCUNE donnée. Par conséquent, il décline toute responsabilité en cas de perte de données liée à une panne matérielle, un effacement du cache du navigateur ou une absence de sauvegarde manuelle par l'utilisateur.</p>
            <p><strong>RGPD :</strong> L'application est conforme par conception (Privacy by Design) car elle ne comporte aucun serveur tiers, aucun tracker et aucun transfert de données.</p>
          </div>
        </CollapsibleSection>
      </div>

      <div className="text-center">
        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em]">OstéoSuivi • Conçu pour la confidentialité</p>
      </div>
    </div>
  );
};

export default PractitionerProfile;
