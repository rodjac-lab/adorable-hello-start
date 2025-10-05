import { describe, expect, it } from 'vitest';
import {
  countPublicationByStatus,
  ensurePublicationEntries,
  loadPublicationState,
  removePublicationEntry,
  resolvePublicationStatus,
  updatePublicationStatus,
} from '../publicationState';

const baseState = () => ({
  journal: {},
  food: {},
  books: {},
});

describe('publicationState', () => {
  it('ensures entries are initialised with correct default status', () => {
    const initial = baseState();
    const canonicalIds = new Set(['1', '2']);

    const result = ensurePublicationEntries(initial, 'journal', ['1', '3'], canonicalIds);

    expect(result.journal['1']?.status).toBe('published');
    expect(result.journal['3']?.status).toBe('draft');
  });

  it('updates the status of an entry', () => {
    const initial = ensurePublicationEntries(baseState(), 'food', ['falafel'], new Set());

    const result = updatePublicationStatus(initial, 'food', 'falafel', 'published');
    expect(result.food.falafel?.status).toBe('published');
    expect(result.food.falafel?.updatedAt).toBeDefined();
  });

  it('removes an entry cleanly', () => {
    const initial = ensurePublicationEntries(baseState(), 'books', ['id'], new Set());
    const result = removePublicationEntry(initial, 'books', 'id');
    expect(result.books['id']).toBeUndefined();
  });

  it('resolves status with fallback when entry not tracked', () => {
    const state = baseState();
    expect(resolvePublicationStatus(state, 'journal', '42', { defaultStatus: 'draft' })).toBe('draft');
  });

  it('counts entries by status', () => {
    const initial = ensurePublicationEntries(baseState(), 'journal', ['1', '2'], new Set(['1']));
    const updated = updatePublicationStatus(initial, 'journal', '2', 'published');

    const publishedCount = countPublicationByStatus(updated, 'journal', 'published', ['1', '2'], { defaultStatus: 'draft' });
    expect(publishedCount).toBe(2);
  });

  it('loads a default state safely when localStorage is unavailable', () => {
    const state = loadPublicationState();
    expect(state).toMatchObject({ journal: {}, food: {}, books: {} });
  });
});
