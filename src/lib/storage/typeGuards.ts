/**
 * Type Guards - Safe type checking without assertions
 *
 * Replaces unsafe `as` type assertions with proper runtime validation
 */

import { JournalEntry } from '@/lib/journalStorage';
import { FoodExperience } from '@/data/foodExperiences';
import { BookRecommendation } from '@/data/readingRecommendations';

/**
 * Check if value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if value is a valid number
 */
function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for JournalEntry
 */
export function isJournalEntry(value: unknown): value is JournalEntry {
  if (!isObject(value)) return false;

  return (
    isNumber(value.day) &&
    isNonEmptyString(value.date) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.location) &&
    isNonEmptyString(value.story) &&
    isNonEmptyString(value.mood) &&
    (value.photos === undefined || isArray(value.photos)) &&
    (value.link === undefined || typeof value.link === 'string')
  );
}

/**
 * Type guard for JournalEntry array
 */
export function isJournalEntryArray(value: unknown): value is JournalEntry[] {
  return isArray(value) && value.every(isJournalEntry);
}

/**
 * Type guard for FoodExperience
 */
export function isFoodExperience(value: unknown): value is FoodExperience {
  if (!isObject(value)) return false;

  return (
    isNumber(value.day) &&
    isNonEmptyString(value.dish) &&
    isNonEmptyString(value.location) &&
    isNonEmptyString(value.description) &&
    isNumber(value.rating) &&
    value.rating >= 1 &&
    value.rating <= 5 &&
    (value.cultural_note === undefined || typeof value.cultural_note === 'string') &&
    (value.id === undefined || typeof value.id === 'string')
  );
}

/**
 * Type guard for FoodExperience array
 */
export function isFoodExperienceArray(value: unknown): value is FoodExperience[] {
  return isArray(value) && value.every(isFoodExperience);
}

/**
 * Type guard for BookRecommendation
 */
export function isBookRecommendation(value: unknown): value is BookRecommendation {
  if (!isObject(value)) return false;

  return (
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.author) &&
    isNonEmptyString(value.category) &&
    isNonEmptyString(value.description) &&
    isNonEmptyString(value.why_recommend) &&
    (value.amazon_link === undefined || typeof value.amazon_link === 'string') &&
    (value.id === undefined || typeof value.id === 'string')
  );
}

/**
 * Type guard for BookRecommendation array
 */
export function isBookRecommendationArray(value: unknown): value is BookRecommendation[] {
  return isArray(value) && value.every(isBookRecommendation);
}

/**
 * Safe JSON parse with type guard
 *
 * @example
 * ```typescript
 * const data = safeJsonParse(jsonString, isJournalEntryArray, []);
 * // data is guaranteed to be JournalEntry[] or default value
 * ```
 */
export function safeJsonParse<T>(
  jsonString: string,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    return guard(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage get with type guard
 */
export function safeLocalStorageGet<T>(
  key: string,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;

    const parsed: unknown = JSON.parse(raw);
    return guard(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}
