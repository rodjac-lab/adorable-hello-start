/**
 * Utilitaire pour nettoyer les données de test et récupérer les vraies entrées
 */

export const cleanupTestData = () => {
  // Supprimer les entrées de test qui ont pu contaminer le stockage
  const storage = localStorage.getItem('journalEntries');
  if (storage) {
    try {
      const entries = JSON.parse(storage);
      // Filtrer les entrées qui semblent être des données de test
      const cleanEntries = entries.filter((entry: any) => {
        // Retirer l'entrée Petra du jour 3 qui est clairement un test
        if (entry.day === 3 && entry.title?.includes('Petra')) {
          return false;
        }
        return true;
      });
      
      localStorage.setItem('journalEntries', JSON.stringify(cleanEntries));
      console.log('🧹 Nettoyage des données de test terminé');
      return cleanEntries;
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      return null;
    }
  }
  return null;
};

export const forceStorageReset = () => {
  // Réinitialiser complètement le versioning pour forcer une migration propre
  localStorage.removeItem('journalStorage_version');
  console.log('🔄 Version de stockage réinitialisée');
};