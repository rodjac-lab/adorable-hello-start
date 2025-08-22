/**
 * Utilitaires de compression d'images pour réduire la taille de stockage
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

/**
 * Compresse une image en redimensionnant et/ou en réduisant la qualité
 */
export const compressImage = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions en conservant le ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratioWidth = maxWidth / width;
        const ratioHeight = maxHeight / height;
        const ratio = Math.min(ratioWidth, ratioHeight);
        
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx?.drawImage(img, 0, 0, width, height);

      // Convertir en base64 avec compression
      const compressedDataUrl = canvas.toDataURL(`image/${format}`, quality);
      
      console.log(`🗜️ Image compressed: ${Math.round(file.size / 1024)}KB → ${Math.round(compressedDataUrl.length * 0.75 / 1024)}KB`);
      
      resolve(compressedDataUrl);
    };

    img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
    
    // Créer l'URL de l'image à partir du fichier
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
};

/**
 * Compresse une URL d'image existante (blob ou data URL)
 */
export const compressImageUrl = async (
  imageUrl: string,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.7,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratioWidth = maxWidth / width;
        const ratioHeight = maxHeight / height;
        const ratio = Math.min(ratioWidth, ratioHeight);
        
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner et compresser
      ctx?.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL(`image/${format}`, quality);
      
      console.log(`🗜️ URL compressed: ${Math.round(imageUrl.length * 0.75 / 1024)}KB → ${Math.round(compressedDataUrl.length * 0.75 / 1024)}KB`);
      
      resolve(compressedDataUrl);
    };

    img.onerror = () => reject(new Error('Impossible de charger l\'image'));
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
  });
};