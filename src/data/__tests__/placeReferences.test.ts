import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PLACE_STORAGE_KEY,
  getPlaceReferences,
  listCanonicalPlaceReferenceIds,
  placeReferences,
} from '../placeReferences.ts';

const PUBLICATION_STORAGE_KEY = 'content-publication-state.v1';

type LocalStorageRecord = Record<string, string>;

const createLocalStorageMock = (store: LocalStorageRecord): Storage => {
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    getItem: (key: string) => store[key] ?? null,
    key: (index: number) => Object.keys(store)[index] ?? null,
    removeItem: (key: string) => {
      delete store[key];
    },
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  } satisfies Storage;
};

describe('placeReferences', () => {
  it('returns canonical references with media metadata by default', () => {
    const storageMap: LocalStorageRecord = {};
    const storage = createLocalStorageMock(storageMap);

    const results = getPlaceReferences(undefined, { storage, isBrowser: true });

    assert.strictEqual(results.length, placeReferences.length);
    results.forEach((place) => {
      assert.ok(place.id);
      assert.ok(place.mediaAssetIds && place.mediaAssetIds.length > 0);
    });
  });

  it('merges stored overrides and honours publication status filters', () => {
    const storageMap: LocalStorageRecord = {};
    const storage = createLocalStorageMock(storageMap);

    const publicationState = {
      map: {
        'place-amman-citadel': {
          status: 'published' as const,
          updatedAt: '2024-01-15T08:00:00.000Z',
        },
        'place-petra-sunrise': {
          status: 'draft' as const,
          updatedAt: '2024-01-18T06:00:00.000Z',
        },
      },
    };

    storage.setItem(PUBLICATION_STORAGE_KEY, JSON.stringify(publicationState));

    storage.setItem(
      PLACE_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'place-amman-citadel',
          day: 1,
          name: 'Amman',
          summary: "Version studio de l'étape Amman",
          coordinates: [31.95, 35.91],
          mediaAssetIds: ['media-place-amman-panorama', 'media-custom-amman'],
        },
        {
          id: 'place-petra-sunrise',
          day: 4,
          name: 'Petra',
          summary: 'Lever de soleil sur la cité nabatéenne',
          coordinates: [30.3285, 35.4444],
          mediaAssetIds: ['media-place-petra'],
        },
      ]),
    );

    const published = getPlaceReferences(undefined, {
      storage,
      publicationState,
      isBrowser: true,
    });

    const amman = published.find((place) => place.id === 'place-amman-citadel');
    assert.strictEqual(amman?.summary, "Version studio de l'étape Amman");
    assert.deepEqual(amman?.mediaAssetIds, [
      'media-place-amman-panorama',
      'media-custom-amman',
    ]);

    assert.ok(!published.some((place) => place.id === 'place-petra-sunrise'));

    const drafts = getPlaceReferences(
      { status: 'draft' },
      { storage, publicationState, isBrowser: true },
    );
    assert.deepEqual(drafts.map((place) => place.id), ['place-petra-sunrise']);
  });

  it('defaults canonical entries to published and respects manual drafts', () => {
    const storageMap: LocalStorageRecord = {};
    const storage = createLocalStorageMock(storageMap);

    const canonicalIds = listCanonicalPlaceReferenceIds();
    assert.ok(canonicalIds.length > 0);

    const publicationState = {
      map: {
        'place-jerash-oval': {
          status: 'draft' as const,
          updatedAt: '2024-01-16T09:30:00.000Z',
        },
      },
    };

    storage.setItem(PUBLICATION_STORAGE_KEY, JSON.stringify(publicationState));

    const published = getPlaceReferences(undefined, {
      storage,
      publicationState,
      isBrowser: true,
    });
    assert.ok(!published.some((place) => place.id === 'place-jerash-oval'));

    const drafts = getPlaceReferences(
      { status: 'draft' },
      { storage, publicationState, isBrowser: true },
    );
    assert.ok(drafts.some((place) => place.id === 'place-jerash-oval'));
  });
});
