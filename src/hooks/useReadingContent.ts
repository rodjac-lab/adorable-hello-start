
import { useCallback, useEffect, useState } from 'react';
import {
  type ReadingItem,
  getReadingItems,
  saveReadingItem,
  removeReadingItem,
  subscribeToContentStore,
} from '@/lib/contentStore';
import { logger } from '@/lib/logger';

export const useReadingContent = () => {
  const [items, setItems] = useState<ReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getReadingItems();
      setItems(data);
      setError(null);
    } catch (err) {
      logger.error('Erreur lors du chargement des lectures', err);
      setError('Erreur lors du chargement des lectures');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(() => {
      const data = getReadingItems();
      setItems(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const reload = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getReadingItems();
      setItems(data);
      setError(null);
    } catch (err) {
      logger.error('Erreur lors du rechargement des lectures', err);
      setError('Erreur lors du rechargement des lectures');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveItem = useCallback((item: Partial<ReadingItem>) => {
    try {
      const saved = saveReadingItem(item);
      setItems(getReadingItems());
      setError(null);
      return saved;
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde d\'une lecture', err);
      setError('Erreur lors de la sauvegarde de la lecture');
      throw err;
    }
  }, []);

  const deleteItem = useCallback((id: string) => {
    try {
      removeReadingItem(id);
      setItems(getReadingItems());
      setError(null);
    } catch (err) {
      logger.error('Erreur lors de la suppression d\'une lecture', err);
      setError('Erreur lors de la suppression de la lecture');
      throw err;
    }
  }, []);

  return {
    items,
    isLoading,
    error,
    reload,
    saveItem,
    deleteItem,
  };
};
