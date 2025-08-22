export type JournalEntry = {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
  photos?: string[];
  link?: string;
};

const STORAGE_KEY = 'journalEntries';
const BACKUP_KEY = 'journalEntries_backup';
const BACKUP_2_KEY = 'journalEntries_backup2';
const VERSION_KEY = 'journalStorage_version';
const CURRENT_VERSION = '2.1';

// Migration des jours 1 et 2 depuis le code vers le système unifié
const LEGACY_ENTRIES: JournalEntry[] = [
  { 
    day: 1, 
    date: "15 mars 2024",
    title: "Arrivée à Amman",
    location: "Amman, Jordanie",
    story: "Départ de Lyon le 30/07, direction Paris CDG en train. Le trajet en Ouigo s'est avéré décevant : inconfort, mal de dos… Heureusement, à l'aéroport CDG, les choses s'enchaînent facilement : pas de bagage à enregistrer, embarquement rapide. Les places en rang 11 offrent un bon confort pour les jambes, mais le dos continue de protester.\n\nÀ l'arrivée à l'aéroport Queen Alia d'Amman, un contact de l'agence nous prend en charge. Les formalités sont rapides. Achat de carte SIM, puis trajet de 45 minutes jusqu'à l'hôtel. La chaleur est bien là. Le chauffeur est bavard et parle un peu français. Une fois à l'hôtel : installation et dodo.",
    mood: "Enthousiaste"
  },
  {
    day: 2,
    date: "16 mars 2024", 
    title: "Jerash, Ajlun et spa à Amman",
    location: "Jerash, Ajlun, Amman",
    story: "Mal dormi, toujours ce mal de dos. Petit déjeuner très correct à l'hôtel, puis réception de la voiture de location. Grosse déception : au lieu du SUV attendu, on se retrouve avec une Nissan Kicks. « Yes, this is mini SUV sir ». Mouais… On compte faire une réclamation.\n\nDirection Jerash. Les ruines romaines sont splendides. Le site est immense, bien conservé. On y ressent l'empreinte d'un passé glorieux. Une balade impressionnante à travers les siècles.\n\nDéjeuner sur place : assiette mixte grill avec agneau, bœuf et poulet, hummus, taboulé. Tout est délicieux, les saveurs locales s'imposent dès ce premier vrai repas.\n\nDans un coin discret du restaurant, cette salle était réservée à la préparation des chichas. Alignées comme des soldats prêts à servir, elles attendaient les amateurs de fumée parfumée. Nous avons décliné l'invitation cette fois-ci. Peut-être une autre fois.\n\nL'après-midi, visite du château de Ajlun. Intéressant mais très fréquenté, un peu trop. Retour à Amman pour une séance spa à l'hôtel : hammam, sauna, gommage, massage… Une belle pause bien méritée.\n\nLe soir, dîner chez Ghaith, petit restaurant familial du quartier, à distance de marche. Très bon, ambiance simple et conviviale.",
    mood: "Mitigé",
    link: "https://maps.app.goo.gl/XHDM6vpRh1KCrQbB6"
  }
];

/**
 * Migration automatique - Ajoute les jours 1 et 2 s'ils n'existent pas déjà
 */
const runMigration = (): void => {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version === CURRENT_VERSION) {
      console.log('✅ Storage version up to date');
      return;
    }

    console.log('🔄 Running migration to version', CURRENT_VERSION);
    
    // Charger les entrées existantes
    const existingEntries = loadJournalEntriesRaw();
    const existingDays = new Set(existingEntries.map(e => e.day));
    
    // Ajouter les jours manquants depuis LEGACY_ENTRIES
    const entriesToAdd = LEGACY_ENTRIES.filter(entry => !existingDays.has(entry.day));
    
    if (entriesToAdd.length > 0) {
      const allEntries = [...existingEntries, ...entriesToAdd].sort((a, b) => a.day - b.day);
      const dataToSave = JSON.stringify(allEntries);
      localStorage.setItem(STORAGE_KEY, dataToSave);
      console.log(`✅ Migration complete: Added ${entriesToAdd.length} legacy entries`);
    } else {
      console.log('✅ Migration complete: No legacy entries to add');
    }
    
    // Marquer la migration comme terminée
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

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
          // Si c'est déjà une base64, la garder
          if (photo.startsWith('data:')) {
            return photo;
          }

          // Si c'est une URL normale (pas blob), la garder mais noter si elle est accessible
          if (!photo.startsWith('blob:')) {
            // Pour les URLs normales, on les garde mais on peut ajouter une validation plus tard
            return photo;
          }

          try {
            // Convertir blob en base64
            const response = await fetch(photo);
            const blob = await response.blob();
            
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const result = reader.result as string;
                console.log(`✅ Converted blob to base64 (${Math.round(result.length / 1024)}KB)`);
                resolve(result);
              };
              reader.onerror = () => {
                console.warn('⚠️ Failed to read blob:', photo);
                resolve(null);
              };
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            console.warn('⚠️ Failed to convert blob to base64:', photo, error);
            return null; // Supprimer les photos corrompues
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
    
    // Exécuter la migration si nécessaire
    runMigration();
    
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

    console.log('🎯 Final loaded entries:', validEntries.map(e => `Day ${e.day}: ${e.title}`));
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
          return parsed1;
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
          return parsed2;
        }
      } catch (e) {
        console.warn('⚠️ Backup 2 corrupted, using legacy entries...');
      }
    }
    
    // Dernier recours : utiliser les entrées par défaut (jours 1-2)
    console.log('📦 Using legacy entries as last resort');
    saveJournalEntries(LEGACY_ENTRIES);
    return LEGACY_ENTRIES;
    
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
  
  return await saveJournalEntries(updatedEntries);
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
    
    return await saveJournalEntries(updatedEntries);
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
    runMigration();
    return loadJournalEntries();
  },

  // Nettoyer et réinitialiser
  resetStorage: () => {
    [STORAGE_KEY, BACKUP_KEY, BACKUP_2_KEY, VERSION_KEY].forEach(key => {
      localStorage.removeItem(key);
    });
    runMigration();
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