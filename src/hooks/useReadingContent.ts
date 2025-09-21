import { useSyncExternalStore } from 'react';
import { contentStore } from '@/store/contentStore';
import type { ReadingContentState } from '@/store/contentStore';

interface UseReadingContentSnapshot extends ReadingContentState {
  isStudioEditing: boolean;
}

const getSnapshot = (): UseReadingContentSnapshot => {
  const state = contentStore.getState();
  return {
    ...state.reading,
    isStudioEditing: state.studio.isEditing,
  };
};

export const useReadingContent = (): UseReadingContentSnapshot => {
  return useSyncExternalStore(contentStore.subscribe, getSnapshot, getSnapshot);
};
