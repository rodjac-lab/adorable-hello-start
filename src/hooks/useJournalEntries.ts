import { useState, useEffect, useCallback } from 'react';
import { 
  JournalEntry, 
  loadJournalEntries, 
  updateJournalEntry, 
  addJournalEntry,
  getJournalStats 
} from '@/lib/journalStorage';

// Plus de defaultEntries - tout est maintenant unifié dans le système de persistance

export const useJournalEntries = () => {
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les entrées au démarrage avec système unifié
  useEffect(() => {
    console.log('🚀 Initializing unified journal system...');
    try {
      const loaded = loadJournalEntries();
      console.log('📚 Loaded all entries:', loaded.map(e => `Day ${e.day}: ${e.title}`));
      setAllEntries(loaded);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load entries:', err);
      setError('Erreur lors du chargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Plus besoin de fusion - tout est unifié
  const getAllEntries = useCallback((): JournalEntry[] => {
    return allEntries.sort((a, b) => a.day - b.day);
  }, [allEntries]);

  // Ajouter une nouvelle entrée
  const addEntry = useCallback(async (formData: any): Promise<boolean> => {
    console.log('➕ Adding new entry:', formData.title);
    
    try {
      const newEntry: JournalEntry = {
        day: formData.day,
        date: formData.date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        title: formData.title,
        location: formData.location,
        story: formData.story,
        mood: formData.mood,
        photos: formData.photos || [],
        link: formData.link || undefined,
      };

      const success = await addJournalEntry(newEntry);
      
      if (success) {
        // Recharger toutes les données depuis le localStorage
        const updated = loadJournalEntries();
        setAllEntries(updated);
        console.log('✅ Entry added successfully, total entries:', updated.length);
        setError(null);
        return true;
      } else {
        setError('Erreur lors de l\'ajout de l\'entrée');
        return false;
      }
    } catch (err) {
      console.error('❌ Error adding entry:', err);
      setError('Erreur lors de l\'ajout de l\'entrée');
      return false;
    }
  }, []);

  // Modifier une entrée existante
  const editEntry = useCallback(async (formData: any, originalDay: number): Promise<boolean> => {
    console.log('✏️ Editing entry for day:', originalDay, 'new title:', formData.title);
    
    try {
      const updatedEntry: JournalEntry = {
        day: formData.day,
        date: formData.date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        title: formData.title,
        location: formData.location,
        story: formData.story,
        mood: formData.mood,
        photos: formData.photos || [],
        link: formData.link || undefined,
      };

      const success = await updateJournalEntry(updatedEntry);
      
      // Toujours recharger les données et retourner true pour fermer le formulaire
      const updated = loadJournalEntries();
      setAllEntries(updated);
      
      if (success) {
        console.log('✅ Entry updated successfully, total entries:', updated.length);
        setError(null);
      } else {
        console.warn('⚠️ Save failed but form will close - check quota');
        setError('Sauvegarde échouée: quota localStorage dépassé. Réduisez la taille des photos.');
      }
      
      // Toujours retourner true pour fermer le formulaire
      return true;
    } catch (err) {
      console.error('❌ Error editing entry:', err);
      setError('Erreur lors de la modification: ' + (err as Error).message);
      
      // Même en cas d'erreur, on recharge et on ferme le formulaire
      const updated = loadJournalEntries();
      setAllEntries(updated);
      return true;
    }
  }, []);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return getJournalStats();
  }, []);

  // Forcer le rechargement des données
  const reloadEntries = useCallback(() => {
    console.log('🔄 Manually reloading entries...');
    setIsLoading(true);
    try {
      const loaded = loadJournalEntries();
      setAllEntries(loaded);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to reload entries:', err);
      setError('Erreur lors du rechargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    allEntries: getAllEntries(),
    customEntries: allEntries, // Pour compatibilité rétroactive
    isLoading,
    error,
    addEntry,
    editEntry,
    getStats,
    reloadEntries
  };
};