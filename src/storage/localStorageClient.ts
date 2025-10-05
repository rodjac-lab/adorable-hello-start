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

export const createJsonLocalStorageClient = <TValue>(
  config: LocalStorageClientConfig,
): JsonLocalStorageClient<TValue> => {
  const rotateBackupsIfChanged = (payload: string) => {
    const existing = localStorage.getItem(config.storageKey);
    if (!existing) {
      return;
    }

    if (existing === payload) {
      return;
    }

    const previousBackup = localStorage.getItem(config.backupKeys.primary);
    if (previousBackup) {
      localStorage.setItem(config.backupKeys.secondary, previousBackup);
    }
    localStorage.setItem(config.backupKeys.primary, existing);
  };

  const writeRaw = (payload: string): StorageWriteResult => {
    try {
      rotateBackupsIfChanged(payload);
      localStorage.setItem(config.storageKey, payload);
      localStorage.setItem(config.versionKey, config.currentVersion);
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
    return localStorage.getItem(config.storageKey);
  };

  const read = (): TValue | null => {
    const raw = readRaw();
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as TValue;
    } catch (error) {
      logger.error('❌ Échec du parsing des données stockées', error);
      return null;
    }
  };

  const write = (value: TValue): StorageWriteResult => {
    const payload = JSON.stringify(value);
    return writeRaw(payload);
  };

  const getBackup = (slot: 'primary' | 'secondary'): string | null => {
    const key = slot === 'primary' ? config.backupKeys.primary : config.backupKeys.secondary;
    return localStorage.getItem(key);
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
      logger.error('❌ Échec du parsing des données de sauvegarde', error);
      return null;
    }
  };

  const snapshot = (): StorageSnapshot => ({
    main: readRaw(),
    backup1: getBackup('primary'),
    backup2: getBackup('secondary'),
    version: localStorage.getItem(config.versionKey),
  });

  const clear = () => {
    localStorage.removeItem(config.storageKey);
    localStorage.removeItem(config.backupKeys.primary);
    localStorage.removeItem(config.backupKeys.secondary);
    localStorage.removeItem(config.versionKey);
  };

  const getVersion = (): string | null => {
    return localStorage.getItem(config.versionKey);
  };

  const setVersion = (version: string) => {
    localStorage.setItem(config.versionKey, version);
  };

  const clearVersion = () => {
    localStorage.removeItem(config.versionKey);
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
