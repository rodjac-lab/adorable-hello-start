import { useCallback, useEffect, useState } from 'react';
import {
  type FoodExperience,
  getFoodExperiences,
  saveFoodExperience,
  removeFoodExperience,
  subscribeToContentStore,
} from '@/lib/contentStore';

export const useFoodContent = () => {
  const [experiences, setExperiences] = useState<FoodExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getFoodExperiences();
      setExperiences(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load food experiences', err);
      setError('Erreur lors du chargement des expériences culinaires');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(state => {
      setExperiences(state.foodExperiences);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const reload = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getFoodExperiences();
      setExperiences(data);
      setError(null);
    } catch (err) {
      console.error('Failed to reload food experiences', err);
      setError('Erreur lors du rechargement des expériences culinaires');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveExperience = useCallback((experience: Partial<FoodExperience>) => {
    try {
      const saved = saveFoodExperience(experience);
      setExperiences(getFoodExperiences());
      setError(null);
      return saved;
    } catch (err) {
      console.error('Failed to save food experience', err);
      setError('Erreur lors de la sauvegarde de l\'expérience culinaire');
      throw err;
    }
  }, []);

  const deleteExperience = useCallback((id: string) => {
    try {
      removeFoodExperience(id);
      setExperiences(getFoodExperiences());
      setError(null);
    } catch (err) {
      console.error('Failed to delete food experience', err);
      setError('Erreur lors de la suppression de l\'expérience culinaire');
      throw err;
    }
  }, []);

  return {
    experiences,
    isLoading,
    error,
    reload,
    saveExperience,
    deleteExperience,
  };
};
