import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createJsonLocalStorageClient } from '../localStorageClient.ts';
import type { JsonLocalStorageClientOptions } from '../localStorageClient.ts';
import { createMockFn } from '../../../test/utils/mockFn.ts';

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

const createLoggerMocks = () => {
  const error = createMockFn<[string, unknown?], void>();
  const warn = createMockFn<[string, unknown?], void>();
  const info = createMockFn<[string, unknown?], void>();
  const debug = createMockFn<[string, unknown?], void>();

  return { error, warn, info, debug };
};

const createOptions = (overrides?: Partial<JsonLocalStorageClientOptions>) => {
  const storage = createFakeStorage();
  const logger = createLoggerMocks();

  return {
    storage,
    logger,
    ...overrides,
  } satisfies JsonLocalStorageClientOptions & {
    storage: MutableStorage;
    logger: ReturnType<typeof createLoggerMocks>;
  };
};

describe('createJsonLocalStorageClient', () => {
  let options: ReturnType<typeof createOptions>;

  beforeEach(() => {
    options = createOptions();
  });

  afterEach(() => {
    options.logger.error.mockClear();
    options.logger.warn.mockClear();
    options.logger.info.mockClear();
    options.logger.debug.mockClear();
  });

  it('persists the value and bumps the storage version on write', () => {
    const client = createJsonLocalStorageClient<string[]>(config, options);

    const result = client.write(['one', 'two']);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.quotaExceeded, false);
    assert.ok(result.bytes > 0);
    assert.strictEqual(options.storage.getItem(config.storageKey), JSON.stringify(['one', 'two']));
    assert.strictEqual(options.storage.getItem(config.versionKey), config.currentVersion);
  });

  it('rotates backups when the persisted payload changes', () => {
    const client = createJsonLocalStorageClient<string[]>(config, options);

    client.write(['initial']);
    client.write(['updated']);
    client.write(['latest']);

    assert.strictEqual(options.storage.getItem(config.storageKey), JSON.stringify(['latest']));
    assert.strictEqual(options.storage.getItem(config.backupKeys.primary), JSON.stringify(['updated']));
    assert.strictEqual(options.storage.getItem(config.backupKeys.secondary), JSON.stringify(['initial']));
  });

  it('restores and parses entries from the selected backup slot', () => {
    const client = createJsonLocalStorageClient<string[]>(config, options);

    options.storage.setItem(config.storageKey, JSON.stringify(['current']));
    options.storage.setItem(config.backupKeys.primary, JSON.stringify(['primary-backup']));

    const restored = client.restoreFromBackup('primary');

    assert.deepEqual(restored, ['primary-backup']);
    assert.strictEqual(options.storage.getItem(config.storageKey), JSON.stringify(['primary-backup']));
  });

  it('logs and returns null when parsing stored data fails', () => {
    const client = createJsonLocalStorageClient<string[]>(config, options);
    options.storage.setItem(config.storageKey, '{invalid-json');

    const result = client.read();

    assert.strictEqual(result, null);
    assert.strictEqual(options.logger.error.calls.length, 1);
    const [message] = options.logger.error.calls[0] ?? [];
    assert.ok(typeof message === 'string' && message.includes('Échec du parsing'));
  });

  it('propagates storage errors when setItem throws', () => {
    const quotaError = new Error('Quota exceeded');
    const failingStorage: MutableStorage = {
      ...createFakeStorage(),
      setItem: () => {
        throw quotaError;
      },
    } as MutableStorage;

    const client = createJsonLocalStorageClient<string[]>(config, {
      ...options,
      storage: failingStorage,
    });

    const result = client.write(['value']);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, quotaError);
  });

  it('fails gracefully when localStorage is unavailable', () => {
    const client = createJsonLocalStorageClient<string[]>(config, {
      logger: options.logger,
    });

    const result = client.write(['value']);

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.message, 'localStorage is unavailable');
    assert.strictEqual(client.read(), null);
  });
});
