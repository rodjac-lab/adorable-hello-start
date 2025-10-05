import { logger } from '@/lib/logger';
import type { PlaceReference as BasePlaceReference } from '@/types/content';

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

const PLACE_REFERENCES_STORAGE_KEY = 'jordan-place-references';

const canonicalKey = (place: PlaceReference): string => `${place.day}-${place.name.toLowerCase()}`;

const sanitizeStoredPlaceReferences = (raw: unknown): PlaceReference[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is PlaceReference => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const candidate = item as Partial<PlaceReference> & {
        coordinates?: unknown;
      };

      const { day, name, summary, coordinates } = candidate;

      if (typeof day !== 'number' || !Number.isFinite(day)) {
        return false;
      }

      if (typeof name !== 'string' || name.trim() === '') {
        return false;
      }

      if (typeof summary !== 'string') {
        return false;
      }

      if (!Array.isArray(coordinates) || coordinates.length !== 2) {
        return false;
      }

      const [latitude, longitude] = coordinates;
      return (
        typeof latitude === 'number' &&
        Number.isFinite(latitude) &&
        typeof longitude === 'number' &&
        Number.isFinite(longitude)
      );
    })
    .map((item) => {
      const { day, name, summary, coordinates } = item;
      const [latitude, longitude] = coordinates;
      return {
        day,
        name,
        summary,
        coordinates: [latitude, longitude],
      } satisfies PlaceReference;
    });
};

export const isBrowser = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const loadStoredPlaceReferences = (): PlaceReference[] => {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PLACE_REFERENCES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return sanitizeStoredPlaceReferences(parsed);
  } catch (error) {
    logger.warn('⚠️ Impossible de charger les lieux personnalisés', error);
    return [];
  }
};

export const getPlaceReferences = (): PlaceReference[] => {
  if (!isBrowser()) {
    return placeReferences.map((place) => ({ ...place }));
  }

  const storedReferences = loadStoredPlaceReferences();
  if (storedReferences.length === 0) {
    return placeReferences.map((place) => ({ ...place }));
  }

  const overrides = new Map<string, PlaceReference>();
  storedReferences.forEach((place) => {
    overrides.set(canonicalKey(place), place);
  });

  const results: PlaceReference[] = placeReferences.map((place) => {
    const override = overrides.get(canonicalKey(place));
    if (!override) {
      return { ...place };
    }

    overrides.delete(canonicalKey(place));
    return { ...override };
  });

  overrides.forEach((place) => {
    results.push({ ...place });
  });

  return results;
};
