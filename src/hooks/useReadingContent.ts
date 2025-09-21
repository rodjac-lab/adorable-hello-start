
import { useCallback, useEffect, useState } from 'react';
import {
  type ReadingItem,
  getReadingItems,
  saveReadingItem,
  removeReadingItem,
  subscribeToContentStore,
} from '@/lib/contentStore';

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
      console.error('Failed to load reading list', err);
      setError('Erreur lors du chargement des lectures');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(state => {
      setItems(state.readingList);
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
      console.error('Failed to reload reading list', err);
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
      console.error('Failed to save reading item', err);
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
      console.error('Failed to delete reading item', err);
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
 main
