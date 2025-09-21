import { useState, useEffect, useCallback } from 'react';
import {
  type JournalEntryContent,
  getJournalEntries,
  saveJournalEntry,
  getJournalStats,
  subscribeToContentStore,
} from '@/lib/contentStore';

// Plus de defaultEntries - tout est maintenant unifié dans le système de persistance

export const useJournalEntries = () => {
  const [allEntries, setAllEntries] = useState<JournalEntryContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les entrées au démarrage avec système unifié
  useEffect(() => {
    console.log('🚀 Initializing unified journal system...');
    try {
      const loaded = getJournalEntries();
      console.log('📚 Loaded all entries:', loaded.map(e => `Day ${e.day}: ${e.title}`));
      setAllEntries(loaded);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load entries:', err);
      setError('Erreur lors du chargement des entrées');
    } finally {
      setIsLoading(false);
    }
    const unsubscribe = subscribeToContentStore(state => {
      setAllEntries([...state.journalEntries].sort((a, b) => a.day - b.day));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Plus besoin de fusion - tout est unifié
  const getAllEntries = useCallback((): JournalEntryContent[] => {
    return [...allEntries].sort((a, b) => a.day - b.day);
  }, [allEntries]);

  // Ajouter une nouvelle entrée
  const addEntry = useCallback(async (formData: any): Promise<boolean> => {
    console.log('➕ Adding new entry:', formData.title);
    
    try {
      const newEntry: JournalEntryContent = {
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
        isCustom: true,
      };

      await saveJournalEntry(newEntry);

      const updated = getJournalEntries();
      setAllEntries(updated);
      console.log('✅ Entry added successfully, total entries:', updated.length);
      setError(null);
      return true;
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
      const existing = allEntries.find(entry => entry.day === originalDay);
      const updatedEntry: JournalEntryContent = {
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
        isCustom: existing?.isCustom ?? true,
      };

      await saveJournalEntry(updatedEntry);

      // Toujours recharger les données et retourner true pour fermer le formulaire
      const updated = getJournalEntries();
      setAllEntries(updated);

      console.log('✅ Entry updated successfully, total entries:', updated.length);
      setError(null);

      // Toujours retourner true pour fermer le formulaire
      return true;
    } catch (err) {
      console.error('❌ Error editing entry:', err);
      setError('Erreur lors de la modification: ' + (err as Error).message);
      
      // Même en cas d'erreur, on recharge et on ferme le formulaire
      const updated = getJournalEntries();
      setAllEntries(updated);
      return true;
    }
  }, [allEntries]);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return getJournalStats();
  }, []);

  // Forcer le rechargement des données
  const reloadEntries = useCallback(() => {
    console.log('🔄 Manually reloading entries...');
    setIsLoading(true);
    try {
      const loaded = getJournalEntries();
      setAllEntries(loaded);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to reload entries:', err);
      setError('Erreur lors du rechargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isCustom = useCallback((day: number) => {
    const entry = allEntries.find(item => item.day === day);
    return entry?.isCustom ?? false;
  }, [allEntries]);

  return {
    allEntries: getAllEntries(),
    customEntries: allEntries, // Pour compatibilité rétroactive
    isLoading,
    error,
    addEntry,
    editEntry,
    getStats,
    reloadEntries,
    isCustom
  };
};