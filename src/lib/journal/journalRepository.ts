import type {
  ContentRepository,
  ImportableRepository,
  RecoverableRepository,
  ResettableRepository,
} from '@/repositories/ContentRepository';
import {
  createJsonLocalStorageClient,
  type JsonLocalStorageClient,
  type StorageSnapshot,
  type StorageWriteResult,
} from '@/storage/localStorageClient';
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
import { logger as defaultLogger } from '@/lib/logger';

export type JournalEntry = PersistedJournalEntry;

export interface JournalStats {
  totalEntries: number;
  minDay: number;
  maxDay: number;
  days: number[];
  storageVersion: string;
  hasBackups: boolean;
}

export interface JournalRepositoryDependencies {
  storageClient: JsonLocalStorageClient<PersistedJournalEntry[]>;
  normalizePhotos: typeof normalizePhotosForPersistence;
  migrations: {
    bootstrapJournalStorage: typeof bootstrapJournalStorage;
    ensureStorageVersion: typeof ensureStorageVersion;
    recoverEntriesFromBackups: typeof recoverEntriesFromBackups;
    registerImportedEntries: typeof registerImportedEntries;
    resetJournalStorage: typeof resetJournalStorage;
    validatePersistedEntries: typeof validatePersistedEntries;
  };
  contentStore: {
    markJournalDayAsCustom: typeof markJournalDayAsCustom;
    syncJournalSources: typeof syncJournalSources;
  };
  logger: typeof defaultLogger;
}

export interface JournalRepositoryInstance {
  saveJournalEntries: (entries: PersistedJournalEntry[]) => Promise<boolean>;
  loadJournalEntries: () => PersistedJournalEntry[];
  addJournalEntry: (entry: PersistedJournalEntry) => Promise<boolean>;
  updateJournalEntry: (entry: PersistedJournalEntry) => Promise<boolean>;
  recoverFromBackup: () => PersistedJournalEntry[];
  getJournalStats: () => JournalStats;
  importEntries: (
    data: { entries: PersistedJournalEntry[] },
  ) => Promise<{ success: boolean; imported?: number; error?: string }>;
  resetStorage: () => PersistedJournalEntry[];
  diagnosticTools: {
    inspectStorage: () => StorageSnapshot;
    forceMigration: () => PersistedJournalEntry[];
    resetStorage: () => PersistedJournalEntry[];
    recoverFromBackup: () => PersistedJournalEntry[];
    exportAll: () => {
      timestamp: string;
      entries: PersistedJournalEntry[];
      stats: JournalStats;
      storage: StorageSnapshot;
      metadata: { version: string; totalEntries: number; entryDays: number[] };
    };
    importData: (
      data: { entries: PersistedJournalEntry[] },
    ) => Promise<{ success: boolean; imported?: number; error?: string }>;
  };
  repository: ContentRepository<JournalEntry, JournalStats> &
    RecoverableRepository<JournalEntry> &
    ImportableRepository<JournalEntry> &
    ResettableRepository;
}

const createStorageClient = () =>
  createJsonLocalStorageClient<PersistedJournalEntry[]>({
    storageKey: JOURNAL_STORAGE_KEY,
    backupKeys: {
      primary: JOURNAL_BACKUP_KEY,
      secondary: JOURNAL_SECONDARY_BACKUP_KEY,
    },
    versionKey: JOURNAL_VERSION_KEY,
    currentVersion: JOURNAL_STORAGE_VERSION,
  });

const toSortedEntries = (entries: PersistedJournalEntry[]) =>
  [...entries].sort((a, b) => a.day - b.day);

export const createJournalRepository = (
  dependencies: JournalRepositoryDependencies,
): JournalRepositoryInstance => {
  const { storageClient, normalizePhotos, migrations, contentStore, logger } =
    dependencies;

  const logWriteResult = (result: StorageWriteResult): void => {
    if (!result.success) {
      if (result.quotaExceeded) {
        logger.warn(
          '⚠️ Quota localStorage dépassé lors de la sauvegarde des entrées du journal',
        );
      }

      if (result.error) {
        logger.error('❌ Erreur lors de la sauvegarde des entrées du journal', result.error);
      }
    }
  };

  const persistEntries = async (
    entries: PersistedJournalEntry[],
    { normalizePhotos: shouldNormalize }: { normalizePhotos: boolean },
  ): Promise<boolean> => {
    const entriesToPersist = shouldNormalize
      ? await normalizePhotos(entries)
      : entries;

    const sortedEntries = toSortedEntries(entriesToPersist);
    const result = storageClient.write(sortedEntries);
    logWriteResult(result);

    if (!result.success) {
      return false;
    }

    contentStore.syncJournalSources(sortedEntries);
    return true;
  };

  const parseStoredEntries = (
    raw: string,
  ): PersistedJournalEntry[] | null => {
    try {
      const parsed = JSON.parse(raw);
      const validEntries = migrations.validatePersistedEntries(parsed);

      if (!Array.isArray(parsed)) {
        return null;
      }

      if (validEntries.length !== parsed.length) {
        logger.warn('⚠️ Entrées corrompues détectées lors de la lecture', {
          corrupted: parsed.length - validEntries.length,
        });
        void persistEntries(validEntries, { normalizePhotos: false });
      }

      return validEntries;
    } catch (error) {
      logger.error(
        '❌ Format de données invalide dans le localStorage, tentative de récupération',
        error,
      );
      return null;
    }
  };

  const loadJournalEntries = (): PersistedJournalEntry[] => {
    migrations.bootstrapJournalStorage();

    const raw = storageClient.readRaw();
    if (!raw) {
      migrations.ensureStorageVersion(storageClient);
      return [];
    }

    const parsedEntries = parseStoredEntries(raw);
    if (!parsedEntries) {
      return migrations.recoverEntriesFromBackups(storageClient);
    }

    migrations.ensureStorageVersion(storageClient);
    contentStore.syncJournalSources(parsedEntries);
    return parsedEntries;
  };

  const saveJournalEntries = async (
    entries: PersistedJournalEntry[],
  ): Promise<boolean> => {
    if (!Array.isArray(entries)) {
      logger.error("❌ Format d'entrées invalide (tableau requis)");
      return false;
    }

    const validatedEntries = migrations.validatePersistedEntries(entries);
    if (validatedEntries.length === 0) {
      logger.warn('⚠️ Aucune entrée valide à enregistrer');
      return false;
    }

    return persistEntries(validatedEntries, { normalizePhotos: true });
  };

  const recoverFromBackup = (): PersistedJournalEntry[] => {
    return migrations.recoverEntriesFromBackups(storageClient);
  };

  const addJournalEntry = async (
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
      contentStore.markJournalDayAsCustom(newEntry.day);
    }

    return success;
  };

  const updateJournalEntry = async (
    updatedEntry: PersistedJournalEntry,
  ): Promise<boolean> => {
    const currentEntries = loadJournalEntries();
    const existingIndex = currentEntries.findIndex((entry) => entry.day === updatedEntry.day);

    if (existingIndex >= 0) {
      const nextEntries = [...currentEntries];
      nextEntries[existingIndex] = updatedEntry;
      const success = await persistEntries(nextEntries, { normalizePhotos: true });
      if (success) {
        contentStore.markJournalDayAsCustom(updatedEntry.day);
      }
      return success;
    }

    return addJournalEntry(updatedEntry);
  };

  const getJournalStats = (): JournalStats => {
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

    const validEntries = migrations.validatePersistedEntries(data.entries);
    const success = await persistEntries(validEntries, { normalizePhotos: true });

    if (!success) {
      return { success: false, error: 'Save failed' };
    }

    migrations.registerImportedEntries(validEntries);
    return { success: true, imported: validEntries.length };
  };

  const forceMigration = () => {
    storageClient.clearVersion();
    migrations.bootstrapJournalStorage();
    return loadJournalEntries();
  };

  const resetStorage = () => {
    migrations.resetJournalStorage(storageClient);
    return loadJournalEntries();
  };

  const diagnosticTools = {
    inspectStorage: (): StorageSnapshot => storageClient.snapshot(),
    forceMigration,
    resetStorage,
    recoverFromBackup,
    exportAll: exportDiagnostics,
    importData: importEntries,
  };

  return {
    saveJournalEntries,
    loadJournalEntries,
    addJournalEntry,
    updateJournalEntry,
    recoverFromBackup,
    getJournalStats,
    importEntries,
    resetStorage,
    diagnosticTools,
    repository: {
      load: loadJournalEntries,
      save: saveJournalEntries,
      add: addJournalEntry,
      update: updateJournalEntry,
      stats: getJournalStats,
      recover: recoverFromBackup,
      importData: importEntries,
      reset: resetStorage,
    },
  };
};

const defaultRepository = createJournalRepository({
  storageClient: createStorageClient(),
  normalizePhotos: normalizePhotosForPersistence,
  migrations: {
    bootstrapJournalStorage,
    ensureStorageVersion,
    recoverEntriesFromBackups,
    registerImportedEntries,
    resetJournalStorage,
    validatePersistedEntries,
  },
  contentStore: {
    markJournalDayAsCustom,
    syncJournalSources,
  },
  logger: defaultLogger,
});

export const saveJournalEntries = defaultRepository.saveJournalEntries;
export const loadJournalEntries = defaultRepository.loadJournalEntries;
export const addJournalEntry = defaultRepository.addJournalEntry;
export const updateJournalEntry = defaultRepository.updateJournalEntry;
export const recoverFromBackup = defaultRepository.recoverFromBackup;
export const getJournalStats = defaultRepository.getJournalStats;
export const diagnosticTools = defaultRepository.diagnosticTools;

export const journalRepository: ContentRepository<JournalEntry, JournalStats> &
  RecoverableRepository<JournalEntry> &
  ImportableRepository<JournalEntry> &
  ResettableRepository = defaultRepository.repository;
