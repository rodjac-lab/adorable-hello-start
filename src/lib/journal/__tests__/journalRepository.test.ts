import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PersistedJournalEntry } from '@/types/journal';

const writeMock = vi.fn();
const readRawMock = vi.fn();
const snapshotMock = vi.fn();
const restoreFromBackupMock = vi.fn();
const getBackupMock = vi.fn();
const clearMock = vi.fn();
const getVersionMock = vi.fn();
const setVersionMock = vi.fn();
const clearVersionMock = vi.fn();
const readMock = vi.fn();

const storageClientMock = {
  read: readMock,
  readRaw: readRawMock,
  write: writeMock,
  writeRaw: vi.fn(),
  getBackup: getBackupMock,
  restoreFromBackup: restoreFromBackupMock,
  snapshot: snapshotMock,
  clear: clearMock,
  getVersion: getVersionMock,
  setVersion: setVersionMock,
  clearVersion: clearVersionMock,
};

const createJsonLocalStorageClientMock = vi.fn(() => storageClientMock);

const normalizePhotosForPersistenceMock = vi.fn();
const bootstrapJournalStorageMock = vi.fn();
const ensureStorageVersionMock = vi.fn();
const recoverEntriesFromBackupsMock = vi.fn();
const registerImportedEntriesMock = vi.fn();
const resetJournalStorageMock = vi.fn();
const validatePersistedEntriesMock = vi.fn();
const syncJournalSourcesMock = vi.fn();
const markJournalDayAsCustomMock = vi.fn();
const loggerErrorMock = vi.fn();
const loggerWarnMock = vi.fn();
const loggerInfoMock = vi.fn();
const loggerDebugMock = vi.fn();

vi.mock('@/storage/localStorageClient', () => ({
  createJsonLocalStorageClient: createJsonLocalStorageClientMock,
}));

vi.mock('../photoProcessing', () => ({
  normalizePhotosForPersistence: normalizePhotosForPersistenceMock,
}));

vi.mock('../journalMigrations', () => ({
  bootstrapJournalStorage: bootstrapJournalStorageMock,
  ensureStorageVersion: ensureStorageVersionMock,
  recoverEntriesFromBackups: recoverEntriesFromBackupsMock,
  registerImportedEntries: registerImportedEntriesMock,
  resetJournalStorage: resetJournalStorageMock,
  validatePersistedEntries: validatePersistedEntriesMock,
}));

vi.mock('@/lib/contentStore', () => ({
  syncJournalSources: syncJournalSourcesMock,
  markJournalDayAsCustom: markJournalDayAsCustomMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: loggerWarnMock,
    info: loggerInfoMock,
    debug: loggerDebugMock,
  },
}));

// Import after mocks so the repository picks up the stubbed dependencies.
import {
  addJournalEntry,
  loadJournalEntries,
  saveJournalEntries,
} from '../journalRepository';

const createEntry = (day: number, title = `Day ${day}`): PersistedJournalEntry => ({
  day,
  date: `2024-01-${String(day).padStart(2, '0')}`,
  title,
  location: 'Paris',
  story: `Story ${day}`,
  mood: 'happy',
  photos: [],
});

const defaultSnapshot = {
  main: null,
  backup1: null,
  backup2: null,
  version: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  writeMock.mockReturnValue({ success: true, bytes: 100, quotaExceeded: false });
  readRawMock.mockReturnValue(null);
  snapshotMock.mockReturnValue(defaultSnapshot);
  normalizePhotosForPersistenceMock.mockImplementation(async (entries: PersistedJournalEntry[]) => entries);
  validatePersistedEntriesMock.mockImplementation((entries: PersistedJournalEntry[]) => entries);
  recoverEntriesFromBackupsMock.mockReturnValue([]);
});

describe('journalRepository.saveJournalEntries', () => {
  it('rejects non-array payloads', async () => {
    const result = await saveJournalEntries(null as unknown as PersistedJournalEntry[]);

    expect(result).toBe(false);
    expect(loggerErrorMock).toHaveBeenCalledWith(expect.stringContaining('Format d\'entrées invalide'));
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('skips persistence when no entries remain after validation', async () => {
    validatePersistedEntriesMock.mockReturnValue([]);

    const result = await saveJournalEntries([createEntry(1)]);

    expect(result).toBe(false);
    expect(loggerWarnMock).toHaveBeenCalledWith(expect.stringContaining('Aucune entrée valide'));
    expect(writeMock).not.toHaveBeenCalled();
  });

  it('normalizes, sorts and persists entries when storage succeeds', async () => {
    const first = createEntry(5, 'Late');
    const second = createEntry(2, 'Early');

    const result = await saveJournalEntries([first, second]);

    expect(result).toBe(true);
    expect(normalizePhotosForPersistenceMock).toHaveBeenCalledWith([first, second]);
    expect(writeMock).toHaveBeenCalledWith([second, first]);
    expect(syncJournalSourcesMock).toHaveBeenCalledWith([second, first]);
  });

  it('returns false when storage write fails', async () => {
    writeMock.mockReturnValueOnce({ success: false, bytes: 42, quotaExceeded: false });

    const result = await saveJournalEntries([createEntry(3)]);

    expect(result).toBe(false);
    expect(syncJournalSourcesMock).not.toHaveBeenCalled();
  });
});

describe('journalRepository.loadJournalEntries', () => {
  it('returns an empty array when nothing is stored', () => {
    const entries = loadJournalEntries();

    expect(entries).toEqual([]);
    expect(ensureStorageVersionMock).toHaveBeenCalledWith(storageClientMock);
    expect(syncJournalSourcesMock).not.toHaveBeenCalled();
  });

  it('recovers from backups when parsing fails', () => {
    readRawMock.mockReturnValueOnce('not-json');
    const recovered = [createEntry(7)];
    recoverEntriesFromBackupsMock.mockReturnValueOnce(recovered);

    const entries = loadJournalEntries();

    expect(entries).toBe(recovered);
    expect(recoverEntriesFromBackupsMock).toHaveBeenCalledWith(storageClientMock);
    expect(syncJournalSourcesMock).not.toHaveBeenCalled();
  });
});

describe('journalRepository.addJournalEntry', () => {
  it('persists the new entry and marks the day as custom', async () => {
    readRawMock.mockImplementationOnce(() => JSON.stringify([]));

    const entry = createEntry(4, 'New entry');
    const success = await addJournalEntry(entry);

    expect(success).toBe(true);
    expect(writeMock).toHaveBeenCalledWith([entry]);
    expect(markJournalDayAsCustomMock).toHaveBeenCalledWith(4);
  });

  it('replaces an existing entry when the day already exists', async () => {
    const existing = createEntry(10, 'Existing');
    readRawMock.mockImplementationOnce(() => JSON.stringify([existing]));

    const updated = { ...existing, story: 'Updated story' };
    const success = await addJournalEntry(updated);

    expect(success).toBe(true);
    expect(writeMock).toHaveBeenCalledWith([updated]);
    expect(markJournalDayAsCustomMock).toHaveBeenCalledWith(10);
  });
});
