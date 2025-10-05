import type {
  ContentRepository,
  ImportableRepository,
  RecoverableRepository,
  ResettableRepository,
} from '@/repositories/ContentRepository';
import { createJsonLocalStorageClient } from '@/storage/localStorageClient';
import type { StorageSnapshot, StorageWriteResult } from '@/storage/localStorageClient';
import {
  JOURNAL_BACKUP_KEY,
  JOURNAL_SECONDARY_BACKUP_KEY,
  JOURNAL_STORAGE_KEY,
  JOURNAL_STORAGE_VERSION,
  JOURNAL_VERSION_KEY,
} from './constants';
import { normalizePhotosForPersistence } from './photoProcessing';
import {
  bootstrapJournalStorage,
  ensureStorageVersion,
  recoverEntriesFromBackups,
  registerImportedEntries,
  resetJournalStorage,
  validatePersistedEntries,
} from './journalMigrations';
import {
  markJournalDayAsCustom,
  syncJournalSources,
} from '@/lib/contentStore';
import type { PersistedJournalEntry } from '@/types/journal';

export type JournalEntry = PersistedJournalEntry;

export interface JournalStats {
  totalEntries: number;
  minDay: number;
  maxDay: number;
  days: number[];
  storageVersion: string;
  hasBackups: boolean;
}

const storageClient = createJsonLocalStorageClient<PersistedJournalEntry[]>({
  storageKey: JOURNAL_STORAGE_KEY,
  backupKeys: {
    primary: JOURNAL_BACKUP_KEY,
    secondary: JOURNAL_SECONDARY_BACKUP_KEY,
  },
  versionKey: JOURNAL_VERSION_KEY,
  currentVersion: JOURNAL_STORAGE_VERSION,
});

const logWriteResult = (result: StorageWriteResult): void => {
  if (!result.success) {
    if (result.quotaExceeded) {
      console.warn('⚠️ localStorage quota exceeded while saving journal entries');
    }

    if (result.error) {
      console.error('❌ Error saving journal entries:', result.error);
    }
  }
};

const persistEntries = async (
  entries: PersistedJournalEntry[],
  { normalizePhotos }: { normalizePhotos: boolean },
): Promise<boolean> => {
  const entriesToPersist = normalizePhotos
    ? await normalizePhotosForPersistence(entries)
    : entries;

  const sortedEntries = [...entriesToPersist].sort((a, b) => a.day - b.day);
  const result = storageClient.write(sortedEntries);
  logWriteResult(result);

  if (!result.success) {
    return false;
  }

  syncJournalSources(sortedEntries);
  return true;
};

export const saveJournalEntries = async (
  entries: PersistedJournalEntry[],
): Promise<boolean> => {
  if (!Array.isArray(entries)) {
    console.error('❌ Invalid entries format (not array)');
    return false;
  }

  const validatedEntries = validatePersistedEntries(entries);
  if (validatedEntries.length === 0) {
    console.warn('⚠️ No valid entries to save');
    return false;
  }

  return persistEntries(validatedEntries, { normalizePhotos: true });
};

const parseStoredEntries = (raw: string): PersistedJournalEntry[] | null => {
  try {
    const parsed = JSON.parse(raw);
    const validEntries = validatePersistedEntries(parsed);

    if (!Array.isArray(parsed)) {
      return null;
    }

    if (validEntries.length !== parsed.length) {
      console.warn(
        `⚠️ Found ${parsed.length - validEntries.length} corrupted entries, using valid ones only`,
      );
      void persistEntries(validEntries, { normalizePhotos: false });
    }

    return validEntries;
  } catch (error) {
    console.error('❌ Invalid data format in localStorage, attempting recovery');
    return null;
  }
};

export const loadJournalEntries = (): PersistedJournalEntry[] => {
  bootstrapJournalStorage();

  const raw = storageClient.readRaw();
  if (!raw) {
    ensureStorageVersion(storageClient);
    return [];
  }

  const parsedEntries = parseStoredEntries(raw);
  if (!parsedEntries) {
    return recoverEntriesFromBackups(storageClient);
  }

  ensureStorageVersion(storageClient);
  syncJournalSources(parsedEntries);
  return parsedEntries;
};

export const recoverFromBackup = (): PersistedJournalEntry[] => {
  return recoverEntriesFromBackups(storageClient);
};

export const addJournalEntry = async (
  newEntry: PersistedJournalEntry,
): Promise<boolean> => {
  const currentEntries = loadJournalEntries();
  const existingIndex = currentEntries.findIndex((entry) => entry.day === newEntry.day);

  let updatedEntries: PersistedJournalEntry[];
  if (existingIndex >= 0) {
    updatedEntries = [...currentEntries];
    updatedEntries[existingIndex] = newEntry;
  } else {
    updatedEntries = [...currentEntries, newEntry];
  }

  const success = await persistEntries(updatedEntries, { normalizePhotos: true });
  if (success) {
    markJournalDayAsCustom(newEntry.day);
  }

  return success;
};

export const updateJournalEntry = async (
  updatedEntry: PersistedJournalEntry,
): Promise<boolean> => {
  const currentEntries = loadJournalEntries();
  const existingIndex = currentEntries.findIndex((entry) => entry.day === updatedEntry.day);

  if (existingIndex >= 0) {
    const updatedEntries = [...currentEntries];
    updatedEntries[existingIndex] = updatedEntry;
    const success = await persistEntries(updatedEntries, { normalizePhotos: true });
    if (success) {
      markJournalDayAsCustom(updatedEntry.day);
    }
    return success;
  }

  return addJournalEntry(updatedEntry);
};

export const getJournalStats = (): JournalStats => {
  const entries = loadJournalEntries();
  const days = entries.map((entry) => entry.day).sort((a, b) => a - b);
  const snapshot = storageClient.snapshot();

  return {
    totalEntries: entries.length,
    minDay: days.length > 0 ? days[0] : 0,
    maxDay: days.length > 0 ? days[days.length - 1] : 0,
    days,
    storageVersion: snapshot.version ?? 'unknown',
    hasBackups: Boolean(snapshot.backup1 && snapshot.backup2),
  };
};

const exportDiagnostics = () => {
  const snapshot = storageClient.snapshot();
  const entries = loadJournalEntries();
  const stats = getJournalStats();

  return {
    timestamp: new Date().toISOString(),
    entries,
    stats,
    storage: snapshot,
    metadata: {
      version: JOURNAL_STORAGE_VERSION,
      totalEntries: entries.length,
      entryDays: entries.map((entry) => entry.day),
    },
  };
};

const importEntries = async (data: { entries: PersistedJournalEntry[] }) => {
  if (!data.entries || !Array.isArray(data.entries)) {
    return { success: false, error: 'Invalid data format' };
  }

  const validEntries = validatePersistedEntries(data.entries);
  const success = await persistEntries(validEntries, { normalizePhotos: true });

  if (!success) {
    return { success: false, error: 'Save failed' };
  }

  registerImportedEntries(validEntries);
  return { success: true, imported: validEntries.length };
};

const forceMigration = () => {
  storageClient.clearVersion();
  bootstrapJournalStorage();
  return loadJournalEntries();
};

const resetStorage = () => {
  resetJournalStorage(storageClient);
  return loadJournalEntries();
};

export const diagnosticTools = {
  inspectStorage: (): StorageSnapshot => storageClient.snapshot(),
  forceMigration,
  resetStorage,
  recoverFromBackup,
  exportAll: exportDiagnostics,
  importData: importEntries,
};

export const journalRepository: ContentRepository<JournalEntry, JournalStats> &
  RecoverableRepository<JournalEntry> &
  ImportableRepository<JournalEntry> &
  ResettableRepository = {
    load: loadJournalEntries,
    save: saveJournalEntries,
    add: addJournalEntry,
    update: updateJournalEntry,
    stats: getJournalStats,
    recover: recoverFromBackup,
    importData: importEntries,
    reset: resetStorage,
  };
