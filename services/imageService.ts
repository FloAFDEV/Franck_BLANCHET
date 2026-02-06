
import { db } from '../db';

const workerCode = `
self.onmessage = async (e) => {
  const { file, config } = e.data;

  try {
    if (!file.type.startsWith('image/')) {
      throw new Error("Le fichier n'est pas une image valide.");
    }

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const processImage = async (maxSize, quality) => {
      let targetWidth = width;
      let targetHeight = height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        targetWidth = Math.round(width * ratio);
        targetHeight = Math.round(height * ratio);
      }

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Impossible d'initialiser le processeur graphique.");
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      
      return await canvas.convertToBlob({ 
        type: 'image/jpeg', 
        quality 
      });
    };

    const hd = await processImage(config.maxHD, 0.85);
    const thumb = await processImage(config.maxThumb, 0.7);

    self.postMessage({
      success: true,
      hd,
      thumb,
      dimensions: { width, height }
    });

  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message || "Erreur inconnue lors du traitement de l'image." 
    });
  }
};
`;

let workerInstance: Worker | null = null;

const getWorker = () => {
  if (!workerInstance) {
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      workerInstance = new Worker(url);
    } catch (e) {
      throw new Error("Le processeur d'images ne peut pas démarrer sur cet appareil.");
    }
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
    try {
      const w = getWorker();
      
      const handleMessage = async (e: MessageEvent) => {
        if (e.data.success === undefined) return;

        if (!e.data.success) {
          w.removeEventListener('message', handleMessage);
          reject(new Error("Traitement échoué : " + e.data.error));
          return;
        }

        const { hd, thumb, dimensions } = e.data;

        try {
          const mediaId = await db.transaction('rw', [db.media_metadata, db.media_blobs, db.thumbnails], async () => {
            const id = await db.media_metadata.add({
              patientId,
              sessionId,
              name,
              mimeType: 'image/jpeg',
              width: dimensions.width,
              height: dimensions.height,
              version: 1,
              processedAt: Date.now()
            });

            await db.media_blobs.add({ mediaId: id, data: hd });
            await db.thumbnails.add({ mediaId: id, data: thumb });

            return id;
          });

          w.removeEventListener('message', handleMessage);
          resolve(mediaId);
        } catch (err) {
          w.removeEventListener('message', handleMessage);
          reject(new Error("Erreur lors de l'enregistrement en base locale."));
        }
      };

      w.addEventListener('message', handleMessage);
      w.postMessage({ 
        file, 
        config: { maxHD: 2000, maxThumb: 300 } 
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const getImageUrl = async (mediaId: number, type: 'hd' | 'thumb' = 'thumb'): Promise<string | null> => {
  try {
    const table = type === 'hd' ? db.media_blobs : db.thumbnails;
    const entry = await table.get(mediaId);
    if (!entry || !entry.data) return null;
    return URL.createObjectURL(entry.data);
  } catch (err) {
    return null;
  }
};

export const revokeUrl = (url: string | null) => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }
};
