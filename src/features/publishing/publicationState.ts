import type { ContentStatus } from "@/types/content";
import { logger } from "@/lib/logger";

export type PublicationCollection = "journal" | "food" | "books";

export interface PublicationMetadata {
  status: ContentStatus;
  updatedAt: string;
}

export interface PublicationState {
  journal: Record<string, PublicationMetadata>;
  food: Record<string, PublicationMetadata>;
  books: Record<string, PublicationMetadata>;
}

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const STORAGE_KEY = "content-publication-state.v1";

const nowIsoString = () => new Date().toISOString();

const createDefaultState = (): PublicationState => ({
  journal: {},
  food: {},
  books: {},
});

const cloneCollection = (
  collection: Record<string, PublicationMetadata>,
): Record<string, PublicationMetadata> => {
  return Object.entries(collection).reduce<Record<string, PublicationMetadata>>((accumulator, [id, metadata]) => {
    accumulator[id] = { ...metadata };
    return accumulator;
  }, {});
};

export const clonePublicationState = (state: PublicationState): PublicationState => ({
  journal: cloneCollection(state.journal),
  food: cloneCollection(state.food),
  books: cloneCollection(state.books),
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isContentStatus = (value: unknown): value is ContentStatus => {
  return value === "draft" || value === "published";
};

const normalizeCollection = (value: unknown): Record<string, PublicationMetadata> => {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, PublicationMetadata>>((accumulator, [id, metadata]) => {
    if (!isRecord(metadata)) {
      return accumulator;
    }

    const status = (metadata as { status?: unknown }).status;
    if (!isContentStatus(status)) {
      return accumulator;
    }

    const updatedAt = (metadata as { updatedAt?: unknown }).updatedAt;
    accumulator[id] = {
      status,
      updatedAt: typeof updatedAt === "string" ? updatedAt : nowIsoString(),
    };
    return accumulator;
  }, {});
};

export const loadPublicationState = (): PublicationState => {
  if (!isBrowser) {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as Partial<PublicationState>;
    return {
      journal: normalizeCollection(parsed.journal),
      food: normalizeCollection(parsed.food),
      books: normalizeCollection(parsed.books),
    };
  } catch (error) {
    logger.warn("⚠️ Impossible de lire l'état de publication", error);
    return createDefaultState();
  }
};

export const savePublicationState = (state: PublicationState): void => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    logger.error("❌ Impossible d'enregistrer l'état de publication", error);
  }
};

const withUpdatedCollection = (
  state: PublicationState,
  collection: PublicationCollection,
  updater: (current: Record<string, PublicationMetadata>) => {
    next: Record<string, PublicationMetadata>;
    changed: boolean;
  },
): PublicationState => {
  const result = updater(state[collection]);
  if (!result.changed) {
    return state;
  }

  return {
    ...state,
    [collection]: result.next,
  };
};

export const ensurePublicationEntries = (
  state: PublicationState,
  collection: PublicationCollection,
  ids: readonly string[],
  canonicalIds: ReadonlySet<string>,
): PublicationState => {
  if (ids.length === 0 && Object.keys(state[collection]).length === 0) {
    return state;
  }

  const idSet = new Set(ids);

  return withUpdatedCollection(state, collection, (current) => {
    let changed = false;
    const next = { ...current };

    ids.forEach((id) => {
      if (!next[id]) {
        next[id] = {
          status: canonicalIds.has(id) ? "published" : "draft",
          updatedAt: nowIsoString(),
        };
        changed = true;
      }
    });

    Object.keys(next).forEach((id) => {
      if (!idSet.has(id)) {
        delete next[id];
        changed = true;
      }
    });

    return { next, changed };
  });
};

export const updatePublicationStatus = (
  state: PublicationState,
  collection: PublicationCollection,
  id: string,
  status: ContentStatus,
): PublicationState => {
  return withUpdatedCollection(state, collection, (current) => {
    const existing = current[id];
    if (existing?.status === status) {
      return { next: current, changed: false };
    }

    const next = {
      ...current,
      [id]: {
        status,
        updatedAt: nowIsoString(),
      },
    };

    return { next, changed: true };
  });
};

export const removePublicationEntry = (
  state: PublicationState,
  collection: PublicationCollection,
  id: string,
): PublicationState => {
  if (!state[collection][id]) {
    return state;
  }

  return withUpdatedCollection(state, collection, (current) => {
    if (!current[id]) {
      return { next: current, changed: false };
    }

    const next = { ...current };
    delete next[id];
    return { next, changed: true };
  });
};

export const resolvePublicationStatus = (
  state: PublicationState,
  collection: PublicationCollection,
  id: string,
  { defaultStatus }: { defaultStatus: ContentStatus },
): ContentStatus => {
  const metadata = state[collection][id];
  return metadata?.status ?? defaultStatus;
};

export const countPublicationByStatus = (
  state: PublicationState,
  collection: PublicationCollection,
  status: ContentStatus,
  ids: readonly string[],
  { defaultStatus }: { defaultStatus: ContentStatus },
): number => {
  return ids.reduce((total, id) => {
    const resolvedStatus = resolvePublicationStatus(state, collection, id, { defaultStatus });
    return resolvedStatus === status ? total + 1 : total;
  }, 0);
};
