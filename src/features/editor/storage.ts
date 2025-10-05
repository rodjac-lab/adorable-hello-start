import { logger } from "@/lib/logger";
import {
  EDITOR_STORAGE_KEYS,
  EDITOR_STORAGE_VERSION,
  getEditorBackupKey,
  getEditorVersionKey,
} from "./constants";

export const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const STORAGE_BACKUPS: Record<string, { primary: string; secondary: string }> = {
  [EDITOR_STORAGE_KEYS.journal]: {
    primary: getEditorBackupKey("journal", "primary"),
    secondary: getEditorBackupKey("journal", "secondary"),
  },
  [EDITOR_STORAGE_KEYS.food]: {
    primary: getEditorBackupKey("food", "primary"),
    secondary: getEditorBackupKey("food", "secondary"),
  },
  [EDITOR_STORAGE_KEYS.books]: {
    primary: getEditorBackupKey("books", "primary"),
    secondary: getEditorBackupKey("books", "secondary"),
  },
  [EDITOR_STORAGE_KEYS.map]: {
    primary: getEditorBackupKey("map", "primary"),
    secondary: getEditorBackupKey("map", "secondary"),
  },
};

const STORAGE_VERSIONS: Record<string, string> = {
  [EDITOR_STORAGE_KEYS.journal]: getEditorVersionKey("journal"),
  [EDITOR_STORAGE_KEYS.food]: getEditorVersionKey("food"),
  [EDITOR_STORAGE_KEYS.books]: getEditorVersionKey("books"),
  [EDITOR_STORAGE_KEYS.map]: getEditorVersionKey("map"),
};

const isQuotaExceededError = (error: unknown): boolean => {
  if (!isBrowser) {
    return false;
  }

  if (error instanceof DOMException) {
    return error.name === "QuotaExceededError" || error.code === 22;
  }

  return false;
};

export const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
};

const rotateBackupsIfNeeded = (key: string, payload: string) => {
  if (!isBrowser) {
    return;
  }

  const config = STORAGE_BACKUPS[key];
  if (!config) {
    return;
  }

  const existing = window.localStorage.getItem(key);
  if (!existing || existing === payload) {
    return;
  }

  const previousBackup = window.localStorage.getItem(config.primary);
  if (previousBackup) {
    window.localStorage.setItem(config.secondary, previousBackup);
  }

  window.localStorage.setItem(config.primary, existing);
};

export const loadCollection = <T,>(key: string, fallback: T[]): T[] => {
  if (!isBrowser) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch (error) {
    logger.warn(`Impossible de lire ${key} depuis le localStorage`, error);
    return fallback;
  }
};

export interface SaveCollectionResult {
  success: boolean;
  quotaExceeded: boolean;
  error?: Error;
}

export const saveCollection = <T,>(key: string, value: T[]): SaveCollectionResult => {
  if (!isBrowser) {
    return {
      success: false,
      quotaExceeded: false,
      error: new Error("localStorage est indisponible dans cet environnement."),
    };
  }

  const payload = JSON.stringify(value);

  try {
    rotateBackupsIfNeeded(key, payload);
    window.localStorage.setItem(key, payload);

    const versionKey = STORAGE_VERSIONS[key];
    if (versionKey) {
      window.localStorage.setItem(versionKey, EDITOR_STORAGE_VERSION);
    }

    return { success: true, quotaExceeded: false };
  } catch (error) {
    const normalizedError = toError(error);
    logger.error(`Erreur lors de la sauvegarde de ${key} dans le localStorage`, normalizedError);
    return {
      success: false,
      quotaExceeded: isQuotaExceededError(error),
      error: normalizedError,
    };
  }
};
