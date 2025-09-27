
import { useCallback, useEffect, useState } from 'react';
import {
  type MediaAsset,
  getMediaAssets,
  saveMediaAsset,
  removeMediaAsset,
  subscribeToContentStore,
} from '@/lib/contentStore';

export const useMediaLibrary = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getMediaAssets();
      setAssets(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load media assets', err);
      setError('Erreur lors du chargement de la médiathèque');
    } finally {
      setIsLoading(false);
    }

    const unsubscribe = subscribeToContentStore(() => {
      const data = getMediaAssets();
      setAssets(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const reload = useCallback(() => {
    setIsLoading(true);
    try {
      const data = getMediaAssets();
      setAssets(data);
      setError(null);
    } catch (err) {
      console.error('Failed to reload media assets', err);
      setError('Erreur lors du rechargement de la médiathèque');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAsset = useCallback((asset: Partial<MediaAsset>) => {
    try {
      const saved = saveMediaAsset(asset);
      setAssets(getMediaAssets());
      setError(null);
      return saved;
    } catch (err) {
      console.error('Failed to save media asset', err);
      setError('Erreur lors de la sauvegarde du média');
      throw err;
    }
  }, []);

  const deleteAsset = useCallback((id: string) => {
    try {
      removeMediaAsset(id);
      setAssets(getMediaAssets());
      setError(null);
    } catch (err) {
      console.error('Failed to delete media asset', err);
      setError('Erreur lors de la suppression du média');
      throw err;
    }
  }, []);

  return {
    assets,
    isLoading,
    error,
    reload,
    saveAsset,
    deleteAsset,
  };
};
