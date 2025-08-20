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

/**
 * Sauvegarde sécurisée avec backup automatique
 */
export const saveJournalEntries = (entries: JournalEntry[]): boolean => {
  try {
    // Validation des données
    if (!Array.isArray(entries)) {
      console.error('❌ Invalid data type for entries:', typeof entries);
      return false;
    }

    // Validation de chaque entrée
    const validEntries = entries.filter(entry => {
      const isValid = entry && 
        typeof entry.day === 'number' && 
        typeof entry.title === 'string' && 
        typeof entry.date === 'string';
      
      if (!isValid) {
        console.warn('⚠️ Invalid entry found:', entry);
      }
      return isValid;
    });

    if (validEntries.length !== entries.length) {
      console.warn(`⚠️ Filtered ${entries.length - validEntries.length} invalid entries`);
    }

    // Backup des données actuelles avant modification
    const current = localStorage.getItem(STORAGE_KEY);
    if (current) {
      localStorage.setItem(BACKUP_KEY, current);
      console.log('💾 Created backup of current data');
    }

    // Sauvegarde des nouvelles données
    const dataToSave = JSON.stringify(validEntries);
    localStorage.setItem(STORAGE_KEY, dataToSave);
    
    // Vérification de la sauvegarde
    const verification = localStorage.getItem(STORAGE_KEY);
    const success = verification === dataToSave;
    
    if (success) {
      console.log('✅ Successfully saved entries:', validEntries);
    } else {
      console.error('❌ Save verification failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error saving journal entries:', error);
    return false;
  }
};

/**
 * Chargement sécurisé avec récupération automatique
 */
export const loadJournalEntries = (): JournalEntry[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('🔍 Loading from localStorage:', saved);

    if (!saved) {
      console.log('📭 No saved entries found');
      return [];
    }

    const parsed = JSON.parse(saved);
    console.log('✅ Parsed entries:', parsed);

    // Validation des données chargées
    if (!Array.isArray(parsed)) {
      console.error('❌ Invalid data format in localStorage, attempting recovery');
      return recoverFromBackup();
    }

    // Validation de chaque entrée
    const validEntries = parsed.filter(entry => {
      return entry && 
        typeof entry.day === 'number' && 
        typeof entry.title === 'string' && 
        typeof entry.date === 'string';
    });

    if (validEntries.length !== parsed.length) {
      console.warn(`⚠️ Found ${parsed.length - validEntries.length} corrupted entries, using valid ones only`);
    }

    return validEntries;
  } catch (error) {
    console.error('❌ Error loading journal entries:', error);
    return recoverFromBackup();
  }
};

/**
 * Récupération depuis le backup
 */
export const recoverFromBackup = (): JournalEntry[] => {
  try {
    console.log('🔄 Attempting to recover from backup...');
    const backup = localStorage.getItem(BACKUP_KEY);
    
    if (!backup) {
      console.log('📭 No backup found');
      return [];
    }

    const parsed = JSON.parse(backup);
    if (Array.isArray(parsed)) {
      console.log('✅ Successfully recovered from backup:', parsed);
      // Restaurer le backup comme données principales
      localStorage.setItem(STORAGE_KEY, backup);
      return parsed;
    }
    
    console.error('❌ Backup data is corrupted');
    return [];
  } catch (error) {
    console.error('❌ Error recovering from backup:', error);
    return [];
  }
};

/**
 * Ajout sécurisé d'une nouvelle entrée
 */
export const addJournalEntry = (newEntry: JournalEntry): boolean => {
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

  return saveJournalEntries(updatedEntries);
};

/**
 * Mise à jour sécurisée d'une entrée existante
 */
export const updateJournalEntry = (updatedEntry: JournalEntry): boolean => {
  const currentEntries = loadJournalEntries();
  console.log('📊 Current entries before update:', currentEntries);
  
  const existingIndex = currentEntries.findIndex(entry => entry.day === updatedEntry.day);
  console.log(`🔍 Looking for day ${updatedEntry.day}, found at index:`, existingIndex);
  
  if (existingIndex >= 0) {
    // Mettre à jour l'entrée existante
    const updatedEntries = [...currentEntries];
    updatedEntries[existingIndex] = updatedEntry;
    console.log('📝 Updated existing entry:', updatedEntry);
    console.log('📦 Final entries array:', updatedEntries);
    return saveJournalEntries(updatedEntries);
  } else {
    // Créer nouvelle entrée si elle n'existe pas
    console.log('🆕 Entry not found, creating new one');
    return addJournalEntry(updatedEntry);
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
    days: days
  };
};