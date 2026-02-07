
import { db } from '../db';

const workerCode = `
self.onmessage = async (e) => {
  const { file, config } = e.data;

  try {
    if (!file) throw new Error("Aucun fichier d'image n'a été fourni.");
    
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (err) {
      throw new Error("Le format de l'image n'est pas supporté ou le fichier est corrompu.");
    }

    const { width, height } = bitmap;

    const processImage = async (maxSize, quality) => {
      let targetWidth = width;
      let targetHeight = height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        targetWidth = Math.round(width * ratio);
        targetHeight = Math.round(height * ratio);
      }

      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(targetWidth, targetHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Erreur d'initialisation du moteur graphique local.");
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
        
        return await canvas.convertToBlob({ type: 'image/jpeg', quality });
      } else {
        throw new Error("Navigateur incompatible : 'OffscreenCanvas' manquant.");
      }
    };

    const hd = await processImage(config.maxHD, 0.85);
    const thumb = await processImage(config.maxThumb, 0.7);

    bitmap.close();
    self.postMessage({ success: true, hd, thumb, dimensions: { width, height } });

  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
`;

let workerInstance: Worker | null = null;

const getWorker = () => {
  if (!workerInstance) {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    workerInstance = new Worker(url);
  }
  return workerInstance;
};

export const processAndStoreImage = async (
  file: Blob, 
  patientId?: number, 
  sessionId?: number,
  name: string = "photo"
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const handleMessage = async (e: MessageEvent) => {
      if (e.data.success === undefined) return;
      w.removeEventListener('message', handleMessage);
      
      if (!e.data.success) { 
        reject(new Error(e.data.error)); 
        return; 
      }

      const { hd, thumb, dimensions } = e.data;
      try {
        // Use the transaction method inherited from the base Dexie class to ensure atomic persistence of metadata and blobs.
        const mediaId = await db.transaction('rw', [db.media_metadata, db.media_blobs, db.thumbnails], async () => {
          const id = await db.media_metadata.add({
            patientId, sessionId, name, mimeType: 'image/jpeg',
            width: dimensions.width, height: dimensions.height, version: 1, processedAt: Date.now()
          });
          await db.media_blobs.add({ mediaId: id, data: hd });
          await db.thumbnails.add({ mediaId: id, data: thumb });
          return id;
        });
        resolve(mediaId);
      } catch (err) { 
        reject(new Error("Erreur de stockage en base de données.")); 
      }
    };
    w.addEventListener('message', handleMessage);
    w.postMessage({ file, config: { maxHD: 1200, maxThumb: 250 } });
  });
};

export const getImageUrl = async (mediaId: number, type: 'hd' | 'thumb' = 'thumb'): Promise<string | null> => {
  const table = type === 'hd' ? db.media_blobs : db.thumbnails;
  const entry = await table.get(mediaId);
  return entry?.data ? URL.createObjectURL(entry.data) : null;
};

export const revokeUrl = (url: string | null) => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
};
