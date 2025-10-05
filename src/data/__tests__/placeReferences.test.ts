import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PLACE_STORAGE_KEY,
  getPlaceReferences,
  listCanonicalPlaceReferenceIds,
  placeReferences,
} from "../placeReferences";

const PUBLICATION_STORAGE_KEY = "content-publication-state.v1";

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

describe("placeReferences", () => {
  let store: LocalStorageRecord;

  beforeEach(() => {
    vi.resetModules();
    store = {};
    const localStorageMock = createLocalStorageMock(store);

    (globalThis as unknown as { window: Window & typeof globalThis }).window = {
      localStorage: localStorageMock,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as Window & typeof globalThis;

    (globalThis as unknown as { localStorage: Storage }).localStorage = localStorageMock;
  });

  afterEach(() => {
    delete (globalThis as { window?: Window }).window;
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("returns canonical references with media metadata by default", () => {
    const results = getPlaceReferences();

    expect(results).toHaveLength(placeReferences.length);
    results.forEach((place) => {
      expect(place.id).toBeDefined();
      expect(place.mediaAssetIds?.length).toBeGreaterThan(0);
    });
  });

  it("merges stored overrides and honours publication status filters", () => {
    const publicationState = {
      map: {
        "place-amman-citadel": { status: "published", updatedAt: "2024-01-15T08:00:00.000Z" },
        "place-petra-sunrise": { status: "draft", updatedAt: "2024-01-18T06:00:00.000Z" },
      },
    };

    store[PUBLICATION_STORAGE_KEY] = JSON.stringify(publicationState);

    store[PLACE_STORAGE_KEY] = JSON.stringify([
      {
        id: "place-amman-citadel",
        day: 1,
        name: "Amman",
        summary: "Version studio de l'étape Amman",
        coordinates: [31.95, 35.91],
        mediaAssetIds: ["media-place-amman-panorama", "media-custom-amman"],
      },
      {
        id: "place-petra-sunrise",
        day: 4,
        name: "Petra",
        summary: "Lever de soleil sur la cité nabatéenne",
        coordinates: [30.3285, 35.4444],
        mediaAssetIds: ["media-place-petra"],
      },
    ]);

    const published = getPlaceReferences();
    const amman = published.find((place) => place.id === "place-amman-citadel");
    expect(amman?.summary).toBe("Version studio de l'étape Amman");
    expect(amman?.mediaAssetIds).toEqual([
      "media-place-amman-panorama",
      "media-custom-amman",
    ]);

    expect(published.some((place) => place.id === "place-petra-sunrise")).toBe(false);

    const drafts = getPlaceReferences({ status: "draft" });
    expect(drafts).toEqual([
      expect.objectContaining({ id: "place-petra-sunrise" }),
    ]);
  });

  it("defaults canonical entries to published and respects manual drafts", () => {
    const canonicalIds = listCanonicalPlaceReferenceIds();
    expect(canonicalIds.length).toBeGreaterThan(0);

    store[PUBLICATION_STORAGE_KEY] = JSON.stringify({
      map: {
        "place-jerash-oval": { status: "draft", updatedAt: "2024-01-16T09:30:00.000Z" },
      },
    });

    const published = getPlaceReferences();
    expect(published.some((place) => place.id === "place-jerash-oval")).toBe(false);

    const drafts = getPlaceReferences({ status: "draft" });
    expect(drafts.some((place) => place.id === "place-jerash-oval")).toBe(true);
  });
});
