import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "mediaLibraryAssets/v1";

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

describe("mediaStore", () => {
  let store: LocalStorageRecord;
  let dispatchEventMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    store = {};
    const localStorageMock = createLocalStorageMock(store);

    dispatchEventMock = vi.fn();

    (globalThis as unknown as { window: Window & typeof globalThis }).window = {
      localStorage: localStorageMock,
      crypto: {
        randomUUID: () => "test-id",
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: dispatchEventMock,
    } as Window & typeof globalThis;

    (globalThis as unknown as { localStorage: Storage }).localStorage = localStorageMock;
    (globalThis as unknown as { crypto: Crypto }).crypto = {
      randomUUID: () => "test-id",
    } as Crypto;

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
    delete (globalThis as { crypto?: Crypto }).crypto;
    delete (globalThis as { CustomEvent?: typeof CustomEvent }).CustomEvent;
    delete (globalThis as { Event?: typeof Event }).Event;
  });

  it("estimates data URL size and formats bytes", async () => {
    const { estimateDataUrlSize, formatBytes } = await import("../mediaStore");
    const dataUrl = "data:image/png;base64," + "A".repeat(400);

    const size = estimateDataUrlSize(dataUrl);
    expect(size).toBeGreaterThan(0);
    expect(formatBytes(size)).toMatch(/Ko|octets/);
  });

  it("persists media assets in descending order", async () => {
    const { saveMediaAssets, getMediaLibraryState, clearMediaLibrary } = await import("../mediaStore");

    clearMediaLibrary();

    const result = saveMediaAssets([
      {
        id: "asset-old",
        name: "Ancien visuel",
        type: "image/jpeg",
        url: "data:image/jpeg;base64,AAAABBBB",
        size: 1200,
        createdAt: "2023-12-01T10:00:00.000Z",
        updatedAt: "2023-12-01T10:00:00.000Z",
        source: "upload",
      },
      {
        id: "asset-new",
        name: "Nouveau visuel",
        type: "image/jpeg",
        url: "data:image/jpeg;base64,CCCCDDDD",
        size: 900,
        createdAt: "2024-01-15T08:30:00.000Z",
        updatedAt: "2024-01-15T08:30:00.000Z",
        source: "upload",
      },
    ]);

    expect(result.state.assets[0]?.id).toBe("asset-new");
    expect(store[STORAGE_KEY]).toBeDefined();

    const persisted = JSON.parse(store[STORAGE_KEY]) as { id: string }[];
    expect(persisted[0]?.id).toBe("asset-new");

    const library = getMediaLibraryState();
    const ids = library.assets.map((asset) => asset.id);
    expect(ids).toContain("asset-new");
    expect(ids).toContain("asset-old");
  });

  it("updates media metadata and preserves timestamps", async () => {
    const { saveMediaAssets, updateMediaAsset } = await import("../mediaStore");

    saveMediaAssets([
      {
        id: "asset-update",
        name: "Portrait",
        type: "image/jpeg",
        url: "data:image/jpeg;base64,EEEEFFFF",
        size: 600,
        createdAt: "2024-02-10T12:00:00.000Z",
        updatedAt: "2024-02-10T12:00:00.000Z",
        source: "upload",
      },
    ]);

    const updated = updateMediaAsset("asset-update", {
      description: "Portrait compressé",
      tags: ["portrait", "studio"],
    });

    const target = updated.state.assets.find((asset) => asset.id === "asset-update");
    expect(target?.description).toBe("Portrait compressé");
    expect(target?.tags).toEqual(["portrait", "studio"]);
    expect(target?.updatedAt).not.toBe("2024-02-10T12:00:00.000Z");
  });

  it("broadcasts changes when the library is updated", async () => {
    const { saveMediaAssets, MEDIA_LIBRARY_UPDATED_EVENT } = await import("../mediaStore");

    saveMediaAssets([
      {
        id: "asset-broadcast",
        name: "Panorama",
        type: "image/jpeg",
        url: "data:image/jpeg;base64,GGGGHHHH",
        size: 800,
        createdAt: "2024-02-20T12:00:00.000Z",
        updatedAt: "2024-02-20T12:00:00.000Z",
        source: "upload",
      },
    ]);

    expect(dispatchEventMock).toHaveBeenCalled();
    const event = dispatchEventMock.mock.calls.at(-1)?.[0] as { type: string; detail?: unknown } | undefined;
    expect(event?.type).toBe(MEDIA_LIBRARY_UPDATED_EVENT);
    expect(event?.detail).toMatchObject({ assets: expect.any(Array), usage: expect.any(Object) });
  });
});
