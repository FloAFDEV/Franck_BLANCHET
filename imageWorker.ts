
// Worker pour le traitement d'images médicales
self.onmessage = async (e: MessageEvent<{ 
  file: Blob, 
  config: { maxHD: number, maxThumb: number } 
}>) => {
  const { file, config } = e.data;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const processImage = async (maxSize: number, quality: number) => {
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
      
      // Amélioration de la qualité du redimensionnement
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

  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
