import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  createJournalRepository,
  type JournalRepositoryDependencies,
} from '../journalRepository.ts';
import type { PersistedJournalEntry } from '../../../types/journal.ts';
import type {
  JsonLocalStorageClient,
  StorageSnapshot,
  StorageWriteResult,
} from '../../../storage/localStorageClient.ts';
import { createMockFn } from '../../../../test/utils/mockFn.ts';

type JournalStorageClient = JsonLocalStorageClient<PersistedJournalEntry[]>;

const createEntry = (day: number, title = `Day ${day}`): PersistedJournalEntry => ({
  day,
  date: `2024-01-${String(day).padStart(2, '0')}`,
  title,
  location: 'Paris',
  story: `Story ${day}`,
  mood: 'happy',
  photos: [],
});

const defaultWriteResult: StorageWriteResult = {
  success: true,
  quotaExceeded: false,
  bytes: 0,
};

const defaultSnapshot: StorageSnapshot = {
  main: null,
  backup1: null,
  backup2: null,
  version: null,
};

const createStorageClientStub = () => {
  const read = createMockFn<[], PersistedJournalEntry[] | null>();
  read.mockReturnValue(null);
  const readRaw = createMockFn<[], string | null>();
  readRaw.mockReturnValue(null);
  const write = createMockFn<[PersistedJournalEntry[]], StorageWriteResult>();
  write.mockReturnValue(defaultWriteResult);
  const writeRaw = createMockFn<[string], StorageWriteResult>();
  writeRaw.mockReturnValue(defaultWriteResult);
  const getBackup = createMockFn<['primary' | 'secondary'], string | null>();
  getBackup.mockReturnValue(null);
  const restoreFromBackup = createMockFn<
    ['primary' | 'secondary'],
    PersistedJournalEntry[] | null
  >();
  restoreFromBackup.mockReturnValue(null);
  const snapshot = createMockFn<[], StorageSnapshot>();
  snapshot.mockReturnValue(defaultSnapshot);
  const clear = createMockFn<[], void>();
  const getVersion = createMockFn<[], string | null>();
  getVersion.mockReturnValue(null);
  const setVersion = createMockFn<[string], void>();
  const clearVersion = createMockFn<[], void>();

  const client: JournalStorageClient = {
    read: () => read(),
    readRaw: () => readRaw(),
    write: (value) => write(value),
    writeRaw: (payload) => writeRaw(payload),
    getBackup: (slot) => getBackup(slot),
    restoreFromBackup: (slot) => restoreFromBackup(slot),
    snapshot: () => snapshot(),
    clear: () => clear(),
    getVersion: () => getVersion(),
    setVersion: (version) => setVersion(version),
    clearVersion: () => clearVersion(),
  };

  return {
    client,
    read,
    readRaw,
    write,
    writeRaw,
    getBackup,
    restoreFromBackup,
    snapshot,
    clear,
    getVersion,
    setVersion,
    clearVersion,
  };
};

const createDependencies = () => {
  const storage = createStorageClientStub();
  const normalizePhotos = createMockFn<
    [PersistedJournalEntry[]],
    Promise<PersistedJournalEntry[]>
  >();
  normalizePhotos.mockImplementation(async (entries) => entries);

  const migrations = {
    bootstrapJournalStorage: createMockFn<[], void>(),
    ensureStorageVersion: createMockFn<[JournalStorageClient], void>(),
    recoverEntriesFromBackups: createMockFn<
      [JournalStorageClient],
      PersistedJournalEntry[]
    >(),
    registerImportedEntries: createMockFn<[PersistedJournalEntry[]], void>(),
    resetJournalStorage: createMockFn<[JournalStorageClient], void>(),
    validatePersistedEntries: createMockFn<[unknown], PersistedJournalEntry[]>(),
  } satisfies JournalRepositoryDependencies['migrations'];

  migrations.recoverEntriesFromBackups.mockReturnValue([]);
  migrations.validatePersistedEntries.mockImplementation((value) =>
    Array.isArray(value) ? (value as PersistedJournalEntry[]) : [],
  );

  const contentStore = {
    markJournalDayAsCustom: createMockFn<[number], void>(),
    syncJournalSources: createMockFn<[PersistedJournalEntry[]], void>(),
  } satisfies JournalRepositoryDependencies['contentStore'];

  const logger = {
    error: createMockFn<[string, unknown?], void>(),
    warn: createMockFn<[string, unknown?], void>(),
    info: createMockFn<[string, unknown?], void>(),
    debug: createMockFn<[string, unknown?], void>(),
  } satisfies JournalRepositoryDependencies['logger'];

  const repository = createJournalRepository({
    storageClient: storage.client,
    normalizePhotos: (entries) => normalizePhotos(entries),
    migrations,
    contentStore,
    logger,
  });

  return { repository, storage, migrations, contentStore, logger, normalizePhotos };
};

describe('journalRepository.saveJournalEntries', () => {
  let dependencies: ReturnType<typeof createDependencies>;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it('rejects non-array payloads', async () => {
    const result = await dependencies.repository.saveJournalEntries(
      null as unknown as PersistedJournalEntry[],
    );

    assert.strictEqual(result, false);
    assert.strictEqual(dependencies.logger.error.calls.length, 1);
    const [message] = dependencies.logger.error.calls[0] ?? [];
    assert.ok(typeof message === 'string' && message.includes('Format d'));
    assert.strictEqual(dependencies.storage.write.calls.length, 0);
  });

  it('skips persistence when no entries remain after validation', async () => {
    dependencies.migrations.validatePersistedEntries.mockReturnValue([]);

    const result = await dependencies.repository.saveJournalEntries([createEntry(1)]);

    assert.strictEqual(result, false);
    assert.strictEqual(dependencies.logger.warn.calls.length, 1);
    assert.strictEqual(dependencies.storage.write.calls.length, 0);
  });

  it('normalizes, sorts and persists entries when storage succeeds', async () => {
    const first = createEntry(5, 'Late');
    const second = createEntry(2, 'Early');

    const result = await dependencies.repository.saveJournalEntries([first, second]);

    assert.strictEqual(result, true);
    assert.strictEqual(dependencies.normalizePhotos.calls.length, 1);
    assert.deepEqual(dependencies.normalizePhotos.calls[0], [[first, second]]);
    assert.strictEqual(dependencies.storage.write.calls.length, 1);
    assert.deepEqual(dependencies.storage.write.calls[0], [[second, first]]);
    assert.strictEqual(dependencies.contentStore.syncJournalSources.calls.length, 1);
    assert.deepEqual(dependencies.contentStore.syncJournalSources.calls[0], [[second, first]]);
  });

  it('returns false when storage write fails', async () => {
    dependencies.storage.write.mockReturnValueOnce({
      success: false,
      quotaExceeded: false,
      bytes: 0,
    });

    const result = await dependencies.repository.saveJournalEntries([createEntry(3)]);

    assert.strictEqual(result, false);
    assert.strictEqual(dependencies.contentStore.syncJournalSources.calls.length, 0);
  });
});

describe('journalRepository.loadJournalEntries', () => {
  let dependencies: ReturnType<typeof createDependencies>;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it('returns an empty array when nothing is stored', () => {
    const entries = dependencies.repository.loadJournalEntries();

    assert.deepEqual(entries, []);
    assert.strictEqual(dependencies.migrations.ensureStorageVersion.calls.length, 1);
    assert.strictEqual(
      dependencies.migrations.ensureStorageVersion.calls[0]?.[0],
      dependencies.storage.client,
    );
    assert.strictEqual(dependencies.contentStore.syncJournalSources.calls.length, 0);
  });

  it('recovers from backups when parsing fails', () => {
    const recovered = [createEntry(7)];
    dependencies.storage.readRaw.mockReturnValueOnce('not-json');
    dependencies.migrations.recoverEntriesFromBackups.mockReturnValueOnce(recovered);

    const entries = dependencies.repository.loadJournalEntries();

    assert.strictEqual(entries, recovered);
    assert.strictEqual(dependencies.migrations.recoverEntriesFromBackups.calls.length, 1);
    assert.strictEqual(
      dependencies.migrations.recoverEntriesFromBackups.calls[0]?.[0],
      dependencies.storage.client,
    );
    assert.strictEqual(dependencies.contentStore.syncJournalSources.calls.length, 0);
  });
});

describe('journalRepository.addJournalEntry', () => {
  let dependencies: ReturnType<typeof createDependencies>;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it('persists the new entry and marks the day as custom', async () => {
    dependencies.storage.readRaw.mockReturnValueOnce(JSON.stringify([]));

    const entry = createEntry(4, 'New entry');
    const success = await dependencies.repository.addJournalEntry(entry);

    assert.strictEqual(success, true);
    assert.deepEqual(dependencies.storage.write.calls.at(-1), [[entry]]);
    assert.deepEqual(dependencies.contentStore.markJournalDayAsCustom.calls.at(-1), [4]);
  });

  it('replaces an existing entry when the day already exists', async () => {
    const existing = createEntry(10, 'Existing');
    dependencies.storage.readRaw.mockReturnValueOnce(JSON.stringify([existing]));

    const updated = { ...existing, story: 'Updated story' };
    const success = await dependencies.repository.addJournalEntry(updated);

    assert.strictEqual(success, true);
    assert.deepEqual(dependencies.storage.write.calls.at(-1), [[updated]]);
    assert.deepEqual(dependencies.contentStore.markJournalDayAsCustom.calls.at(-1), [10]);
  });
});
