import { compressImageUrl } from './imageCompression';

const STORAGE_KEY = 'contentStore:v1';
const BACKUP_KEY = `${STORAGE_KEY}:backup1`;
const BACKUP_2_KEY = `${STORAGE_KEY}:backup2`;
const VERSION_KEY = `${STORAGE_KEY}:version`;
const LEGACY_JOURNAL_KEY = 'journalEntries';
export const CONTENT_STORE_VERSION = '1.0.0';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const nowIso = () => new Date().toISOString();

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}`;
};

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  relatedDay?: number;
  capturedAt?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface JournalEntryContent {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
  photos?: string[];
  link?: string;
  mediaIds?: string[];
  mapLocationIds?: string[];
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodExperience {
  id: string;
  name: string;
  description: string;
  experience?: string;
  rating?: number;
  location?: string;
  price?: string;
  date?: string;
  relatedDay?: number;
  tags?: string[];
  mediaIds?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  author?: string;
  type?: string;
  description?: string;
  reason?: string;
  link?: string;
  rating?: number;
  tags?: string[];
  relatedDay?: number;
  mediaIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MapLocationContent {
  id: string;
  name: string;
  coordinates: [number, number];
  day?: number;
  relatedEntryDay?: number;
  description?: string;
  notes?: string;
  tags?: string[];
  mediaIds?: string[];
  validated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentStoreState {
  version: string;
  updatedAt: string;
  journalEntries: JournalEntryContent[];
  foodExperiences: FoodExperience[];
  readingList: ReadingItem[];
  mapLocations: MapLocationContent[];
  mediaLibrary: MediaAsset[];
}

export interface JournalStats {
  totalEntries: number;
  minDay: number;
  maxDay: number;
  days: number[];
  customDays: number[];
  customCount: number;
  storageVersion: string;
  hasBackups: boolean;
}

export interface ContentExportPayload {
  version: string;
  exportedAt: string;
  data: ContentStoreState;
}

export interface ImportContentOptions {
  merge?: boolean;
}

const createEmptyState = (): ContentStoreState => ({
  version: CONTENT_STORE_VERSION,
  updatedAt: nowIso(),
  journalEntries: [],
  foodExperiences: [],
  readingList: [],
  mapLocations: [],
  mediaLibrary: []
});

let memoryState: ContentStoreState = createEmptyState();

const listeners = new Set<(state: ContentStoreState) => void>();

const notify = (state: ContentStoreState) => {
  listeners.forEach(listener => {
    try {
      listener(state);
    } catch (error) {
      console.error('ContentStore listener error', error);
    }
  });
};

const normalizeMediaAsset = (asset: Partial<MediaAsset>): MediaAsset => {
  const createdAt = asset.createdAt || nowIso();
  return {
    id: asset.id || generateId(),
    type: asset.type === 'video' || asset.type === 'audio' || asset.type === 'document' ? asset.type : 'image',
    title: asset.title || 'Untitled asset',
    url: asset.url || '',
    description: asset.description,
    tags: isStringArray(asset.tags) ? asset.tags : [],
    relatedDay: typeof asset.relatedDay === 'number' ? asset.relatedDay : undefined,
    capturedAt: asset.capturedAt,
    location: asset.location,
    createdAt,
    updatedAt: asset.updatedAt || createdAt,
    metadata: typeof asset.metadata === 'object' && asset.metadata !== null ? asset.metadata as Record<string, unknown> : undefined,
  };
};

const normalizeJournalEntry = async (
  entry: Partial<JournalEntryContent>,
  existing?: JournalEntryContent
): Promise<JournalEntryContent> => {
  const createdAt = existing?.createdAt || entry.createdAt || nowIso();
  const basePhotos = Array.isArray(entry.photos)
    ? entry.photos.filter(photo => typeof photo === 'string')
    : existing?.photos || [];

  const processedPhotos = await Promise.all(
    basePhotos.map(async photo => {
      if (typeof photo !== 'string') return null;
      if (!photo.startsWith('blob:') && !photo.startsWith('data:')) return photo;

      try {
        return await compressImageUrl(photo, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.7,
          format: 'jpeg'
        });
      } catch (error) {
        console.warn('Failed to compress photo, keeping original', error);
        return photo;
      }
    })
  );

  const validPhotos = processedPhotos.filter((photo): photo is string => typeof photo === 'string');

  return {
    day: typeof entry.day === 'number' ? entry.day : existing?.day || 0,
    date: entry.date || existing?.date || '',
    title: entry.title || existing?.title || '',
    location: entry.location || existing?.location || '',
    story: entry.story || existing?.story || '',
    mood: entry.mood || existing?.mood || '',
    photos: validPhotos,
    link: entry.link || existing?.link,
    mediaIds: isStringArray(entry.mediaIds) ? entry.mediaIds : existing?.mediaIds,
    mapLocationIds: isStringArray(entry.mapLocationIds) ? entry.mapLocationIds : existing?.mapLocationIds,
    isCustom: typeof entry.isCustom === 'boolean' ? entry.isCustom : existing?.isCustom ?? true,
    createdAt,
    updatedAt: nowIso(),
  };
};

const normalizeFoodExperience = (experience: Partial<FoodExperience>): FoodExperience => {
  const createdAt = experience.createdAt || nowIso();
  return {
    id: experience.id || generateId(),
    name: experience.name || 'Expérience gastronomique',
    description: experience.description || '',
    experience: experience.experience,
    rating: typeof experience.rating === 'number' ? experience.rating : undefined,
    location: experience.location,
    price: experience.price,
    date: experience.date,
    relatedDay: typeof experience.relatedDay === 'number' ? experience.relatedDay : undefined,
    tags: isStringArray(experience.tags) ? experience.tags : [],
    mediaIds: isStringArray(experience.mediaIds) ? experience.mediaIds : [],
    notes: experience.notes,
    createdAt,
    updatedAt: experience.updatedAt || createdAt,
  };
};

const normalizeReadingItem = (item: Partial<ReadingItem>): ReadingItem => {
  const createdAt = item.createdAt || nowIso();
  return {
    id: item.id || generateId(),
    title: item.title || 'Ressource de lecture',
    author: item.author,
    type: item.type,
    description: item.description,
    reason: item.reason,
    link: item.link,
    rating: typeof item.rating === 'number' ? item.rating : undefined,
    tags: isStringArray(item.tags) ? item.tags : [],
    relatedDay: typeof item.relatedDay === 'number' ? item.relatedDay : undefined,
    mediaIds: isStringArray(item.mediaIds) ? item.mediaIds : [],
    createdAt,
    updatedAt: item.updatedAt || createdAt,
  };
};

const normalizeMapLocation = (location: Partial<MapLocationContent>): MapLocationContent => {
  const createdAt = location.createdAt || nowIso();
  const coordinates = Array.isArray(location.coordinates) && location.coordinates.length === 2
    ? [Number(location.coordinates[0]), Number(location.coordinates[1])]
    : [0, 0];

  return {
    id: location.id || generateId(),
    name: location.name || 'Lieu cartographique',
    coordinates: [coordinates[0], coordinates[1]],
    day: typeof location.day === 'number' ? location.day : undefined,
    relatedEntryDay: typeof location.relatedEntryDay === 'number' ? location.relatedEntryDay : undefined,
    description: location.description,
    notes: location.notes,
    tags: isStringArray(location.tags) ? location.tags : [],
    mediaIds: isStringArray(location.mediaIds) ? location.mediaIds : [],
    validated: typeof location.validated === 'boolean' ? location.validated : undefined,
    createdAt,
    updatedAt: location.updatedAt || createdAt,
  };
};

const sanitizeState = (partial?: Partial<ContentStoreState>): ContentStoreState => {
  const state = partial || {};
  return {
    version: CONTENT_STORE_VERSION,
    updatedAt: typeof state.updatedAt === 'string' ? state.updatedAt : nowIso(),
    journalEntries: Array.isArray(state.journalEntries) ? state.journalEntries.map(entry => ({ ...entry })) : [],
    foodExperiences: Array.isArray(state.foodExperiences) ? state.foodExperiences.map(experience => ({ ...experience })) : [],
    readingList: Array.isArray(state.readingList) ? state.readingList.map(item => ({ ...item })) : [],
    mapLocations: Array.isArray(state.mapLocations) ? state.mapLocations.map(location => ({ ...location })) : [],
    mediaLibrary: Array.isArray(state.mediaLibrary) ? state.mediaLibrary.map(asset => ({ ...asset })) : [],
  };
};

const readState = (): ContentStoreState => {
  if (!isBrowser) {
    return memoryState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryState = createEmptyState();
    return memoryState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ContentStoreState>;
    const sanitized = sanitizeState(parsed);
    const migrated = runMigrations(sanitized);
    memoryState = migrated;
    return migrated;
  } catch (error) {
    console.error('Failed to parse stored content state', error);
    memoryState = createEmptyState();
    return memoryState;
  }
};

const writeState = (state: ContentStoreState): ContentStoreState => {
  const nextState: ContentStoreState = {
    ...state,
    version: CONTENT_STORE_VERSION,
    updatedAt: nowIso(),
  };

  if (isBrowser) {
    const serialized = JSON.stringify(nextState);
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing && existing !== serialized) {
      const backup1 = window.localStorage.getItem(BACKUP_KEY);
      if (backup1) {
        window.localStorage.setItem(BACKUP_2_KEY, backup1);
      }
      window.localStorage.setItem(BACKUP_KEY, existing);
    }
    window.localStorage.setItem(STORAGE_KEY, serialized);
    window.localStorage.setItem(VERSION_KEY, CONTENT_STORE_VERSION);
  }

  memoryState = nextState;
  notify(nextState);
  return nextState;
};

const setState = (updater: (state: ContentStoreState) => ContentStoreState): ContentStoreState => {
  const current = readState();
  const updated = updater(current);
  const sanitized = sanitizeState(updated);
  return writeState(sanitized);
};

const runMigrations = (state: ContentStoreState): ContentStoreState => {
  if (!isBrowser) {
    return state;
  }

  const version = window.localStorage.getItem(VERSION_KEY);
  if (version === CONTENT_STORE_VERSION) {
    return state;
  }

  let nextState = { ...state };

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_JOURNAL_KEY);
    if (legacyRaw) {
      const legacyEntries = JSON.parse(legacyRaw);
      if (Array.isArray(legacyEntries)) {
        const validEntries = legacyEntries.filter(entry => entry && typeof entry.day === 'number');
        nextState.journalEntries = validEntries.map(entry => ({
          day: entry.day,
          date: entry.date || '',
          title: entry.title || '',
          location: entry.location || '',
          story: entry.story || '',
          mood: entry.mood || '',
          photos: Array.isArray(entry.photos) ? entry.photos.filter((photo: unknown) => typeof photo === 'string') : [],
          link: typeof entry.link === 'string' ? entry.link : undefined,
          isCustom: true,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to migrate legacy journal entries', error);
  }

  const serialized = JSON.stringify(nextState);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.localStorage.setItem(VERSION_KEY, CONTENT_STORE_VERSION);
  memoryState = nextState;
  return nextState;
};

export const subscribeToContentStore = (listener: (state: ContentStoreState) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getContentState = (): ContentStoreState => readState();

export const getJournalEntries = (): JournalEntryContent[] => {
  const state = readState();
  return [...state.journalEntries].sort((a, b) => a.day - b.day);
};

export const getJournalEntry = (day: number): JournalEntryContent | undefined => {
  return getJournalEntries().find(entry => entry.day === day);
};

export const saveJournalEntry = async (entry: JournalEntryContent): Promise<JournalEntryContent> => {
  const currentState = readState();
  const existing = currentState.journalEntries.find(item => item.day === entry.day);
  const normalized = await normalizeJournalEntry(entry, existing);

  const nextState: ContentStoreState = {
    ...currentState,
    journalEntries: [...currentState.journalEntries.filter(item => item.day !== entry.day), normalized]
      .sort((a, b) => a.day - b.day)
  };

  writeState(nextState);
  return normalized;
};

export const removeJournalEntry = (day: number): void => {
  setState(state => ({
    ...state,
    journalEntries: state.journalEntries.filter(entry => entry.day !== day)
  }));
};

export const replaceJournalEntries = async (entries: JournalEntryContent[]): Promise<JournalEntryContent[]> => {
  const normalizedEntries = await Promise.all(entries.map(entry => normalizeJournalEntry(entry)));
  const currentState = readState();
  const nextState: ContentStoreState = {
    ...currentState,
    journalEntries: [...normalizedEntries].sort((a, b) => a.day - b.day)
  };

  writeState(nextState);
  return nextState.journalEntries;
};

export const getJournalStats = (): JournalStats => {
  const entries = getJournalEntries();
  const days = entries.map(entry => entry.day).sort((a, b) => a - b);
  return {
    totalEntries: entries.length,
    minDay: days[0] ?? 0,
    maxDay: days[days.length - 1] ?? 0,
    days,
    customDays: entries.filter(entry => entry.isCustom).map(entry => entry.day),
    customCount: entries.filter(entry => entry.isCustom).length,
    storageVersion: isBrowser ? window.localStorage.getItem(VERSION_KEY) || CONTENT_STORE_VERSION : CONTENT_STORE_VERSION,
    hasBackups: isBrowser ? Boolean(window.localStorage.getItem(BACKUP_KEY) || window.localStorage.getItem(BACKUP_2_KEY)) : false,
  };
};

export const getFoodExperiences = (): FoodExperience[] => {
  const state = readState();
  return [...state.foodExperiences];
};

export const saveFoodExperience = (experience: Partial<FoodExperience>): FoodExperience => {
  let saved = normalizeFoodExperience(experience);
  setState(state => {
    const others = state.foodExperiences.filter(item => item.id !== saved.id);
    saved = normalizeFoodExperience({ ...experience, id: saved.id, createdAt: saved.createdAt });
    return {
      ...state,
      foodExperiences: [...others, saved]
    };
  });
  return saved;
};

export const removeFoodExperience = (id: string): void => {
  setState(state => ({
    ...state,
    foodExperiences: state.foodExperiences.filter(item => item.id !== id)
  }));
};

export const getReadingItems = (): ReadingItem[] => {
  const state = readState();
  return [...state.readingList];
};

export const saveReadingItem = (item: Partial<ReadingItem>): ReadingItem => {
  let saved = normalizeReadingItem(item);
  setState(state => {
    const others = state.readingList.filter(current => current.id !== saved.id);
    saved = normalizeReadingItem({ ...item, id: saved.id, createdAt: saved.createdAt });
    return {
      ...state,
      readingList: [...others, saved]
    };
  });
  return saved;
};

export const removeReadingItem = (id: string): void => {
  setState(state => ({
    ...state,
    readingList: state.readingList.filter(item => item.id !== id)
  }));
};

export const getMapLocations = (): MapLocationContent[] => {
  const state = readState();
  return [...state.mapLocations];
};

export const saveMapLocation = (location: Partial<MapLocationContent>): MapLocationContent => {
  let saved = normalizeMapLocation(location);
  setState(state => {
    const others = state.mapLocations.filter(current => current.id !== saved.id);
    saved = normalizeMapLocation({ ...location, id: saved.id, createdAt: saved.createdAt });
    return {
      ...state,
      mapLocations: [...others, saved]
    };
  });
  return saved;
};

export const removeMapLocation = (id: string): void => {
  setState(state => ({
    ...state,
    mapLocations: state.mapLocations.filter(location => location.id !== id)
  }));
};

export const getMediaAssets = (): MediaAsset[] => {
  const state = readState();
  return [...state.mediaLibrary];
};

export const saveMediaAsset = (asset: Partial<MediaAsset>): MediaAsset => {
  let saved = normalizeMediaAsset(asset);
  setState(state => {
    const others = state.mediaLibrary.filter(current => current.id !== saved.id);
    saved = normalizeMediaAsset({ ...asset, id: saved.id, createdAt: saved.createdAt });
    return {
      ...state,
      mediaLibrary: [...others, saved]
    };
  });
  return saved;
};

export const removeMediaAsset = (id: string): void => {
  setState(state => ({
    ...state,
    mediaLibrary: state.mediaLibrary.filter(asset => asset.id !== id)
  }));
};

const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
  const map = new Map<string, T>();
  current.forEach(item => map.set(item.id, item));
  incoming.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
};

const mergeJournalEntries = (current: JournalEntryContent[], incoming: JournalEntryContent[]): JournalEntryContent[] => {
  const map = new Map<number, JournalEntryContent>();
  current.forEach(entry => map.set(entry.day, entry));
  incoming.forEach(entry => map.set(entry.day, entry));
  return Array.from(map.values()).sort((a, b) => a.day - b.day);
};

export const exportContent = (): ContentExportPayload => ({
  version: CONTENT_STORE_VERSION,
  exportedAt: nowIso(),
  data: readState()
});

export const importContent = async (
  payload: string | ContentExportPayload | Partial<ContentStoreState>,
  options: ImportContentOptions = {}
): Promise<ContentStoreState> => {
  const raw = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const data: Partial<ContentStoreState> =
    raw && typeof raw === 'object' && 'data' in raw
      ? (raw as ContentExportPayload).data
      : raw as Partial<ContentStoreState>;

  const sanitized = sanitizeState(data);
  const normalizedEntries: JournalEntryContent[] = [];

  for (const entry of sanitized.journalEntries) {
    const normalized = await normalizeJournalEntry(entry);
    normalizedEntries.push(normalized);
  }

  const nextState = options.merge
    ? setState(state => ({
        ...state,
        journalEntries: mergeJournalEntries(state.journalEntries, normalizedEntries),
        foodExperiences: mergeById(state.foodExperiences, sanitized.foodExperiences.map(normalizeFoodExperience)),
        readingList: mergeById(state.readingList, sanitized.readingList.map(normalizeReadingItem)),
        mapLocations: mergeById(state.mapLocations, sanitized.mapLocations.map(normalizeMapLocation)),
        mediaLibrary: mergeById(state.mediaLibrary, sanitized.mediaLibrary.map(normalizeMediaAsset)),
      }))
    : setState(() => ({
        version: CONTENT_STORE_VERSION,
        updatedAt: nowIso(),
        journalEntries: normalizedEntries,
        foodExperiences: sanitized.foodExperiences.map(normalizeFoodExperience),
        readingList: sanitized.readingList.map(normalizeReadingItem),
        mapLocations: sanitized.mapLocations.map(normalizeMapLocation),
        mediaLibrary: sanitized.mediaLibrary.map(normalizeMediaAsset),
      }));

  return nextState;
};

export const inspectContentStorage = () => {
  if (!isBrowser) {
    return {
      main: JSON.stringify(memoryState),
      backup1: null,
      backup2: null,
      version: CONTENT_STORE_VERSION,
      sizes: {
        main: JSON.stringify(memoryState).length,
        backup1: 0,
        backup2: 0,
      }
    };
  }

  const main = window.localStorage.getItem(STORAGE_KEY);
  const backup1 = window.localStorage.getItem(BACKUP_KEY);
  const backup2 = window.localStorage.getItem(BACKUP_2_KEY);
  const version = window.localStorage.getItem(VERSION_KEY) || CONTENT_STORE_VERSION;

  return {
    main,
    backup1,
    backup2,
    version,
    sizes: {
      main: main?.length || 0,
      backup1: backup1?.length || 0,
      backup2: backup2?.length || 0,
    }
  };
};

export const resetContentStore = (): ContentStoreState => {
  if (isBrowser) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(BACKUP_KEY);
    window.localStorage.removeItem(BACKUP_2_KEY);
    window.localStorage.removeItem(VERSION_KEY);
  }
  memoryState = createEmptyState();
  notify(memoryState);
  return memoryState;
};

export const recoverContentFromBackup = (): ContentStoreState => {
  if (!isBrowser) {
    return memoryState;
  }

  const backups = [BACKUP_KEY, BACKUP_2_KEY];
  for (const key of backups) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Partial<ContentStoreState>;
      const sanitized = sanitizeState(parsed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      window.localStorage.setItem(VERSION_KEY, CONTENT_STORE_VERSION);
      memoryState = sanitized;
      notify(memoryState);
      return memoryState;
    } catch (error) {
      console.warn(`Failed to recover from backup ${key}`, error);
    }
  }

  return memoryState;
};

export const forceContentMigration = (): ContentStoreState => {
  if (isBrowser) {
    window.localStorage.removeItem(VERSION_KEY);
  }
  const state = readState();
  notify(state);
  return state;
};
