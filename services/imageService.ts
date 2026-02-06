
import { db } from '../db';

// Inline worker code as a string to avoid transpilation and path resolution issues in different environments.
// Browsers cannot natively execute .ts files, so loading a Worker from a .ts path often fails.
const workerCode = `
self.onmessage = async (e) => {
  const { file, config } = e.data;

  try {
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
      if (!ctx) throw new Error("Canvas context error");
      
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
    self.postMessage({ success: false, error: error.message || "Unknown worker error" });
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
      console.error("Failed to initialize ImageWorker", e);
      throw new Error("Impossible d'initialiser le processeur d'images.");
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
        if (e.data.success === undefined) return; // Ignore irrelevant messages

        if (!e.data.success) {
          w.removeEventListener('message', handleMessage);
          reject(new Error(e.data.error));
          return;
        }

        const { hd, thumb, dimensions } = e.data;

        try {
          // Transaction atomique sur le thread principal pour garantir l'intégrité des données
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
          reject(err);
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
    console.error("Failed to get image URL from DB", err);
    return null;
  }
};

export const revokeUrl = (url: string | null) => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore silently if revocation fails
    }
  }
};
