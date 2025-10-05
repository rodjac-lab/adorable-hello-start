import { useState, useEffect, useCallback } from 'react';
import {
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
import type { JournalEntryFormData } from '@/types/journal';
import { toPersistedJournalEntry } from '@/lib/journalMapper';
import { logger } from '@/lib/logger';

// Plus de defaultEntries - tout est maintenant unifié dans le système de persistance

export const useJournalEntries = () => {
  const [allEntries, setAllEntries] = useState<JournalContentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntriesFromStorage = useCallback((): JournalContentEntry[] => {
    const loaded = loadJournalEntries();
    const withSources = getJournalEntriesWithSource(loaded);
    logger.debug('📚 Chargement des entrées terminé', withSources.map((entry) => ({
      day: entry.day,
      title: entry.title,
      source: entry.source,
    })));
    setAllEntries(withSources);
    return withSources;
  }, []);

  // Charger les entrées au démarrage avec système unifié
  useEffect(() => {
    logger.info('🚀 Initialisation du journal depuis la persistance locale');
    try {
      loadEntriesFromStorage();
      setError(null);
    } catch (err) {
      logger.error('❌ Échec du chargement des entrées', err);
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
  const addEntry = useCallback(async (formData: JournalEntryFormData): Promise<boolean> => {
    logger.debug('➕ Ajout d\'une nouvelle entrée', { title: formData.title });
    
    try {
      const success = await addJournalEntry(toPersistedJournalEntry(formData));

      if (success) {
        // Recharger toutes les données depuis le localStorage
        loadEntriesFromStorage();
        logger.info('✅ Entrée ajoutée avec succès', { title: formData.title });
        setError(null);
        return true;
      } else {
        setError('Erreur lors de l\'ajout de l\'entrée');
        return false;
      }
    } catch (err) {
      logger.error('❌ Erreur lors de l\'ajout d\'une entrée', err);
      setError('Erreur lors de l\'ajout de l\'entrée');
      return false;
    }
  }, [loadEntriesFromStorage]);

  // Modifier une entrée existante
  const editEntry = useCallback(async (formData: JournalEntryFormData, originalDay: number): Promise<boolean> => {
    logger.debug('✏️ Modification d\'une entrée', { day: originalDay, title: formData.title });
    
    try {
      const success = await updateJournalEntry(toPersistedJournalEntry(formData));

      // Toujours recharger les données et retourner true pour fermer le formulaire
      loadEntriesFromStorage();

      if (success) {
        logger.info('✅ Entrée mise à jour', { day: originalDay, title: formData.title });
        setError(null);
      } else {
        logger.warn('⚠️ La sauvegarde a échoué, vérifiez le quota localStorage');
        setError('Sauvegarde échouée: quota localStorage dépassé. Réduisez la taille des photos.');
      }
      
      // Toujours retourner true pour fermer le formulaire
      return true;
    } catch (err) {
      logger.error('❌ Erreur lors de la modification d\'une entrée', err);
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
    logger.debug('🔄 Rechargement manuel des entrées');
    setIsLoading(true);
    try {
      loadEntriesFromStorage();
      setError(null);
    } catch (err) {
      logger.error('❌ Échec du rechargement des entrées', err);
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