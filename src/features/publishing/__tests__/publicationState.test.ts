import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  countPublicationByStatus,
  ensurePublicationEntries,
  loadPublicationState,
  removePublicationEntry,
  resolvePublicationStatus,
  updatePublicationStatus,
} from '../publicationState.ts';

const baseState = () => ({
  journal: {},
  food: {},
  books: {},
  map: {},
});

describe('publicationState', () => {
  it('ensures entries are initialised with correct default status', () => {
    const initial = baseState();
    const canonicalIds = new Set(['1', '2']);

    const result = ensurePublicationEntries(initial, 'journal', ['1', '3'], canonicalIds);

    assert.strictEqual(result.journal['1']?.status, 'published');
    assert.strictEqual(result.journal['3']?.status, 'draft');
  });

  it('updates the status of an entry', () => {
    const initial = ensurePublicationEntries(baseState(), 'food', ['falafel'], new Set());

    const result = updatePublicationStatus(initial, 'food', 'falafel', 'published');
    assert.strictEqual(result.food.falafel?.status, 'published');
    assert.ok(result.food.falafel?.updatedAt);
  });

  it('removes an entry cleanly', () => {
    const initial = ensurePublicationEntries(baseState(), 'books', ['id'], new Set());
    const result = removePublicationEntry(initial, 'books', 'id');
    assert.strictEqual(result.books['id'], undefined);
  });

  it('resolves status with fallback when entry not tracked', () => {
    const state = baseState();
    const status = resolvePublicationStatus(state, 'journal', '42', { defaultStatus: 'draft' });
    assert.strictEqual(status, 'draft');
  });

  it('counts entries by status', () => {
    const initial = ensurePublicationEntries(baseState(), 'journal', ['1', '2'], new Set(['1']));
    const updated = updatePublicationStatus(initial, 'journal', '2', 'published');

    const publishedCount = countPublicationByStatus(
      updated,
      'journal',
      'published',
      ['1', '2'],
      { defaultStatus: 'draft' },
    );
    assert.strictEqual(publishedCount, 2);
  });

  it('loads a default state safely when localStorage is unavailable', () => {
    const state = loadPublicationState();
    assert.deepEqual(state, { journal: {}, food: {}, books: {}, map: {} });
  });
});
