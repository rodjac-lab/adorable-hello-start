
import { useCallback, useEffect, useState } from 'react';
import {
  type MapLocationContent,
  getMapLocations,
  saveMapLocation,
  removeMapLocation,
  subscribeToContentStore,
} from '@/lib/contentStore';
import { logger } from '@/lib/logger';

export const useMapContent = () => {
  const [locations, setLocations] = useState<MapLocationContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getMapLocations();
      setLocations(data);
      setError(null);
    } catch (err) {
      logger.error('Erreur lors du chargement des lieux cartographiques', err);
      setError('Erreur lors du chargement des lieux cartographiques');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(() => {
      const data = getMapLocations();
      setLocations(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const reload = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getMapLocations();
      setLocations(data);
      setError(null);
    } catch (err) {
      logger.error('Erreur lors du rechargement des lieux cartographiques', err);
      setError('Erreur lors du rechargement des lieux cartographiques');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveLocation = useCallback((location: Partial<MapLocationContent>) => {
    try {
      const saved = saveMapLocation(location);
      setLocations(getMapLocations());
      setError(null);
      return saved;
    } catch (err) {
      logger.error('Erreur lors de la sauvegarde du lieu cartographique', err);
      setError('Erreur lors de la sauvegarde du lieu cartographique');
      throw err;
    }
  }, []);

  const deleteLocation = useCallback((id: string) => {
    try {
      removeMapLocation(id);
      setLocations(getMapLocations());
      setError(null);
    } catch (err) {
      logger.error('Erreur lors de la suppression du lieu cartographique', err);
      setError('Erreur lors de la suppression du lieu cartographique');
      throw err;
    }
  }, []);

  return {
    locations,
    isLoading,
    error,
    reload,
    saveLocation,
    deleteLocation,
  };
};
