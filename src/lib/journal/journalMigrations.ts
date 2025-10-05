import {
  clearContentStoreState,
  getCanonicalJournalEntries,
  initializeContentStore,
  registerImportedJournalEntries,
  syncJournalSources,
} from '@/lib/contentStore';
import type { PersistedJournalEntry } from '@/types/journal';
import type { JsonLocalStorageClient } from '@/storage/localStorageClient';
import { JOURNAL_STORAGE_VERSION } from './constants';

export const bootstrapJournalStorage = () => {
  initializeContentStore();
};

export const validatePersistedEntries = (
  value: unknown,
): PersistedJournalEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is PersistedJournalEntry => {
    if (!entry) {
      return false;
    }

    return (
      typeof entry.day === 'number' &&
      typeof entry.title === 'string' &&
      typeof entry.date === 'string' &&
      typeof entry.location === 'string' &&
      typeof entry.story === 'string' &&
      typeof entry.mood === 'string'
    );
  });
};

export const recoverEntriesFromBackups = (
  client: JsonLocalStorageClient<PersistedJournalEntry[]>,
): PersistedJournalEntry[] => {
  const tryRestore = (slot: 'primary' | 'secondary'): PersistedJournalEntry[] | null => {
    const restored = client.restoreFromBackup(slot);
    if (!restored || restored.length === 0) {
      return null;
    }

    syncJournalSources(restored);
    return restored;
  };

  const primary = tryRestore('primary');
  if (primary) {
    console.log('✅ Successfully recovered from backup 1:', primary.length, 'entries');
    return primary;
  }

  const secondary = tryRestore('secondary');
  if (secondary) {
    console.log('✅ Successfully recovered from backup 2:', secondary.length, 'entries');
    return secondary;
  }

  console.log('📦 Using canonical entries as last resort');
  const canonicalEntries = getCanonicalJournalEntries().map(({ source, ...rest }) => rest);
  void client.write(canonicalEntries);
  syncJournalSources(canonicalEntries);
  return canonicalEntries;
};

export const resetJournalStorage = (
  client: JsonLocalStorageClient<PersistedJournalEntry[]>,
) => {
  client.clear();
  clearContentStoreState();
  bootstrapJournalStorage();
};

export const ensureStorageVersion = (
  client: JsonLocalStorageClient<PersistedJournalEntry[]>,
) => {
  const version = client.getVersion();
  if (!version) {
    client.setVersion(JOURNAL_STORAGE_VERSION);
  }
};

export const registerImportedEntries = (
  entries: PersistedJournalEntry[],
) => {
  registerImportedJournalEntries(entries);
};

