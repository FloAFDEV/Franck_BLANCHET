
import { db } from '../db';

const workerCode = `
self.onmessage = async (e) => {
  const { file, config } = e.data;

  try {
    // 1. Validation de l'entrée
    if (!file || !(file instanceof Blob)) {
      throw new Error("Le fichier est manquant ou n'est pas au bon format.");
    }

    if (!file.type.startsWith('image/')) {
      throw new Error("Le format du fichier (" + file.type + ") n'est pas supporté. Veuillez choisir une image.");
    }

    // 2. Création du Bitmap
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (err) {
      throw new Error("Impossible de décoder l'image. Le fichier est peut-être corrompu ou trop volumineux pour votre appareil.");
    }

    const { width, height } = bitmap;

    // 3. Fonction de traitement (Redimensionnement + Compression)
    const processImage = async (maxSize, quality) => {
      let targetWidth = width;
      let targetHeight = height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        targetWidth = Math.round(width * ratio);
        targetHeight = Math.round(height * ratio);
      }

      // Vérification du support OffscreenCanvas
      if (typeof OffscreenCanvas === 'undefined') {
        throw new Error("Votre navigateur est trop ancien pour traiter les images en arrière-plan.");
      }

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Erreur système : Échec de l'initialisation du processeur d'image.");
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      
      const blob = await canvas.convertToBlob({ 
        type: 'image/jpeg', 
        quality 
      });

      if (!blob) {
        throw new Error("La compression de l'image a échoué. Essayez avec un fichier plus petit.");
      }

      return blob;
    };

    // 4. Génération des versions HD et Miniature
    const hd = await processImage(config.maxHD, 0.85);
    const thumb = await processImage(config.maxThumb, 0.7);

    // Nettoyage mémoire immédiat
    bitmap.close();

    self.postMessage({
      success: true,
      hd,
      thumb,
      dimensions: { width, height }
    });

  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message || "Une erreur technique imprévue est survenue." 
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
      throw new Error("Le traitement d'image n'est pas disponible sur ce navigateur.");
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

        w.removeEventListener('message', handleMessage);

        if (!e.data.success) {
          reject(new Error(e.data.error));
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

          resolve(mediaId);
        } catch (err) {
          reject(new Error("Erreur d'écriture en base de données. L'espace de stockage est peut-être plein."));
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
