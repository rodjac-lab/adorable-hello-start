import type { PersistedJournalEntry } from '@/types/journal';
import type { ContentStatus } from '@/types/content';
import { EDITOR_STORAGE_KEYS } from '@/features/editor/constants';
import { loadPublicationState, resolvePublicationStatus } from '@/features/publishing/publicationState';
import { logger } from '@/lib/logger';
import { loadMediaAssets, type MediaAsset } from '@/lib/mediaStore';

export type JournalEntry = PersistedJournalEntry;

export const journalEntries: JournalEntry[] = [
  {
    day: 1,
    date: '15 janvier 2024',
    title: "Arrivée à Amman",
    location: 'Amman, Jordanie',
    story: [
      "Après un vol nocturne bercé par la lumière des étoiles, je touche enfin le sol jordanien.",
      "L'odeur de cardamome du café arabe embaume l'aérogare de Queen Alia tandis que je franchis les portes de l'immigration.",
      "Un chauffeur souriant m'attend avec un panneau griffonné à la main : premier sourire, première conversation, première invitation à ralentir et à écouter.",
    ].join('\n\n'),
    mood: 'Excité',
    mediaAssetIds: ['media-journal-day-1-cover', 'media-journal-day-1-detail'],
    link: 'https://maps.app.goo.gl/2CwZq8vSxcrb3MBv7',
  },
  {
    day: 2,
    date: '16 janvier 2024',
    title: 'Jerash et les collines du Nord',
    location: 'Jerash, Ajloun, Amman',
    story: [
      "Au lever du soleil, la lumière découpe les colonnades de Jerash comme une scène de théâtre antique.",
      "Les ruines racontent la grandeur de la Décapole pendant qu'à Ajloun, les pierres du château portent encore l'écho des croisades.",
      "La journée s'achève à Amman autour d'un mansaf partagé avec la famille de mon hôte : un festin autant culturel que gastronomique.",
    ].join('\n\n'),
    mood: 'Émerveillé',
    mediaAssetIds: ['media-journal-day-2-souk'],
    link: 'https://maps.app.goo.gl/g3PDc28B4wXCRB4x6',
  },
  {
    day: 3,
    date: '17 janvier 2024',
    title: 'Mer Morte et Mont Nebo',
    location: 'Mer Morte, Mont Nebo',
    story: [
      "Flotter dans la Mer Morte, sentir le sel porter le corps sans effort, c'est une sensation presque irréelle.",
      "Depuis le Mont Nebo, la vue s'étend jusqu'aux collines de Jérusalem : un panorama chargé de spiritualité.",
      "Sur le chemin du retour, arrêt dans une coopérative de mosaïstes à Madaba pour admirer un savoir-faire ancestral.",
    ].join('\n\n'),
    mood: 'Apaisé',
    mediaAssetIds: ['media-journal-day-3-dead-sea'],
  },
];

const JOURNAL_STORAGE_KEY = EDITOR_STORAGE_KEYS.journal;
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

type JournalStatusFilter = ContentStatus | 'all';

interface GetJournalEntriesOptions {
  status?: JournalStatusFilter;
}

const canonicalJournalDays = new Set(journalEntries.map((entry) => entry.day.toString()));

const coerceMediaAssetIds = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = value
    .filter((item): item is string => typeof item === 'string')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return ids.length > 0 ? ids : undefined;
};

const sanitizeStoredEntries = (raw: unknown): JournalEntry[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is JournalEntry => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const candidate = item as Partial<JournalEntry>;
      return typeof candidate.day === 'number';
    })
    .map((entry) => {
      const candidate = entry as JournalEntry & { mediaAssetIds?: unknown };
      const mediaAssetIds = coerceMediaAssetIds(candidate.mediaAssetIds);
      const photos = Array.isArray(candidate.photos)
        ? candidate.photos.filter((photo): photo is string => typeof photo === 'string' && photo.trim().length > 0)
        : undefined;

      return {
        ...entry,
        mediaAssetIds,
        photos,
      };
    });
};

const buildAssetMap = (): Map<string, MediaAsset> => {
  const assets = loadMediaAssets();
  return new Map(assets.map((asset) => [asset.id, asset]));
};

const resolveEntryPhotos = (entry: JournalEntry, assets: Map<string, MediaAsset>): JournalEntry => {
  const mediaAssetIds = entry.mediaAssetIds ?? [];

  const resolvedFromMedia = mediaAssetIds
    .map((id) => assets.get(id))
    .filter((asset): asset is MediaAsset => Boolean(asset))
    .map((asset) => asset.url);

  const legacyPhotos = (entry.photos ?? []).filter((photo) => typeof photo === 'string' && photo.length > 0);
  const mergedPhotos = [...resolvedFromMedia, ...legacyPhotos];
  const uniquePhotos = Array.from(new Set(mergedPhotos));

  return {
    ...entry,
    mediaAssetIds: mediaAssetIds.length > 0 ? mediaAssetIds : undefined,
    photos: uniquePhotos.length > 0 ? uniquePhotos : undefined,
  };
};

const loadStoredJournalEntries = (): JournalEntry[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return sanitizeStoredEntries(parsed);
  } catch (error) {
    logger.warn('⚠️ Impossible de charger les entrées personnalisées du journal', error);
    return [];
  }
};

const shouldInclude = (status: ContentStatus, filter: JournalStatusFilter): boolean => {
  if (filter === 'all') {
    return true;
  }

  return status === filter;
};

export const getJournalEntries = (options?: GetJournalEntriesOptions): JournalEntry[] => {
  const filter = options?.status ?? 'published';
  const assets = buildAssetMap();

  if (!isBrowser) {
    if (filter === 'draft') {
      return [];
    }
    return journalEntries.map((entry) => resolveEntryPhotos({ ...entry }, assets));
  }

  const storedEntries = loadStoredJournalEntries();
  const storedMap = new Map(storedEntries.map((entry) => [entry.day, entry]));
  const publicationState = loadPublicationState();

  const results: JournalEntry[] = [];

  journalEntries.forEach((entry) => {
    const override = storedMap.get(entry.day);
    const candidate = override ?? entry;
    const status = resolvePublicationStatus(publicationState, 'journal', entry.day.toString(), {
      defaultStatus: 'published',
    });

    if (shouldInclude(status, filter)) {
      results.push(resolveEntryPhotos({ ...candidate }, assets));
    }
  });

  storedEntries.forEach((entry) => {
    if (canonicalJournalDays.has(entry.day.toString())) {
      return;
    }

    const status = resolvePublicationStatus(publicationState, 'journal', entry.day.toString(), {
      defaultStatus: 'draft',
    });

    if (shouldInclude(status, filter)) {
      results.push(resolveEntryPhotos({ ...entry }, assets));
    }
  });

  return results.sort((a, b) => a.day - b.day);
};

export const getJournalEntry = (day: number): JournalEntry | undefined =>
  getJournalEntries({ status: 'all' }).find((entry) => entry.day === day);
