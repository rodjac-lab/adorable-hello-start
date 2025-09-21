import { useEffect, useSyncExternalStore } from 'react';
import { contentStore } from '@/store/contentStore';
import type { MapContentState } from '@/store/contentStore';
import { useJournalEntries } from './useJournalEntries';

interface UseMapContentSnapshot extends MapContentState {
  isStudioEditing: boolean;
}

const getSnapshot = (): UseMapContentSnapshot => {
  const state = contentStore.getState();
  return {
    ...state.map,
    isStudioEditing: state.studio.isEditing,
  };
};

export const useMapContent = (): UseMapContentSnapshot => {
  const storeSnapshot = useSyncExternalStore(contentStore.subscribe, getSnapshot, getSnapshot);
  const { allEntries, isLoading, error } = useJournalEntries();

  useEffect(() => {
    contentStore.updateMap({
      entries: allEntries,
      isLoading,
      error,
    });
  }, [allEntries, isLoading, error]);

  return {
    ...storeSnapshot,
    entries: allEntries,
    isLoading: storeSnapshot.isLoading || isLoading,
    error: storeSnapshot.error ?? error ?? null,
  };
};
