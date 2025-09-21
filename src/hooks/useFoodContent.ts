import { useSyncExternalStore } from 'react';
import { contentStore } from '@/store/contentStore';
import type { FoodContentState } from '@/store/contentStore';

interface UseFoodContentSnapshot extends FoodContentState {
  isStudioEditing: boolean;
}

const getSnapshot = (): UseFoodContentSnapshot => {
  const state = contentStore.getState();
  return {
    ...state.food,
    isStudioEditing: state.studio.isEditing,
  };
};

export const useFoodContent = (): UseFoodContentSnapshot => {
  return useSyncExternalStore(contentStore.subscribe, getSnapshot, getSnapshot);
};
