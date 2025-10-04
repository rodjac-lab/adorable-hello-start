import { logger } from '@/lib/logger';

/**
 * Type guard to validate data structure
 */
type Validator<T> = (value: unknown) => value is T;

/**
 * Storage operation result
 */
interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * LocalStorageManager - Centralized type-safe localStorage management
 *
 * Features:
 * - Type-safe get/set operations with generics
 * - Quota detection and error handling
 * - Optional data validation
 * - Automatic JSON serialization/deserialization
 * - Backup/recovery support
 *
 * @example
 * ```typescript
 * const storage = new LocalStorageManager('myKey', []);
 *
 * // Save data
 * storage.save([{ id: 1, name: 'Test' }]);
 *
 * // Load data
 * const items = storage.load();
 * ```
 */
export class LocalStorageManager<T> {
  private readonly key: string;
  private readonly backupKey: string;
  private readonly defaultValue: T;
  private readonly validator?: Validator<T>;

  constructor(
    key: string,
    defaultValue: T,
    options?: {
      enableBackup?: boolean;
      validator?: Validator<T>;
    }
  ) {
    this.key = key;
    this.backupKey = `${key}_backup`;
    this.defaultValue = defaultValue;
    this.validator = options?.validator;
  }

  /**
   * Load data from localStorage
   * Returns default value if key doesn't exist or parsing fails
   */
  load(): T {
    try {
      const raw = localStorage.getItem(this.key);

      if (!raw) {
        logger.debug(`LocalStorage: No data found for key "${this.key}"`);
        return this.defaultValue;
      }

      const parsed: unknown = JSON.parse(raw);

      // Validate if validator provided
      if (this.validator && !this.validator(parsed)) {
        logger.warn(`LocalStorage: Invalid data format for key "${this.key}"`);
        return this.tryLoadBackup() || this.defaultValue;
      }

      logger.debug(`LocalStorage: Loaded data for key "${this.key}"`);
      return parsed as T;
    } catch (error) {
      logger.error(`LocalStorage: Failed to load "${this.key}"`, { error });
      return this.tryLoadBackup() || this.defaultValue;
    }
  }

  /**
   * Save data to localStorage
   * Returns StorageResult with success status and error message if failed
   */
  save(data: T): StorageResult<T> {
    try {
      // Validate before saving
      if (this.validator && !this.validator(data as unknown)) {
        return {
          success: false,
          error: 'Data validation failed',
        };
      }

      const serialized = JSON.stringify(data);

      // Check size before saving (5MB typical limit)
      const sizeInBytes = new Blob([serialized]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 4.5) {
        logger.warn(`LocalStorage: Large data size (${sizeInMB.toFixed(2)}MB) for "${this.key}"`);
      }

      // Try to create backup before overwriting
      this.createBackup();

      // Save data
      localStorage.setItem(this.key, serialized);

      logger.debug(`LocalStorage: Saved ${sizeInMB.toFixed(2)}MB to "${this.key}"`);

      return {
        success: true,
        data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        logger.error(`LocalStorage: Quota exceeded for "${this.key}"`, {
          error,
          dataSize: new Blob([JSON.stringify(data)]).size,
        });
        return {
          success: false,
          error: 'Storage quota exceeded. Try reducing image sizes or clearing old data.',
        };
      }

      logger.error(`LocalStorage: Failed to save "${this.key}"`, { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Remove data from localStorage
   */
  remove(): void {
    try {
      localStorage.removeItem(this.key);
      logger.debug(`LocalStorage: Removed "${this.key}"`);
    } catch (error) {
      logger.error(`LocalStorage: Failed to remove "${this.key}"`, { error });
    }
  }

  /**
   * Check if key exists in localStorage
   */
  exists(): boolean {
    return localStorage.getItem(this.key) !== null;
  }

  /**
   * Get data size in bytes
   */
  getSize(): number {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return 0;
      return new Blob([raw]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Create a backup of current data
   */
  private createBackup(): void {
    try {
      const current = localStorage.getItem(this.key);
      if (current) {
        localStorage.setItem(this.backupKey, current);
      }
    } catch (error) {
      logger.warn(`LocalStorage: Failed to create backup for "${this.key}"`, { error });
    }
  }

  /**
   * Try to load data from backup
   */
  private tryLoadBackup(): T | null {
    try {
      const backup = localStorage.getItem(this.backupKey);
      if (!backup) return null;

      const parsed: unknown = JSON.parse(backup);

      if (this.validator && !this.validator(parsed)) {
        return null;
      }

      logger.info(`LocalStorage: Restored from backup for "${this.key}"`);
      return parsed as T;
    } catch (error) {
      logger.error(`LocalStorage: Failed to load backup for "${this.key}"`, { error });
      return null;
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(): boolean {
    try {
      const backup = this.tryLoadBackup();
      if (!backup) return false;

      const result = this.save(backup);
      return result.success;
    } catch (error) {
      logger.error(`LocalStorage: Failed to restore from backup for "${this.key}"`, { error });
      return false;
    }
  }

  /**
   * Clear all data including backup
   */
  clear(): void {
    this.remove();
    try {
      localStorage.removeItem(this.backupKey);
    } catch (error) {
      logger.warn(`LocalStorage: Failed to clear backup for "${this.key}"`, { error });
    }
  }

  /**
   * Get statistics about stored data
   */
  getStats(): {
    exists: boolean;
    size: number;
    sizeFormatted: string;
    hasBackup: boolean;
  } {
    const size = this.getSize();
    return {
      exists: this.exists(),
      size,
      sizeFormatted: size > 1024 * 1024
        ? `${(size / (1024 * 1024)).toFixed(2)} MB`
        : `${(size / 1024).toFixed(2)} KB`,
      hasBackup: localStorage.getItem(this.backupKey) !== null,
    };
  }
}

/**
 * Factory function to create a LocalStorageManager instance
 */
export function createStorageManager<T>(
  key: string,
  defaultValue: T,
  options?: {
    enableBackup?: boolean;
    validator?: Validator<T>;
  }
): LocalStorageManager<T> {
  return new LocalStorageManager(key, defaultValue, options);
}
