import { loadJournalEntries, saveJournalEntries, diagnosticTools, type JournalEntry } from '@/lib/journalStorage';

/**
 * Utilitaire pour nettoyer les données de test et récupérer les vraies entrées
 */

export const cleanupTestData = async () => {
  try {
    const entries = loadJournalEntries();
    const cleanEntries = entries.filter((entry: JournalEntry) => {
      if (entry.day === 3 && entry.title?.includes('Petra')) {
        return false;
      }
      return true;
    });

    if (cleanEntries.length !== entries.length) {
      await saveJournalEntries(cleanEntries);
    }

    return cleanEntries;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return null;
  }
};

export const forceStorageReset = () => {
  diagnosticTools.resetStorage();
  console.log('🔄 Version de stockage réinitialisée');
};
