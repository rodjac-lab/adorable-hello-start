import type { ContentStatus, PlaceReference as BasePlaceReference } from "@/types/content";
import { EDITOR_STORAGE_KEYS } from "@/features/editor/constants";
import { loadPublicationState, resolvePublicationStatus } from "@/features/publishing/publicationState";
import { logger } from "@/lib/logger";

export type PlaceReference = BasePlaceReference;

export const placeReferences: PlaceReference[] = [
  {
    id: "place-amman-citadel",
    day: 1,
    name: "Amman",
    summary: "Capitale du royaume hachémite, point de départ et de retour du voyage.",
    coordinates: [31.9539, 35.9106],
    mediaAssetIds: ["media-place-amman-panorama"],
  },
  {
    id: "place-jerash-oval",
    day: 2,
    name: "Jerash",
    summary: "Cité gréco-romaine remarquablement conservée, joyau du nord jordanien.",
    coordinates: [32.2811, 35.8998],
    mediaAssetIds: ["media-place-jerash-card", "media-journal-day-2-souk"],
  },
  {
    id: "place-ajloun-fort",
    day: 2,
    name: "Ajloun",
    summary: "Forteresse ayyoubide veillant sur les vallées verdoyantes et les oliveraies.",
    coordinates: [32.3326, 35.7519],
    mediaAssetIds: ["media-place-ajloun-castle"],
  },
];

export const PLACE_STORAGE_KEY = EDITOR_STORAGE_KEYS.map;

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

type PlaceStatusFilter = ContentStatus | "all";

interface GetPlaceReferencesOptions {
  status?: PlaceStatusFilter;
}

const canonicalPlaceIds = new Set(placeReferences.map((place) => place.id));

const coerceMediaAssetIds = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sanitized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return sanitized.length > 0 ? sanitized : undefined;
};

const coerceCoordinates = (value: unknown): [number, number] | null => {
  if (!Array.isArray(value) || value.length !== 2) {
    return null;
  }

  const [latitude, longitude] = value;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return [latitude, longitude];
};

const sanitizeStoredPlaceReferences = (raw: unknown): PlaceReference[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const candidate = item as Partial<PlaceReference> & {
        coordinates?: unknown;
        mediaAssetIds?: unknown;
      };

      if (typeof candidate.id !== "string" || typeof candidate.day !== "number") {
        return null;
      }

      if (typeof candidate.name !== "string") {
        return null;
      }

      const coordinates = coerceCoordinates(candidate.coordinates);
      if (!coordinates) {
        return null;
      }

      return {
        id: candidate.id,
        day: candidate.day,
        name: candidate.name,
        summary: typeof candidate.summary === "string" ? candidate.summary : "",
        coordinates,
        mediaAssetIds: coerceMediaAssetIds(candidate.mediaAssetIds),
      } satisfies PlaceReference;
    })
    .filter((place): place is PlaceReference => Boolean(place));
};

const loadStoredPlaceReferences = (): PlaceReference[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PLACE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return sanitizeStoredPlaceReferences(parsed);
  } catch (error) {
    logger.warn("⚠️ Impossible de charger les lieux personnalisés", error);
    return [];
  }
};

const shouldInclude = (status: ContentStatus, filter: PlaceStatusFilter): boolean => {
  if (filter === "all") {
    return true;
  }

  return status === filter;
};

export const getPlaceReferences = (options?: GetPlaceReferencesOptions): PlaceReference[] => {
  const filter = options?.status ?? "published";

  if (!isBrowser) {
    if (filter === "draft") {
      return [];
    }
    return placeReferences.map((place) => ({ ...place }));
  }

  const storedPlaces = loadStoredPlaceReferences();
  const storedMap = new Map(storedPlaces.map((place) => [place.id, place]));
  const publicationState = loadPublicationState();

  const results: PlaceReference[] = [];

  placeReferences.forEach((place) => {
    const override = storedMap.get(place.id);
    const candidate = override ?? place;
    const status = resolvePublicationStatus(publicationState, "map", place.id, {
      defaultStatus: "published",
    });

    if (shouldInclude(status, filter)) {
      results.push({ ...candidate });
    }
  });

  storedPlaces.forEach((place) => {
    if (canonicalPlaceIds.has(place.id)) {
      return;
    }

    const status = resolvePublicationStatus(publicationState, "map", place.id, {
      defaultStatus: "draft",
    });

    if (shouldInclude(status, filter)) {
      results.push({ ...place });
    }
  });

  return results;
};

export const listCanonicalPlaceReferenceIds = (): readonly string[] => {
  return placeReferences.map((place) => place.id);
};
