
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Practitioner } from '../types';
import { Camera, Upload, Save, Check, UserCircle, Palette, Lock, Eye, EyeOff, Moon, Sun, Settings, X, Move, ZoomIn } from 'lucide-react';

interface PractitionerProfileProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const THEME_COLORS = [
  { name: 'Teal Médical', value: '#14b8a6' },
  { name: 'Amber Pro', value: '#d97706' },
  { name: 'Gris Neutre', value: '#475569' }
];

// Composant interne pour le recadrage
const ImageCropper: React.FC<{
  imageSrc: string;
  onConfirm: (croppedBase64: string) => void;
  onCancel: () => void;
}> = ({ imageSrc, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    const size = 400; // Taille finale de la photo de profil
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx && imgRef.current) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);

      // Calcul du ratio et du placement
      const img = imgRef.current;
      const displaySize = 280; // La taille du cadre de prévisualisation dans le CSS
      const scale = (img.naturalWidth / img.width) * zoom;
      
      // On calcule le décalage réel par rapport au centre du cadre
      const centerX = position.x + (img.width * zoom) / 2;
      const centerY = position.y + (img.height * zoom) / 2;
      
      const dx = (size / 2) - ( (displaySize/2 - position.x) * (size/displaySize) );
      const dy = (size / 2) - ( (displaySize/2 - position.y) * (size/displaySize) );

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.scale(zoom, zoom);
      
      // Ajustement pour dessiner l'image centrée sur le point choisi
      const renderW = (img.naturalWidth * (size / img.naturalWidth));
      const renderH = (img.naturalHeight * (size / img.naturalWidth));
      
      // Simplification : On dessine l'image avec les coordonnées de position transformées
      const ratio = size / displaySize;
      ctx.drawImage(
        img, 
        (position.x - displaySize/2) * ratio, 
        (position.y - displaySize/2) * ratio, 
        img.width * ratio, 
        img.height * ratio
      );
      ctx.restore();

      onConfirm(canvas.toDataURL('image/jpeg', 0.9));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Recadrage Photo</h3>
          <button onClick={onCancel} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-8 flex flex-col items-center gap-8">
          {/* Cadre de recadrage fixe */}
          <div 
            ref={containerRef}
            className="relative w-72 h-72 rounded-3xl bg-slate-100 dark:bg-slate-950 border-4 border-primary/20 overflow-hidden cursor-move touch-none shadow-inner"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="" 
              draggable={false}
              className="absolute max-w-none transition-transform duration-75 ease-out"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transformOrigin: 'center'
              }}
              onLoad={(e) => {
                const img = e.currentTarget;
                // Centrage initial
                setPosition({ x: (288 - img.width) / 2, y: (288 - img.height) / 2 });
              }}
            />
            {/* Guide visuel */}
            <div className="absolute inset-0 border-[40px] border-slate-950/40 pointer-events-none"></div>
            <div className="absolute inset-0 border border-white/30 pointer-events-none"></div>
          </div>

          <div className="w-full space-y-4">
            <div className="flex items-center gap-4 text-slate-400">
              <ZoomIn size={16} />
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.01" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-primary h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-black w-8">{Math.round(zoom * 100)}%</span>
            </div>
            
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <Move size={12} /> Faites glisser pour ajuster
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button onClick={onCancel} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-all">Annuler</button>
            <button onClick={handleConfirm} className="flex-[2] py-4 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">Valider la zone</button>
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 800, height: 800 } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { 
        alert("Caméra indisponible.");
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
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      setImageToCrop(canvas.toDataURL('image/jpeg'));
      toggleCamera();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; 
    if (f) { 
      const r = new FileReader(); 
      r.onloadend = () => setImageToCrop(r.result as string); 
      r.readAsDataURL(f); 
    }
  };

  const handleCropConfirm = (croppedBase64: string) => {
    setFormData({ ...formData, photo: croppedBase64 });
    setImageToCrop(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.profile.put(formData);
    onSuccess();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
      {imageToCrop && (
        <ImageCropper 
          imageSrc={imageToCrop} 
          onCancel={() => setImageToCrop(null)} 
          onConfirm={handleCropConfirm} 
        />
      )}

      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
        <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em] flex items-center gap-3">
          <Settings className="text-primary" size={20} /> Profil Praticien
        </h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-10">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] border-[5px] border-white dark:border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition-transform group-hover:scale-105 duration-300">
              {formData.photo ? <img src={formData.photo} alt="" className="w-full h-full object-cover" /> : <UserCircle className="text-slate-200 dark:text-slate-800" size={64} />}
              {isCameraOpen && <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />}
            </div>
            {!isCameraOpen && (
               <div className="absolute -bottom-2 -right-2 flex gap-1">
                 <button type="button" onClick={toggleCamera} className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:brightness-110 active:scale-90 transition-all border-4 border-white dark:border-slate-900"><Camera size={18} /></button>
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-white dark:bg-slate-800 text-slate-500 rounded-2xl shadow-lg hover:bg-slate-50 active:scale-90 transition-all border-4 border-white dark:border-slate-900"><Upload size={18} /></button>
               </div>
            )}
            {isCameraOpen && (
              <button type="button" onClick={capturePhoto} className="absolute inset-x-0 -bottom-4 bg-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl z-20">Capturer</button>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom de famille</label>
            <input required type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-black text-sm uppercase focus:border-primary transition-all" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Prénom</label>
            <input required type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none font-bold text-sm focus:border-primary transition-all" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Lock size={12} /> Mot de passe de verrouillage</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="Laissez vide pour désactiver le verrouillage" className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl outline-none text-sm font-bold tracking-widest focus:border-primary transition-all" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-primary transition-colors">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2"><Palette size={12} /> Couleur d'accentuation</label>
              <div className="flex gap-3">
                {THEME_COLORS.map(color => (
                  <button key={color.value} type="button" title={color.name} onClick={() => setFormData({...formData, themeColor: color.value})} className={`w-10 h-10 rounded-xl border-4 transition-all ${formData.themeColor === color.value ? 'border-slate-900 dark:border-white scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`} style={{ backgroundColor: color.value }}>
                    {formData.themeColor === color.value && <Check size={18} className="mx-auto text-white" strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Apparence</label>
              <button type="button" onClick={() => setFormData({...formData, isDarkMode: !formData.isDarkMode})} className={`flex items-center gap-4 px-5 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.isDarkMode ? 'bg-slate-800 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                {formData.isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
                {formData.isDarkMode ? 'Mode Sombre' : 'Mode Clair'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-400 font-black text-[11px] uppercase tracking-widest border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 transition-colors">Fermer</button>
          <button type="submit" className="flex-[2] py-4 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3"><Save size={18} /> Mettre à jour le profil</button>
        </div>
      </form>
    </div>
  );
};

export default PractitionerProfile;
