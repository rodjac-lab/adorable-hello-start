import type { ReadingRecommendation as BaseReadingRecommendation, ContentStatus } from '@/types/content';
import { EDITOR_STORAGE_KEYS } from '@/features/editor/constants';
import { loadPublicationState, resolvePublicationStatus } from '@/features/publishing/publicationState';
import { logger } from '@/lib/logger';

export type BookRecommendation = BaseReadingRecommendation;

export const readingRecommendations: BookRecommendation[] = [
  {
    id: 'lawrence-arabie',
    title: "Lawrence d'Arabie",
    author: 'T.E. Lawrence',
    type: 'Autobiographie',
    description:
      "Le récit captivant de l'officier britannique qui a vécu la révolte arabe de 1916-1918. Une plongée dans l'histoire du Moyen-Orient moderne.",
    why:
      "Indispensable pour comprendre l'histoire moderne de la région et l'émergence de la Jordanie moderne sous l'émir Abdullah.",
    amazon: 'https://amazon.fr/...',
    rating: 5,
  },
  {
    id: 'petra-merveille',
    title: 'Pétra : Merveille du monde',
    author: 'Jane Taylor',
    type: 'Guide culturel',
    description:
      "Guide complet sur l'histoire, l'archéologie et l'art nabatéen de Pétra. Avec de magnifiques photographies et plans détaillés.",
    why: "Le guide de référence pour comprendre l'ingéniosité nabatéenne et l'importance historique du site.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
  {
    id: 'bedouins-jordanie',
    title: 'Les Bédouins de Jordanie',
    author: 'Shelagh Weir',
    type: 'Anthropologie',
    description:
      "Étude approfondie de la culture bédouine traditionnelle, ses traditions, son artisanat et son mode de vie.",
    why: "Pour découvrir l'âme nomade de la Jordanie et comprendre l'hospitalité légendaire de ses habitants.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
  {
    id: 'cuisine-moyen-orient',
    title: 'Cuisine du Moyen-Orient',
    author: 'Claudia Roden',
    type: 'Gastronomie',
    description:
      "Bible de la cuisine moyen-orientale avec des recettes authentiques jordaniennes, palestiniennes et syriennes.",
    why: 'Pour reproduire chez soi les saveurs découvertes et prolonger le voyage culinaire.',
    amazon: 'https://amazon.fr/...',
    rating: 5,
  },
  {
    id: 'jordanie-land',
    title: 'Jordan: A Timeless Land',
    author: 'Mohamed El-Khoury',
    type: 'Beau livre',
    description:
      "Superbe livre photographique qui capture la beauté des paysages jordaniens, de Pétra au Wadi Rum.",
    why: 'Pour revivre visuellement la magie des paysages jordaniens et partager la beauté du pays.',
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
  {
    id: 'royaume-hachemite',
    title: 'Le Royaume hachémite de Jordanie',
    author: 'Philippe Droz-Vincent',
    type: 'Géopolitique',
    description:
      "Analyse politique et sociale de la Jordanie contemporaine, son rôle régional et ses défis.",
    why:
      "Pour comprendre les enjeux actuels du royaume et son importance stratégique au Moyen-Orient.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
];

const BOOK_STORAGE_KEY = EDITOR_STORAGE_KEYS.books;
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

type ReadingStatusFilter = ContentStatus | 'all';

interface GetReadingRecommendationsOptions {
  status?: ReadingStatusFilter;
}

const canonicalBookIds = new Set(readingRecommendations.map((book) => book.id));

const sanitizeStoredBooks = (raw: unknown): BookRecommendation[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is BookRecommendation => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }

      const candidate = item as Partial<BookRecommendation>;
      return typeof candidate.id === 'string';
    })
    .map((book) => ({ ...book }));
};

const loadStoredReadingRecommendations = (): BookRecommendation[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(BOOK_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return sanitizeStoredBooks(parsed);
  } catch (error) {
    logger.warn("⚠️ Impossible de charger les recommandations personnalisées", error);
    return [];
  }
};

const shouldInclude = (status: ContentStatus, filter: ReadingStatusFilter): boolean => {
  if (filter === 'all') {
    return true;
  }

  return status === filter;
};

export const getReadingRecommendations = (
  options?: GetReadingRecommendationsOptions,
): BookRecommendation[] => {
  const filter = options?.status ?? 'published';

  if (!isBrowser) {
    if (filter === 'draft') {
      return [];
    }
    return readingRecommendations.map((book) => ({ ...book }));
  }

  const storedBooks = loadStoredReadingRecommendations();
  const storedMap = new Map(storedBooks.map((book) => [book.id, book]));
  const publicationState = loadPublicationState();

  const results: BookRecommendation[] = [];

  readingRecommendations.forEach((book) => {
    const override = storedMap.get(book.id);
    const candidate = override ?? book;
    const status = resolvePublicationStatus(publicationState, 'books', book.id, {
      defaultStatus: 'published',
    });

    if (shouldInclude(status, filter)) {
      results.push({ ...candidate });
    }
  });

  storedBooks.forEach((book) => {
    if (canonicalBookIds.has(book.id)) {
      return;
    }

    const status = resolvePublicationStatus(publicationState, 'books', book.id, {
      defaultStatus: 'draft',
    });

    if (shouldInclude(status, filter)) {
      results.push({ ...book });
    }
  });

  return results;
};
