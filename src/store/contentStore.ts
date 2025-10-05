import { foodExperiences as canonicalFoodExperiences } from '@/data/foodExperiences';
import { readingRecommendations as canonicalReadingRecommendations } from '@/data/readingRecommendations';
import type { JournalEntry } from '@/lib/journalStorage';
import type {
  ContentStatus,
  FoodExperience as BaseFoodExperience,
  ReadingRecommendation as BaseReadingRecommendation,
} from '@/types/content';

export type FoodExperience = BaseFoodExperience;

export type ReadingRecommendation = BaseReadingRecommendation;

export interface FoodContentState {
  experiences: FoodExperience[];
  status: ContentStatus;
  isLoading: boolean;
  error: string | null;
}

export interface ReadingContentState {
  recommendations: ReadingRecommendation[];
  status: ContentStatus;
  isLoading: boolean;
  error: string | null;
}

export interface MapContentState {
  entries: JournalEntry[];
  status: ContentStatus;
  isLoading: boolean;
  error: string | null;
}

export interface StudioState {
  isEditing: boolean;
}

export interface ContentState {
  studio: StudioState;
  food: FoodContentState;
  reading: ReadingContentState;
  map: MapContentState;
}

type ContentListener = () => void;

const createDefaultFoodExperiences = (): FoodExperience[] =>
  canonicalFoodExperiences.map((experience) => ({ ...experience }));

const createDefaultReadingRecommendations = (): ReadingRecommendation[] =>
  canonicalReadingRecommendations.map((recommendation) => ({ ...recommendation }));

const createInitialState = (): ContentState => ({
  studio: {
    isEditing: false,
  },
  food: {
    experiences: createDefaultFoodExperiences(),
    status: 'published',
    isLoading: false,
    error: null,
  },
  reading: {
    recommendations: createDefaultReadingRecommendations(),
    status: 'published',
    isLoading: false,
    error: null,
  },
  map: {
    entries: [],
    status: 'published',
    isLoading: false,
    error: null,
  },
});

let state: ContentState = createInitialState();
const listeners = new Set<ContentListener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const shallowEqual = <T extends Record<string, unknown>>(a: T, b: T) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
};

export const contentStore = {
  subscribe(listener: ContentListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): ContentState {
    return state;
  },
  setState(partial: Partial<ContentState>) {
    state = { ...state, ...partial };
    notify();
  },
  updateFood(partial: Partial<FoodContentState>) {
    const next = { ...state.food, ...partial };
    if (shallowEqual(state.food, next)) {
      return;
    }
    state = { ...state, food: next };
    notify();
  },
  updateReading(partial: Partial<ReadingContentState>) {
    const next = { ...state.reading, ...partial };
    if (shallowEqual(state.reading, next)) {
      return;
    }
    state = { ...state, reading: next };
    notify();
  },
  updateMap(partial: Partial<MapContentState>) {
    const next = { ...state.map, ...partial };
    if (shallowEqual(state.map, next)) {
      return;
    }
    state = { ...state, map: next };
    notify();
  },
  setStudioEditing(isEditing: boolean) {
    if (state.studio.isEditing === isEditing) {
      return;
    }
    state = { ...state, studio: { ...state.studio, isEditing } };
    notify();
  },
  reset() {
    state = createInitialState();
    notify();
  },
};

export type { ContentListener };
export { createInitialState };
