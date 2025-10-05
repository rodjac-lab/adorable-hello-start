
import { useCallback, useEffect, useState } from 'react';
import {
  getFoodExperiences,
  saveFoodExperience,
  removeFoodExperience,
  subscribeToContentStore,
} from '@/lib/contentStore';
import type { FoodExperience } from '@/store/contentStore';
import { logger } from '@/lib/logger';

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
      logger.error('Erreur lors du chargement des expériences culinaires', err);
      setError('Erreur lors du chargement des expériences culinaires');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(() => {
      const data = getFoodExperiences();
      setExperiences(data);
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
      logger.error('Erreur lors du rechargement des expériences culinaires', err);
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
      logger.error('Erreur lors de la sauvegarde d\'une expérience culinaire', err);
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
      logger.error('Erreur lors de la suppression d\'une expérience culinaire', err);
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
