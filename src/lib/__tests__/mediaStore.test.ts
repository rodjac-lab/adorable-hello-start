import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { createMockFn } from '../../../test/utils/mockFn.ts';

const STORAGE_KEY = 'mediaLibraryAssets/v1';
type LocalStorageRecord = Record<string, string>;

const createLocalStorageMock = (store: LocalStorageRecord) => {
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  } satisfies Storage;
};

const importMediaStore = async () => {
  return import(`../mediaStore.ts?test=${Date.now()}${Math.random()}`);
};

describe('mediaStore', () => {
  let store: LocalStorageRecord;
  const dispatchEventMock = createMockFn<[Event], boolean | void>();

  beforeEach(() => {
    store = {};
    const localStorageMock = createLocalStorageMock(store);

    const windowMock = {
      localStorage: localStorageMock,
      crypto: {
        randomUUID: () => 'test-id',
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: (event: Event) => dispatchEventMock(event),
    } as unknown as Window & typeof globalThis;

    (globalThis as unknown as { window: Window & typeof globalThis }).window = windowMock;
    (globalThis as unknown as { localStorage: Storage }).localStorage = localStorageMock;

    class FakeEvent<T = unknown> {
      type: string;
      detail?: T;
      constructor(type: string, init?: { detail?: T }) {
        this.type = type;
        this.detail = init?.detail;
      }
    }

    (globalThis as { CustomEvent?: typeof CustomEvent }).CustomEvent = FakeEvent as unknown as typeof CustomEvent;
    (globalThis as { Event?: typeof Event }).Event = FakeEvent as unknown as typeof Event;
  });

  afterEach(() => {
    delete (globalThis as { window?: Window }).window;
    delete (globalThis as { localStorage?: Storage }).localStorage;
    delete (globalThis as { CustomEvent?: typeof CustomEvent }).CustomEvent;
    delete (globalThis as { Event?: typeof Event }).Event;
    dispatchEventMock.mockClear();
  });

  it('estimates data URL size and formats bytes', async () => {
    const { estimateDataUrlSize, formatBytes } = await importMediaStore();
    const dataUrl = 'data:image/png;base64,' + 'A'.repeat(400);

    const size = estimateDataUrlSize(dataUrl);
    assert.ok(size > 0);
    const formatted = formatBytes(size);
    assert.ok(/Ko|octets/.test(formatted));
  });

  it('persists media assets in descending order', async () => {
    const { saveMediaAssets, getMediaLibraryState, clearMediaLibrary } = await importMediaStore();

    clearMediaLibrary();

    const result = saveMediaAssets([
      {
        id: 'asset-old',
        name: 'Ancien visuel',
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,AAAABBBB',
        size: 1200,
        createdAt: '2023-12-01T10:00:00.000Z',
        updatedAt: '2023-12-01T10:00:00.000Z',
        source: 'upload',
      },
      {
        id: 'asset-new',
        name: 'Nouveau visuel',
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,CCCCDDDD',
        size: 900,
        createdAt: '2024-01-15T08:30:00.000Z',
        updatedAt: '2024-01-15T08:30:00.000Z',
        source: 'upload',
      },
    ]);

    assert.strictEqual(result.state.assets[0]?.id, 'asset-new');
    assert.ok(store[STORAGE_KEY]);

    const persisted = JSON.parse(store[STORAGE_KEY]) as { id: string }[];
    assert.strictEqual(persisted[0]?.id, 'asset-new');

    const library = getMediaLibraryState();
    const ids = library.assets.map((asset) => asset.id);
    assert.ok(ids.includes('asset-new'));
    assert.ok(ids.includes('asset-old'));
  });

  it('updates media metadata and preserves timestamps', async () => {
    const { saveMediaAssets, updateMediaAsset } = await importMediaStore();

    saveMediaAssets([
      {
        id: 'asset-update',
        name: 'Portrait',
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,EEEEFFFF',
        size: 600,
        createdAt: '2024-02-10T12:00:00.000Z',
        updatedAt: '2024-02-10T12:00:00.000Z',
        source: 'upload',
      },
    ]);

    const updated = updateMediaAsset('asset-update', {
      description: 'Portrait compressé',
      tags: ['portrait', 'studio'],
    });

    const target = updated.state.assets.find((asset) => asset.id === 'asset-update');
    assert.strictEqual(target?.description, 'Portrait compressé');
    assert.deepEqual(target?.tags, ['portrait', 'studio']);
    assert.notStrictEqual(target?.updatedAt, '2024-02-10T12:00:00.000Z');
  });

  it('broadcasts changes when the library is updated', async () => {
    const { saveMediaAssets, MEDIA_LIBRARY_UPDATED_EVENT } = await importMediaStore();

    saveMediaAssets([
      {
        id: 'asset-broadcast',
        name: 'Panorama',
        type: 'image/jpeg',
        url: 'data:image/jpeg;base64,GGGGHHHH',
        size: 800,
        createdAt: '2024-02-20T12:00:00.000Z',
        updatedAt: '2024-02-20T12:00:00.000Z',
        source: 'upload',
      },
    ]);

    assert.ok(dispatchEventMock.calls.length > 0);
    const [event] = dispatchEventMock.calls.at(-1) ?? [];
    assert.ok(event);
    assert.strictEqual(event.type, MEDIA_LIBRARY_UPDATED_EVENT);
    const detail = (event as { detail?: unknown }).detail as
      | { assets: unknown[]; usage: Record<string, unknown> }
      | undefined;
    assert.ok(detail);
    assert.ok(Array.isArray(detail.assets));
    assert.ok(detail.usage && typeof detail.usage === 'object');
  });
});
