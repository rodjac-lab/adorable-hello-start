import type { PersistedJournalEntry } from "@/types/journal";

export type JournalEntry = PersistedJournalEntry;
export type { PersistedJournalEntry };

const STORAGE_KEY = 'journalEntries';
const BACKUP_KEY = 'journalEntries_backup';
const BACKUP_2_KEY = 'journalEntries_backup2';
const VERSION_KEY = 'journalStorage_version';
const CURRENT_VERSION = '3.0';

import { compressImageUrl } from './imageCompression';
import {
  clearContentStoreState,
  initializeContentStore,
  markJournalDayAsCustom,
  registerImportedJournalEntries,
  syncJournalSources,
  getCanonicalJournalEntries,
} from './contentStore';

/**
 * Convertit blob URLs en base64 pour la persistance et nettoie les photos manquantes
 */
const convertBlobsToBase64 = async (entries: JournalEntry[]): Promise<JournalEntry[]> => {
  const processedEntries = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.photos || entry.photos.length === 0) {
        return entry;
      }

      const processedPhotos = await Promise.all(
        entry.photos.map(async (photo) => {
          // Convertir blob en base64 avec compression
          if (photo.startsWith('blob:')) {
            try {
              const response = await fetch(photo);
              const blob = await response.blob();
              
              return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = async () => {
                  try {
                    const originalBase64 = reader.result as string;
                    // Compresser l'image pour réduire la taille
                    const compressedBase64 = await compressImageUrl(originalBase64, {
                      maxWidth: 800,
                      maxHeight: 600,
                      quality: 0.7,
                      format: 'jpeg'
                    });
                    console.log(`✅ Converted blob to compressed base64 (${Math.round(compressedBase64.length * 0.75 / 1024)}KB)`);
                    resolve(compressedBase64);
                  } catch (compressionError) {
                    console.warn('⚠️ Compression failed, using original:', compressionError);
                    const base64 = reader.result as string;
                    console.log(`✅ Converted blob to base64 (${Math.round(base64.length * 0.75 / 1024)}KB)`);
                    resolve(base64);
                  }
                };
                reader.onerror = () => {
                  console.warn('⚠️ Failed to read blob:', photo);
                  resolve(null);
                };
                reader.readAsDataURL(blob);
              });
            } catch (error) {
              console.warn('⚠️ Failed to convert blob to base64:', photo, error);
              return null;
            }
          }
          // Compresser les base64 existants s'ils sont trop gros
          else if (photo.startsWith('data:')) {
            if (photo.length > 500000) { // Si > 500KB
              try {
                const compressedBase64 = await compressImageUrl(photo, {
                  maxWidth: 800,
                  maxHeight: 600,
                  quality: 0.7,
                  format: 'jpeg'
                });
                console.log(`✅ Compressed existing base64 (${Math.round(compressedBase64.length * 0.75 / 1024)}KB)`);
                return compressedBase64;
              } catch (error) {
                console.warn('⚠️ Could not compress existing base64:', error);
                return photo;
              }
            } else {
              return photo;
            }
          }
          // Garder les URLs normales
          else if (photo.startsWith('http')) {
            return photo;
          }
          else {
            console.warn('⚠️ Unknown photo format:', photo);
            return null;
          }
        })
      );

      // Filtrer les photos nulles (corrompues ou manquantes)
      const validPhotos = processedPhotos.filter(photo => photo !== null) as string[];
      
      if (validPhotos.length !== entry.photos.length) {
        console.warn(`⚠️ Removed ${entry.photos.length - validPhotos.length} invalid photos from day ${entry.day}`);
      }
      
      return {
        ...entry,
        photos: validPhotos
      };
    })
  );

  return processedEntries;
};

/**
 * Sauvegarde sécurisée avec triple backup et validation renforcée
 */
export const saveJournalEntries = async (entries: JournalEntry[]): Promise<boolean> => {
  try {
    console.log(`💾 Saving ${entries.length} entries...`);
    console.log('📝 Entries to save:', entries.map(e => `Day ${e.day}: ${e.title}`));
    
    // Validation des données avant sauvegarde
    if (!Array.isArray(entries)) {
      console.error('❌ Invalid entries format (not array)');
      return false;
    }

    // Validation détaillée de chaque entrée
    const validatedEntries = entries.filter(entry => {
      const isValid = entry && 
        typeof entry.day === 'number' && 
        typeof entry.title === 'string' && 
        typeof entry.date === 'string' &&
        typeof entry.location === 'string' &&
        typeof entry.story === 'string' &&
        typeof entry.mood === 'string';
      
      if (!isValid) {
        console.warn('⚠️ Skipping invalid entry:', entry);
      }
      return isValid;
    });

    if (validatedEntries.length === 0) {
      console.warn('⚠️ No valid entries to save');
      return false;
    }

    // Convertir les blob URLs en base64 pour la persistance
    const processedEntries = await convertBlobsToBase64(validatedEntries);
    console.log('🔄 Processed photos for persistence');

    // Trier par jour avant de sauvegarder
    processedEntries.sort((a, b) => a.day - b.day);

    const dataToSave = JSON.stringify(processedEntries);
    console.log(`📊 Data size: ${dataToSave.length} characters`);

    // Créer des backups avant de sauvegarder - TOUJOURS conserver les backups existants
    const currentData = localStorage.getItem(STORAGE_KEY);
    if (currentData && currentData !== dataToSave) {
      // Ne décaler les backups que si les données changent réellement
      const currentBackup1 = localStorage.getItem(BACKUP_KEY);
      if (currentBackup1) {
        localStorage.setItem(BACKUP_2_KEY, currentBackup1);
      }
      localStorage.setItem(BACKUP_KEY, currentData);
      console.log('💾 Created backups (data changed)');
    } else if (!currentData) {
      console.log('💾 No previous data, creating initial backup');
    } else {
      console.log('💾 Data unchanged, skipping backup rotation');
    }

    // Sauvegarder les nouvelles données
    localStorage.setItem(STORAGE_KEY, dataToSave);
    console.log('✅ Journal entries saved successfully');

    return true;
  } catch (error) {
    console.error('❌ Error saving journal entries:', error);
    return false;
  }
};

/**
 * Chargement brut sans migration (pour les opérations internes)
 */
const loadJournalEntriesRaw = (): JournalEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(entry => {
      return entry && 
        typeof entry.day === 'number' && 
        typeof entry.title === 'string' && 
        typeof entry.date === 'string';
    });
  } catch (error) {
    console.error('❌ Error loading raw entries:', error);
    return [];
  }
};

/**
 * Chargement sécurisé avec migration automatique et récupération
 */
export const loadJournalEntries = (): JournalEntry[] => {
  try {
    console.log('🔍 Loading journal entries...');

    // Initialiser le magasin de contenu (injection des entrées canons au besoin)
    initializeContentStore();
    
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('📖 Raw data from storage:', saved?.length ? `${saved.length} chars` : 'empty');

    if (!saved) {
      console.log('📭 No saved entries found after migration');
      return [];
    }

    const parsed = JSON.parse(saved);
    console.log('✅ Parsed entries:', parsed.length);

    // Validation des données chargées
    if (!Array.isArray(parsed)) {
      console.error('❌ Invalid data format in localStorage, attempting recovery');
      return recoverFromBackup();
    }

    // Validation de chaque entrée
    const validEntries = parsed.filter(entry => {
      const isValid = entry && 
        typeof entry.day === 'number' && 
        typeof entry.title === 'string' && 
        typeof entry.date === 'string';
      
      if (!isValid) {
        console.warn('⚠️ Invalid entry during load:', entry);
      }
      return isValid;
    });

    if (validEntries.length !== parsed.length) {
      console.warn(`⚠️ Found ${parsed.length - validEntries.length} corrupted entries, using valid ones only`);
      // Sauvegarder les entrées valides immédiatement
      saveJournalEntries(validEntries);
    }

    const entriesWithSource = syncJournalSources(validEntries);

    console.log('🎯 Final loaded entries:', entriesWithSource.map(e => `Day ${e.day}: ${e.title} (${e.source})`));
    return validEntries;
  } catch (error) {
    console.error('❌ Error loading journal entries:', error);
    return recoverFromBackup();
  }
};

/**
 * Récupération depuis les backups (triple fallback)
 */
export const recoverFromBackup = (): JournalEntry[] => {
  try {
    console.log('🔄 Attempting to recover from backups...');
    
    // Essayer backup 1
    const backup1 = localStorage.getItem(BACKUP_KEY);
    if (backup1) {
      try {
        const parsed1 = JSON.parse(backup1);
        if (Array.isArray(parsed1) && parsed1.length > 0) {
          console.log('✅ Successfully recovered from backup 1:', parsed1.length, 'entries');
          localStorage.setItem(STORAGE_KEY, backup1);
          const entries = parsed1 as JournalEntry[];
          syncJournalSources(entries);
          return entries;
        }
      } catch (e) {
        console.warn('⚠️ Backup 1 corrupted, trying backup 2...');
      }
    }
    
    // Essayer backup 2
    const backup2 = localStorage.getItem(BACKUP_2_KEY);
    if (backup2) {
      try {
        const parsed2 = JSON.parse(backup2);
        if (Array.isArray(parsed2) && parsed2.length > 0) {
          console.log('✅ Successfully recovered from backup 2:', parsed2.length, 'entries');
          localStorage.setItem(STORAGE_KEY, backup2);
          const entries = parsed2 as JournalEntry[];
          syncJournalSources(entries);
          return entries;
        }
      } catch (e) {
        console.warn('⚠️ Backup 2 corrupted, using legacy entries...');
      }
    }

    // Dernier recours : réinjecter les entrées canons
    console.log('📦 Using canonical entries as last resort');
    const canonical = getCanonicalJournalEntries().map(entry => {
      const { source: _source, ...rest } = entry;
      return rest;
    });
    void saveJournalEntries(canonical);
    syncJournalSources(canonical);
    return canonical;
    
  } catch (error) {
    console.error('❌ All recovery attempts failed:', error);
    return [];
  }
};

/**
 * Ajout sécurisé d'une nouvelle entrée
 */
export const addJournalEntry = async (newEntry: JournalEntry): Promise<boolean> => {
  console.log(`🆕 Adding entry for day ${newEntry.day}:`, newEntry.title);
  
  const currentEntries = loadJournalEntries();
  
  // Vérifier qu'il n'y a pas déjà une entrée pour ce jour
  const existingIndex = currentEntries.findIndex(entry => entry.day === newEntry.day);
  
  let updatedEntries: JournalEntry[];
  if (existingIndex >= 0) {
    // Remplacer l'entrée existante
    updatedEntries = [...currentEntries];
    updatedEntries[existingIndex] = newEntry;
    console.log(`📝 Replacing existing entry for day ${newEntry.day}`);
  } else {
    // Ajouter nouvelle entrée
    updatedEntries = [...currentEntries, newEntry];
    console.log(`🆕 Adding new entry for day ${newEntry.day}`);
  }

  // Trier par jour
  updatedEntries.sort((a, b) => a.day - b.day);
  
  const success = await saveJournalEntries(updatedEntries);

  if (success) {
    markJournalDayAsCustom(newEntry.day);
    syncJournalSources(updatedEntries);
  }

  return success;
};

/**
 * Mise à jour sécurisée d'une entrée existante
 */
export const updateJournalEntry = async (updatedEntry: JournalEntry): Promise<boolean> => {
  console.log(`✏️ Updating entry for day ${updatedEntry.day}:`, updatedEntry.title);
  
  const currentEntries = loadJournalEntries();
  console.log('📊 Current entries before update:', currentEntries.map(e => `Day ${e.day}: ${e.title}`));
  
  const existingIndex = currentEntries.findIndex(entry => entry.day === updatedEntry.day);
  console.log(`🔍 Looking for day ${updatedEntry.day}, found at index:`, existingIndex);
  
  if (existingIndex >= 0) {
    // Mettre à jour l'entrée existante
    const updatedEntries = [...currentEntries];
    updatedEntries[existingIndex] = updatedEntry;
    console.log('📝 Updated existing entry:', updatedEntry.title);
    
    // Trier par jour
    updatedEntries.sort((a, b) => a.day - b.day);
    
    const success = await saveJournalEntries(updatedEntries);

    if (success) {
      markJournalDayAsCustom(updatedEntry.day);
      syncJournalSources(updatedEntries);
    }

    return success;
  } else {
    // Créer nouvelle entrée si elle n'existe pas
    console.log('🆕 Entry not found, creating new one');
    return await addJournalEntry(updatedEntry);
  }
};

/**
 * Obtenir des statistiques sur les données
 */
export const getJournalStats = () => {
  const entries = loadJournalEntries();
  const days = entries.map(e => e.day).sort((a, b) => a - b);
  
  return {
    totalEntries: entries.length,
    minDay: days.length > 0 ? days[0] : 0,
    maxDay: days.length > 0 ? days[days.length - 1] : 0,
    days: days,
    storageVersion: localStorage.getItem(VERSION_KEY) || 'unknown',
    hasBackups: !!(localStorage.getItem(BACKUP_KEY) && localStorage.getItem(BACKUP_2_KEY))
  };
};

/**
 * Outils de diagnostic et maintenance
 */
export const diagnosticTools = {
  // Examiner le contenu brut du localStorage
  inspectStorage: () => {
    return {
      main: localStorage.getItem(STORAGE_KEY),
      backup1: localStorage.getItem(BACKUP_KEY),
      backup2: localStorage.getItem(BACKUP_2_KEY),
      version: localStorage.getItem(VERSION_KEY),
      sizes: {
        main: localStorage.getItem(STORAGE_KEY)?.length || 0,
        backup1: localStorage.getItem(BACKUP_KEY)?.length || 0,
        backup2: localStorage.getItem(BACKUP_2_KEY)?.length || 0,
      }
    };
  },

  // Forcer la migration
  forceMigration: () => {
    localStorage.removeItem(VERSION_KEY);
    initializeContentStore();
    const entries = loadJournalEntries();
    return entries;
  },

  // Nettoyer et réinitialiser
  resetStorage: () => {
    [STORAGE_KEY, BACKUP_KEY, BACKUP_2_KEY, VERSION_KEY].forEach(key => {
      localStorage.removeItem(key);
    });
    clearContentStoreState();
    initializeContentStore();
    return loadJournalEntries();
  },

  // Restaurer depuis les backups
  recoverFromBackup: () => {
    return recoverFromBackup();
  },

  // Exporter toutes les données
  exportAll: () => {
    const storage = diagnosticTools.inspectStorage();
    const entries = loadJournalEntries();
    const stats = getJournalStats();
    
    return {
      timestamp: new Date().toISOString(),
      entries,
      stats,
      storage,
      metadata: {
        version: CURRENT_VERSION,
        totalEntries: entries.length,
        entryDays: entries.map(e => e.day)
      }
    };
  },

  // Importer des données (avec validation)
  importData: async (data: { entries: JournalEntry[] }) => {
    try {
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid data format');
      }

      // Valider chaque entrée
      const validEntries = data.entries.filter(entry => {
        return entry && 
          typeof entry.day === 'number' && 
          typeof entry.title === 'string' && 
          typeof entry.date === 'string';
      });

      console.log(`📥 Importing ${validEntries.length} valid entries`);

      const success = await saveJournalEntries(validEntries);
      if (success) {
        console.log('✅ Import successful');
        registerImportedJournalEntries(validEntries);
        syncJournalSources(validEntries);
        return { success: true, imported: validEntries.length };
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('❌ Import failed:', error);
      return { success: false, error: error.message };
    }
  }
};