import { compressImageUrl } from '@/lib/imageCompression';
import type { PersistedJournalEntry } from '@/types/journal';

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
    console.warn('⚠️ Could not compress existing base64:', error);
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
      console.warn('⚠️ Failed to convert blob to base64:', photo, error);
      return null;
    }
  }

  if (photo.startsWith('data:')) {
    return compressIfNeeded(photo);
  }

  if (photo.startsWith('http')) {
    return photo;
  }

  console.warn('⚠️ Unknown photo format:', photo);
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
        console.warn(`⚠️ Removed ${entry.photos.length - validPhotos.length} invalid photos from day ${entry.day}`);
      }

      return {
        ...entry,
        photos: validPhotos,
      };
    }),
  );

  return processedEntries;
};
