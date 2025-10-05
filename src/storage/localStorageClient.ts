import { logger } from '@/lib/logger';

export interface StorageSnapshot {
  main: string | null;
  backup1: string | null;
  backup2: string | null;
  version: string | null;
}

export interface StorageWriteResult {
  success: boolean;
  bytes: number;
  quotaExceeded: boolean;
  error?: Error;
}

export interface LocalStorageClientConfig {
  storageKey: string;
  backupKeys: {
    primary: string;
    secondary: string;
  };
  versionKey: string;
  currentVersion: string;
}

export interface JsonLocalStorageClient<TValue> {
  read(): TValue | null;
  readRaw(): string | null;
  write(value: TValue): StorageWriteResult;
  writeRaw(payload: string): StorageWriteResult;
  getBackup(slot: 'primary' | 'secondary'): string | null;
  restoreFromBackup(slot: 'primary' | 'secondary'): TValue | null;
  snapshot(): StorageSnapshot;
  clear(): void;
  getVersion(): string | null;
  setVersion(version: string): void;
  clearVersion(): void;
}

const isQuotaExceededError = (error: unknown): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.code === 22;
  }

  return false;
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
};

export interface JsonLocalStorageClientOptions {
  storage?: Storage;
  logger?: Pick<typeof logger, 'error' | 'warn' | 'info' | 'debug'>;
}

export const createJsonLocalStorageClient = <TValue>(
  config: LocalStorageClientConfig,
  options?: JsonLocalStorageClientOptions,
): JsonLocalStorageClient<TValue> => {
  const activeLogger = options?.logger ?? logger;
  const activeStorage =
    options?.storage ??
    (typeof globalThis !== 'undefined' && 'localStorage' in globalThis
      ? (globalThis.localStorage as Storage)
      : undefined);

  const rotateBackupsIfChanged = (payload: string) => {
    if (!activeStorage) {
      return;
    }

    const existing = activeStorage.getItem(config.storageKey);
    if (!existing) {
      return;
    }

    if (existing === payload) {
      return;
    }

    const previousBackup = activeStorage.getItem(config.backupKeys.primary);
    if (previousBackup) {
      activeStorage.setItem(config.backupKeys.secondary, previousBackup);
    }
    activeStorage.setItem(config.backupKeys.primary, existing);
  };

  const writeRaw = (payload: string): StorageWriteResult => {
    if (!activeStorage) {
      return {
        success: false,
        bytes: payload.length,
        quotaExceeded: false,
        error: new Error('localStorage is unavailable'),
      };
    }

    try {
      rotateBackupsIfChanged(payload);
      activeStorage.setItem(config.storageKey, payload);
      activeStorage.setItem(config.versionKey, config.currentVersion);
      return { success: true, bytes: payload.length, quotaExceeded: false };
    } catch (error) {
      return {
        success: false,
        bytes: payload.length,
        quotaExceeded: isQuotaExceededError(error),
        error: toError(error),
      };
    }
  };

  const readRaw = (): string | null => {
    if (!activeStorage) {
      return null;
    }

    return activeStorage.getItem(config.storageKey);
  };

  const read = (): TValue | null => {
    const raw = readRaw();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as TValue;
    } catch (error) {
      activeLogger.error('❌ Échec du parsing des données stockées', error);
      return null;
    }
  };

  const write = (value: TValue): StorageWriteResult => {
    const payload = JSON.stringify(value);
    return writeRaw(payload);
  };

  const getBackup = (slot: 'primary' | 'secondary'): string | null => {
    const key = slot === 'primary' ? config.backupKeys.primary : config.backupKeys.secondary;
    if (!activeStorage) {
      return null;
    }

    return activeStorage.getItem(key);
  };

  const restoreFromBackup = (slot: 'primary' | 'secondary'): TValue | null => {
    const backup = getBackup(slot);
    if (!backup) {
      return null;
    }

    const writeResult = writeRaw(backup);
    if (!writeResult.success) {
      return null;
    }

    try {
      return JSON.parse(backup) as TValue;
    } catch (error) {
      activeLogger.error('❌ Échec du parsing des données de sauvegarde', error);
      return null;
    }
  };

  const snapshot = (): StorageSnapshot => ({
    main: readRaw(),
    backup1: getBackup('primary'),
    backup2: getBackup('secondary'),
    version: activeStorage ? activeStorage.getItem(config.versionKey) : null,
  });

  const clear = () => {
    if (!activeStorage) {
      return;
    }

    activeStorage.removeItem(config.storageKey);
    activeStorage.removeItem(config.backupKeys.primary);
    activeStorage.removeItem(config.backupKeys.secondary);
    activeStorage.removeItem(config.versionKey);
  };

  const getVersion = (): string | null => {
    if (!activeStorage) {
      return null;
    }

    return activeStorage.getItem(config.versionKey);
  };

  const setVersion = (version: string) => {
    if (!activeStorage) {
      return;
    }

    activeStorage.setItem(config.versionKey, version);
  };

  const clearVersion = () => {
    if (!activeStorage) {
      return;
    }

    activeStorage.removeItem(config.versionKey);
  };

  return {
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
