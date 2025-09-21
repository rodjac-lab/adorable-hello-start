import { getJournalEntries, replaceJournalEntries, forceContentMigration } from '@/lib/contentStore';

/**
 * Utilitaire pour nettoyer les données de test et récupérer les vraies entrées
 */

export const cleanupTestData = async () => {
  try {
    const entries = getJournalEntries();
    const cleanEntries = entries.filter(entry => {
      if (entry.day === 3 && entry.title?.includes('Petra')) {
        return false;
      }
      return true;
    });

    if (cleanEntries.length !== entries.length) {
      await replaceJournalEntries(cleanEntries);
    }

    return cleanEntries;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return null;
  }
};

export const forceStorageReset = () => {
  forceContentMigration();
  console.log('🔄 Version de stockage réinitialisée');
};
