import { compressImageUrl } from '@/lib/imageCompression';
import type { PersistedJournalEntry } from '@/types/journal';
import { logger } from '@/lib/logger';

const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };
    reader.readAsDataURL(blob);
  });

const compressIfNeeded = async (base64: string): Promise<string> => {
  if (base64.length <= 500_000) {
    return base64;
  }

  try {
    return await compressImageUrl(base64, {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.7,
      format: 'jpeg',
    });
  } catch (error) {
    logger.warn('⚠️ Impossible de compresser le contenu base64 existant', error);
    return base64;
  }
};

const normalizePhoto = async (photo: string): Promise<string | null> => {
  if (photo.startsWith('blob:')) {
    try {
      const response = await fetch(photo);
      const blob = await response.blob();
      const base64 = await readBlobAsDataUrl(blob);
      return compressIfNeeded(base64);
    } catch (error) {
      logger.warn('⚠️ Conversion blob → base64 impossible', { photo, error });
      return null;
    }
  }

  if (photo.startsWith('data:')) {
    return compressIfNeeded(photo);
  }

  if (photo.startsWith('http')) {
    return photo;
  }

  logger.warn('⚠️ Format de photo inconnu', { photo });
  return null;
};

export const normalizePhotosForPersistence = async (
  entries: PersistedJournalEntry[],
): Promise<PersistedJournalEntry[]> => {
  const processedEntries = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.photos || entry.photos.length === 0) {
        return entry;
      }

      const processedPhotos = await Promise.all(entry.photos.map(normalizePhoto));
      const validPhotos = processedPhotos.filter((photo): photo is string => Boolean(photo));

      if (validPhotos.length !== entry.photos.length) {
        logger.warn('⚠️ Photos invalides supprimées lors de la normalisation', {
          day: entry.day,
          removed: entry.photos.length - validPhotos.length,
        });
      }

      return {
        ...entry,
        photos: validPhotos,
      };
    }),
  );

  return processedEntries;
};
