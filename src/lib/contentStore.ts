
import { journalEntries as canonicalJournalEntries } from '@/data/journalEntries';
import { foodExperiences as canonicalFoodExperiences } from '@/data/foodExperiences';
import { placeReferences as canonicalPlaceReferences } from '@/data/placeReferences';
import { readingRecommendations as canonicalReadingRecommendations } from '@/data/readingRecommendations';
import { JOURNAL_STORAGE_KEY, JOURNAL_STORAGE_VERSION, JOURNAL_VERSION_KEY } from '@/lib/journal/constants';
import type { PersistedJournalEntry } from '@/types/journal';
import type {
  ContentSource,
  FoodExperience as BaseFoodExperience,
  PlaceReference as BasePlaceReference,
  ReadingRecommendation as BaseReadingRecommendation,
} from '@/types/content';
import { contentStore as storeContentStore } from '@/store/contentStore';
import type {
  FoodExperience as StoreFoodExperience,
  ReadingRecommendation as StoreReadingRecommendation,
} from '@/store/contentStore';
import { logger } from '@/lib/logger';

export type { ContentSource } from '@/types/content';

export interface JournalContentEntry extends PersistedJournalEntry {
  source: ContentSource;
}

export interface PlaceReference extends BasePlaceReference {
  source: ContentSource;
}

export interface FoodExperience extends BaseFoodExperience {
  source: ContentSource;
}

export interface ReadingRecommendation extends BaseReadingRecommendation {
  source: ContentSource;
}

const SOURCE_STATE_KEY = 'contentStore_sources';

interface SourceState {
  journal: Record<number, ContentSource>;
  hasImported?: boolean;
}

const defaultSourceState: SourceState = {
  journal: {},
  hasImported: false,
};

const canonicalJournalEntriesWithSource: JournalContentEntry[] = canonicalJournalEntries.map(
  (entry) => ({
    ...entry,
    source: 'canonical',
  }),
);

const canonicalPlaceReferencesWithSource: PlaceReference[] = canonicalPlaceReferences.map((place) => ({
  ...place,
  source: 'canonical',
}));

const canonicalFoodExperiencesWithSource: FoodExperience[] = canonicalFoodExperiences.map(
  (experience) => ({
    ...experience,
    source: 'canonical',
  }),
);

const canonicalReadingRecommendationsWithSource: ReadingRecommendation[] =
  canonicalReadingRecommendations.map((book) => ({
    ...book,
    source: 'canonical',
  }));

const loadSourceState = (): SourceState => {
  try {
    const raw = localStorage.getItem(SOURCE_STATE_KEY);
    if (!raw) {
      return { ...defaultSourceState };
    }

    const parsed = JSON.parse(raw);
    return {
      journal: parsed.journal ?? {},
      hasImported: parsed.hasImported ?? false,
    } as SourceState;
  } catch (error) {
    logger.warn('⚠️ Impossible de charger l\'état des sources', error);
    return { ...defaultSourceState };
  }
};

const saveSourceState = (state: SourceState) => {
  localStorage.setItem(SOURCE_STATE_KEY, JSON.stringify(state));
};

const matchCanonicalEntry = (
  entry: PersistedJournalEntry,
): PersistedJournalEntry | undefined => {
  return canonicalJournalEntries.find((canonical) => {
    return (
      canonical.day === entry.day &&
      canonical.title === entry.title &&
      canonical.location === entry.location &&
      canonical.story === entry.story
    );
  });
};

export const initializeContentStore = () => {
  try {
    const existing = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!existing || existing === '[]') {
      const entriesToSave = [...canonicalJournalEntries];
      localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entriesToSave));
      localStorage.setItem(JOURNAL_VERSION_KEY, JOURNAL_STORAGE_VERSION);
      saveSourceState({
        journal: canonicalJournalEntries.reduce<Record<number, ContentSource>>((map, entry) => {
          map[entry.day] = 'canonical';
          return map;
        }, {}),
        hasImported: false,
      });
      return;
    }

    const parsed: PersistedJournalEntry[] = JSON.parse(existing);
    syncJournalSources(parsed);

    if (!localStorage.getItem(JOURNAL_VERSION_KEY)) {
      localStorage.setItem(JOURNAL_VERSION_KEY, JOURNAL_STORAGE_VERSION);
    }
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation du contentStore', error);
  }
};

export const syncJournalSources = (
  entries: PersistedJournalEntry[],
): JournalContentEntry[] => {
  const state = loadSourceState();
  let stateChanged = false;

  const entryDays = new Set(entries.map((entry) => entry.day));
  const syncedEntries = entries.map((entry) => {
    const canonicalMatch = matchCanonicalEntry(entry);
    const source: ContentSource = canonicalMatch ? 'canonical' : 'custom';

    if (state.journal[entry.day] !== source) {
      state.journal[entry.day] = source;
      stateChanged = true;
    }

    return {
      ...entry,
      source,
    };
  });

  Object.keys(state.journal).forEach((key) => {
    const day = Number(key);
    if (!entryDays.has(day)) {
      delete state.journal[day];
      stateChanged = true;
    }
  });

  if (stateChanged) {
    saveSourceState(state);
  }

  return syncedEntries;
};

export const getJournalEntriesWithSource = (
  entries: PersistedJournalEntry[],
): JournalContentEntry[] => {
  return syncJournalSources(entries);
};

export const isCustomJournalDay = (day: number): boolean => {
  const state = loadSourceState();
  return state.journal[day] === 'custom';
};

export const markJournalDayAsCustom = (day: number) => {
  const state = loadSourceState();
  if (state.journal[day] !== 'custom') {
    state.journal[day] = 'custom';
    saveSourceState(state);
  }
};

export const registerImportedJournalEntries = (entries: PersistedJournalEntry[]) => {
  const state = loadSourceState();
  entries.forEach((entry) => {
    state.journal[entry.day] = 'custom';
  });
  state.hasImported = true;
  saveSourceState(state);
};

export const clearContentStoreState = () => {
  localStorage.removeItem(SOURCE_STATE_KEY);
};

export const getCanonicalJournalEntries = (): JournalContentEntry[] => {
  return canonicalJournalEntriesWithSource.map((entry) => ({ ...entry }));
};

export const getPlaceReferences = (): PlaceReference[] => {
  return canonicalPlaceReferencesWithSource.map((place) => ({ ...place }));
};

export const getFoodExperiences = (): StoreFoodExperience[] => {
  const currentState = storeContentStore.getState();
  return currentState.food.experiences;
};

export const getReadingRecommendations = (): ReadingRecommendation[] => {
  return canonicalReadingRecommendationsWithSource.map((book) => ({ ...book }));
};

// Additional types and interfaces needed by hooks
export interface MediaAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  type: string;
  description: string;
  why: string;
  amazon: string;
  rating: number;
}

export interface MapLocationContent {
  id: string;
  name: string;
  coordinates: [number, number];
  description: string;
  day?: number;
}

// Bridge functions to the store
export const subscribeToContentStore = (callback: () => void) => {
  return storeContentStore.subscribe(callback);
};

// Food Experience functions
export const saveFoodExperience = (experience: Partial<StoreFoodExperience>): StoreFoodExperience => {
  const newExperience: StoreFoodExperience = {
    id: experience.id || Date.now().toString(),
    name: experience.name || '',
    type: experience.type || '',
    description: experience.description || '',
    experience: experience.experience || '',
    rating: experience.rating || 0,
    location: experience.location || '',
    price: experience.price || ''
  };

  const currentState = storeContentStore.getState();
  const updatedExperiences = [...currentState.food.experiences, newExperience];
  storeContentStore.updateFood({ experiences: updatedExperiences });
  return newExperience;
};

export const removeFoodExperience = (id: string): void => {
  const currentState = storeContentStore.getState();
  const updatedExperiences = currentState.food.experiences.filter(exp => exp.id !== id);
  storeContentStore.updateFood({ experiences: updatedExperiences });
};

// Media Asset functions
export const getMediaAssets = (): MediaAsset[] => {
  // Return empty array for now - can be implemented when media store is ready
  return [];
};

export const saveMediaAsset = (asset: Partial<MediaAsset>): MediaAsset => {
  const newAsset: MediaAsset = {
    id: asset.id || Date.now().toString(),
    name: asset.name || '',
    type: asset.type || '',
    url: asset.url || '',
    size: asset.size || 0,
    createdAt: asset.createdAt || new Date().toISOString()
  };
  // Implementation needed when media store is ready
  return newAsset;
};

export const removeMediaAsset = (id: string): void => {
  // Implementation needed when media store is ready
};

// Reading Item functions
export const getReadingItems = (): ReadingItem[] => {
  const currentState = storeContentStore.getState();
  return currentState.reading.recommendations.map(rec => ({
    id: rec.id,
    title: rec.title,
    author: rec.author,
    type: rec.type,
    description: rec.description,
    why: rec.why,
    amazon: rec.amazon,
    rating: rec.rating
  }));
};

export const saveReadingItem = (item: Partial<ReadingItem>): ReadingItem => {
  const newItem: StoreReadingRecommendation = {
    id: item.id || Date.now().toString(),
    title: item.title || '',
    author: item.author || '',
    type: item.type || '',
    description: item.description || '',
    why: item.why || '',
    amazon: item.amazon || '',
    rating: item.rating || 0
  };

  const currentState = storeContentStore.getState();
  const updatedRecommendations = [...currentState.reading.recommendations, newItem];
  storeContentStore.updateReading({ recommendations: updatedRecommendations });
  return {
    id: newItem.id,
    title: newItem.title,
    author: newItem.author,
    type: newItem.type,
    description: newItem.description,
    why: newItem.why,
    amazon: newItem.amazon,
    rating: newItem.rating
  };
};

export const removeReadingItem = (id: string): void => {
  const currentState = storeContentStore.getState();
  const updatedRecommendations = currentState.reading.recommendations.filter(rec => rec.id !== id);
  storeContentStore.updateReading({ recommendations: updatedRecommendations });
};

// Map Location functions
export const getMapLocations = (): MapLocationContent[] => {
  // Return empty array for now - can be implemented when map store is ready
  return [];
};

export const saveMapLocation = (location: Partial<MapLocationContent>): MapLocationContent => {
  const newLocation: MapLocationContent = {
    id: location.id || Date.now().toString(),
    name: location.name || '',
    coordinates: location.coordinates || [0, 0],
    description: location.description || '',
    day: location.day
  };
  // Implementation needed when map store is ready
  return newLocation;
};

export const removeMapLocation = (id: string): void => {
  // Implementation needed when map store is ready
};

// Map content actions
export const mapContentActions = {
  // Map actions will be implemented here
};
