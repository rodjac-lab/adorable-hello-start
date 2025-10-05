import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createJsonLocalStorageClient } from '../localStorageClient';

const loggerErrorMock = vi.fn();
const loggerWarnMock = vi.fn();
const loggerInfoMock = vi.fn();
const loggerDebugMock = vi.fn();

vi.mock('@/lib/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: loggerWarnMock,
    info: loggerInfoMock,
    debug: loggerDebugMock,
  },
}));

const config = {
  storageKey: 'journal',
  backupKeys: {
    primary: 'journal:backup:1',
    secondary: 'journal:backup:2',
  },
  versionKey: 'journal:version',
  currentVersion: '2',
};

type MutableStorage = Storage & {
  setItem: (key: string, value: string) => void;
};

const createFakeStorage = (): MutableStorage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => {
      return store.has(key) ? store.get(key)! : null;
    },
    key: (index: number) => {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as MutableStorage;
};

const setFailingStorage = (error: Error) => {
  const failingStorage: MutableStorage = {
    ...createFakeStorage(),
    setItem: () => {
      throw error;
    },
  };
  vi.stubGlobal('localStorage', failingStorage);
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('localStorage', createFakeStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createJsonLocalStorageClient', () => {
  it('persists the value and bumps the storage version on write', () => {
    const client = createJsonLocalStorageClient<string[]>(config);

    const result = client.write(['one', 'two']);

    expect(result).toMatchObject({ success: true, quotaExceeded: false });
    expect(globalThis.localStorage.getItem(config.storageKey)).toBe(JSON.stringify(['one', 'two']));
    expect(globalThis.localStorage.getItem(config.versionKey)).toBe(config.currentVersion);
  });

  it('rotates backups when the persisted payload changes', () => {
    const client = createJsonLocalStorageClient<string[]>(config);

    client.write(['initial']);
    client.write(['updated']);
    client.write(['latest']);

    expect(globalThis.localStorage.getItem(config.storageKey)).toBe(JSON.stringify(['latest']));
    expect(globalThis.localStorage.getItem(config.backupKeys.primary)).toBe(JSON.stringify(['updated']));
    expect(globalThis.localStorage.getItem(config.backupKeys.secondary)).toBe(JSON.stringify(['initial']));
  });

  it('restores and parses entries from the selected backup slot', () => {
    const client = createJsonLocalStorageClient<string[]>(config);

    globalThis.localStorage.setItem(config.storageKey, JSON.stringify(['current']));
    globalThis.localStorage.setItem(config.backupKeys.primary, JSON.stringify(['primary-backup']));

    const restored = client.restoreFromBackup('primary');

    expect(restored).toEqual(['primary-backup']);
    expect(globalThis.localStorage.getItem(config.storageKey)).toBe(JSON.stringify(['primary-backup']));
  });

  it('logs and returns null when parsing stored data fails', () => {
    const client = createJsonLocalStorageClient<string[]>(config);
    globalThis.localStorage.setItem(config.storageKey, '{invalid-json');

    const result = client.read();

    expect(result).toBeNull();
    expect(loggerErrorMock).toHaveBeenCalledWith('❌ Échec du parsing des données stockées', expect.any(Error));
  });

  it('propagates storage errors when setItem throws', () => {
    const quotaError = new Error('Quota exceeded');
    setFailingStorage(quotaError);
    const client = createJsonLocalStorageClient<string[]>(config);

    const result = client.write(['value']);

    expect(result.success).toBe(false);
    expect(result.error).toEqual(quotaError);
  });
});
