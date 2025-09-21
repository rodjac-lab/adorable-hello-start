import { useCallback, useEffect, useState } from 'react';
import {
  type MapLocationContent,
  getMapLocations,
  saveMapLocation,
  removeMapLocation,
  subscribeToContentStore,
} from '@/lib/contentStore';

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
      console.error('Failed to load map locations', err);
      setError('Erreur lors du chargement des lieux cartographiques');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(state => {
      setLocations(state.mapLocations);
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
      console.error('Failed to reload map locations', err);
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
      console.error('Failed to save map location', err);
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
      console.error('Failed to delete map location', err);
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
