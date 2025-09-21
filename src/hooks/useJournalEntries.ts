import { useState, useEffect, useCallback } from 'react';
import {
  JournalEntry,
  loadJournalEntries,
  updateJournalEntry,
  addJournalEntry,
  getJournalStats
} from '@/lib/journalStorage';
import {
  getJournalEntriesWithSource,
  isCustomJournalDay
} from '@/lib/contentStore';
import type { JournalContentEntry } from '@/lib/contentStore';

// Plus de defaultEntries - tout est maintenant unifié dans le système de persistance

export const useJournalEntries = () => {
  const [allEntries, setAllEntries] = useState<JournalContentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntriesFromStorage = useCallback((): JournalContentEntry[] => {
    const loaded = loadJournalEntries();
    const withSources = getJournalEntriesWithSource(loaded);
    console.log('📚 Loaded all entries:', withSources.map(e => `Day ${e.day}: ${e.title} (${e.source})`));
    setAllEntries(withSources);
    return withSources;
  }, []);

  // Charger les entrées au démarrage avec système unifié
  useEffect(() => {
    console.log('🚀 Initializing unified journal system...');
    try {
      loadEntriesFromStorage();
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load entries:', err);
      setError('Erreur lors du chargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, [loadEntriesFromStorage]);

  // Plus besoin de fusion - tout est unifié
  const getAllEntries = useCallback((): JournalContentEntry[] => {
    return [...allEntries].sort((a, b) => a.day - b.day);
  }, [allEntries]);

  const getCustomEntries = useCallback((): JournalContentEntry[] => {
    return getAllEntries().filter(entry => entry.source === 'custom');
  }, [getAllEntries]);

  const isCustom = useCallback((day: number): boolean => {
    const entry = allEntries.find(item => item.day === day);
    if (entry) {
      return entry.source === 'custom';
    }
    return isCustomJournalDay(day);
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
        loadEntriesFromStorage();
        console.log('✅ Entry added successfully');
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
      loadEntriesFromStorage();

      if (success) {
        console.log('✅ Entry updated successfully');
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
      loadEntriesFromStorage();
      return true;
    }
  }, [loadEntriesFromStorage]);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    return getJournalStats();
  }, []);

  // Forcer le rechargement des données
  const reloadEntries = useCallback(() => {
    console.log('🔄 Manually reloading entries...');
    setIsLoading(true);
    try {
      loadEntriesFromStorage();
      setError(null);
    } catch (err) {
      console.error('❌ Failed to reload entries:', err);
      setError('Erreur lors du rechargement des entrées');
    } finally {
      setIsLoading(false);
    }
  }, [loadEntriesFromStorage]);

  return {
    allEntries: getAllEntries(),
    customEntries: getCustomEntries(),
    isCustom,
    isLoading,
    error,
    addEntry,
    editEntry,
    getStats,
    reloadEntries
  };
};