import { compressImageUrl } from "./imageCompression";
import { logger } from "@/lib/logger";
import {
  createJsonLocalStorageClient,
  type JsonLocalStorageClient,
  type StorageWriteResult,
} from "@/storage/localStorageClient";

export type MediaAssetSource = "upload" | "external" | "generated";

export interface MediaAsset {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  width?: number;
  height?: number;
  originalSize?: number;
  lastUsedAt?: string;
  checksum?: string;
  source: MediaAssetSource;
  description?: string;
  tags?: string[];
}

export interface MediaLibraryUsage {
  assetCount: number;
  totalBytes: number;
  maxAssets: number;
  maxBytes: number;
  remainingAssets: number;
  remainingBytes: number;
}

export interface MediaLibraryState {
  assets: MediaAsset[];
  usage: MediaLibraryUsage;
}

export interface MediaLibraryPersistenceResult {
  state: MediaLibraryState;
  writeResult: StorageWriteResult | null;
}

export interface AddMediaAssetsResult extends MediaLibraryPersistenceResult {
  addedCount: number;
  skippedCount: number;
}

const STORAGE_KEY = "mediaLibraryAssets/v1";
const STORAGE_BACKUP_PRIMARY = `${STORAGE_KEY}/backup1`;
const STORAGE_BACKUP_SECONDARY = `${STORAGE_KEY}/backup2`;
const STORAGE_VERSION_KEY = `${STORAGE_KEY}/version`;
const STORAGE_VERSION = "1";

const DEFAULT_MAX_ASSETS = 200;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const DEFAULT_MEDIA_QUOTA: Pick<MediaLibraryUsage, "maxAssets" | "maxBytes"> = {
  maxAssets: DEFAULT_MAX_ASSETS,
  maxBytes: DEFAULT_MAX_BYTES,
};

export const MEDIA_LIBRARY_UPDATED_EVENT = "media-library:change";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const mediaClient: JsonLocalStorageClient<MediaAsset[]> | null = isBrowser
  ? createJsonLocalStorageClient<MediaAsset[]>({
      storageKey: STORAGE_KEY,
      backupKeys: {
        primary: STORAGE_BACKUP_PRIMARY,
        secondary: STORAGE_BACKUP_SECONDARY,
      },
      versionKey: STORAGE_VERSION_KEY,
      currentVersion: STORAGE_VERSION,
    })
  : null;

const DEFAULT_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: "media-seed-1",
    name: "Coucher de soleil sur Wadi Rum",
    type: "image/jpeg",
    url: "/lovable-uploads/wadi-rum-sunset.jpg",
    size: 420_000,
    createdAt: "2023-12-01T18:30:00.000Z",
    updatedAt: "2023-12-01T18:30:00.000Z",
    description: "Panorama capturé depuis un camp bédouin, idéal pour illustrer la section Médias.",
    tags: ["wadi-rum", "coucher-de-soleil", "paysage"],
    source: "generated",
  },
  {
    id: "media-seed-2",
    name: "Ambiance du souk d'Amman",
    type: "audio/mpeg",
    url: "/lovable-uploads/amman-souk.mp3",
    size: 2_300_000,
    createdAt: "2023-12-02T10:00:00.000Z",
    updatedAt: "2023-12-02T10:00:00.000Z",
    description: "Ambiance sonore enregistrée sur place, parfaite pour enrichir les stories Instagram ou TikTok.",
    tags: ["amman", "souk", "ambiance"],
    source: "generated",
  },
  {
    id: "media-journal-day-1-cover",
    name: "Journal — Arrivée à Amman",
    type: "image/png",
    url: "/lovable-uploads/ab7525ee-de5e-4ec5-bd8a-474c543dff10.png",
    size: 512_000,
    createdAt: "2024-01-15T06:00:00.000Z",
    updatedAt: "2024-01-15T06:00:00.000Z",
    description: "Vue sur les toits d'Amman à l'aube, utilisée comme image d'ouverture du journal.",
    tags: ["amman", "journal", "jour-1"],
    source: "generated",
  },
  {
    id: "media-journal-day-1-detail",
    name: "Journal — Détails de la capitale",
    type: "image/png",
    url: "/lovable-uploads/0b1d45f0-c3dd-413d-89aa-6d7a070b4f6d.png",
    size: 460_000,
    createdAt: "2024-01-15T07:30:00.000Z",
    updatedAt: "2024-01-15T07:30:00.000Z",
    description: "Scène de rue animée à Amman pour illustrer la première journée.",
    tags: ["amman", "journal", "jour-1"],
    source: "generated",
  },
  {
    id: "media-journal-day-2-souk",
    name: "Journal — Jerash et souk",
    type: "image/png",
    url: "/lovable-uploads/0b1d45f0-c3dd-413d-89aa-6d7a070b4f6d.png",
    size: 460_000,
    createdAt: "2024-01-16T18:45:00.000Z",
    updatedAt: "2024-01-16T18:45:00.000Z",
    description: "Ambiance du souk d'Amman après la visite de Jerash.",
    tags: ["amman", "journal", "jour-2"],
    source: "generated",
  },
  {
    id: "media-journal-day-3-dead-sea",
    name: "Journal — Mer Morte",
    type: "image/png",
    url: "/lovable-uploads/ab7525ee-de5e-4ec5-bd8a-474c543dff10.png",
    size: 512_000,
    createdAt: "2024-01-17T17:15:00.000Z",
    updatedAt: "2024-01-17T17:15:00.000Z",
    description: "Reflets dorés au coucher du soleil sur la Mer Morte.",
    tags: ["mer-morte", "journal", "jour-3"],
    source: "generated",
  },
];

const DEFAULT_ASSET_IDS = new Set(DEFAULT_MEDIA_ASSETS.map((asset) => asset.id));

const coerceTags = (value: unknown): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
      .filter((tag) => tag.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }

  return undefined;
};

const normalizeAsset = (asset: Partial<MediaAsset>): MediaAsset | null => {
  if (!asset || typeof asset.id !== "string" || typeof asset.url !== "string") {
    return null;
  }

  const createdAt = typeof asset.createdAt === "string" ? asset.createdAt : new Date().toISOString();
  const updatedAt = typeof asset.updatedAt === "string" ? asset.updatedAt : createdAt;
  const size = typeof asset.size === "number" && Number.isFinite(asset.size) ? asset.size : estimateDataUrlSize(asset.url);

  return {
    id: asset.id,
    name: typeof asset.name === "string" && asset.name.length > 0 ? asset.name : "Média sans titre",
    type: typeof asset.type === "string" && asset.type.length > 0 ? asset.type : "image/jpeg",
    url: asset.url,
    size,
    createdAt,
    updatedAt,
    width: typeof asset.width === "number" ? asset.width : undefined,
    height: typeof asset.height === "number" ? asset.height : undefined,
    originalSize: typeof asset.originalSize === "number" ? asset.originalSize : undefined,
    lastUsedAt: typeof asset.lastUsedAt === "string" ? asset.lastUsedAt : undefined,
    checksum: typeof asset.checksum === "string" ? asset.checksum : undefined,
    source: (asset.source as MediaAssetSource) ?? "upload",
    description: typeof asset.description === "string" ? asset.description : undefined,
    tags: coerceTags(asset.tags),
  };
};

const safeParse = (value: MediaAsset[] | null): MediaAsset[] => {
  if (!value) {
    return [];
  }

  return value
    .map((asset) => normalizeAsset(asset) as MediaAsset | null)
    .filter((asset): asset is MediaAsset => Boolean(asset));
};

export const estimateDataUrlSize = (dataUrl: string): number => {
  if (!dataUrl.startsWith("data:")) {
    return 0;
  }

  const base64Index = dataUrl.indexOf(",");
  if (base64Index === -1) {
    return 0;
  }

  const base64Length = dataUrl.length - base64Index - 1;
  return Math.floor((base64Length * 3) / 4);
};

const computeUsage = (assets: MediaAsset[]): MediaLibraryUsage => {
  const totalBytes = assets.reduce((acc, asset) => acc + (asset.size || estimateDataUrlSize(asset.url)), 0);

  return {
    assetCount: assets.length,
    totalBytes,
    maxAssets: DEFAULT_MAX_ASSETS,
    maxBytes: DEFAULT_MAX_BYTES,
    remainingAssets: Math.max(DEFAULT_MAX_ASSETS - assets.length, 0),
    remainingBytes: Math.max(DEFAULT_MAX_BYTES - totalBytes, 0),
  };
};

export const formatBytes = (bytes: number): string => {
  if (bytes <= 0) {
    return "0 Ko";
  }

  const units = ["octets", "Ko", "Mo", "Go"] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const mergeWithDefaults = (assets: MediaAsset[]): MediaAsset[] => {
  const ids = new Set(assets.map((asset) => asset.id));
  const seeded = DEFAULT_MEDIA_ASSETS.filter((asset) => !ids.has(asset.id)).map((asset) => ({ ...asset }));
  return [...assets, ...seeded];
};

const broadcastMediaLibraryChange = (state: MediaLibraryState) => {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }

  let event: Event & { detail?: MediaLibraryState };
  if (typeof window.CustomEvent === "function") {
    event = new CustomEvent<MediaLibraryState>(MEDIA_LIBRARY_UPDATED_EVENT, { detail: state });
  } else {
    event = new Event(MEDIA_LIBRARY_UPDATED_EVENT) as Event & { detail?: MediaLibraryState };
    Object.defineProperty(event, "detail", { value: state });
  }

  window.dispatchEvent(event);
};

const loadStoredAssets = (): MediaAsset[] => {
  if (!isBrowser || !mediaClient) {
    return DEFAULT_MEDIA_ASSETS.map((asset) => ({ ...asset }));
  }

  const raw = mediaClient.read();
  const parsed = safeParse(raw);

  if (parsed.length === 0) {
    return DEFAULT_MEDIA_ASSETS.map((asset) => ({ ...asset }));
  }

  const deduplicated = parsed.reduce<MediaAsset[]>((acc, asset) => {
    if (acc.some((existing) => existing.id === asset.id)) {
      return acc;
    }

    return [...acc, asset];
  }, []);

  return mergeWithDefaults(
    deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  );
};

const persistAssets = (assets: MediaAsset[]): StorageWriteResult | null => {
  if (!isBrowser || !mediaClient) {
    return null;
  }

  return mediaClient.write(
    assets.map((asset) => ({
      ...asset,
      tags: asset.tags,
    })),
  );
};

const toState = (assets: MediaAsset[]): MediaLibraryState => ({
  assets,
  usage: computeUsage(assets),
});

export const loadMediaAssets = (): MediaAsset[] => {
  return loadStoredAssets();
};

export const saveMediaAssets = (assets: MediaAsset[]): MediaLibraryPersistenceResult => {
  const ordered = assets
    .map((asset) => ({ ...asset }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const state = toState(ordered);
  const writeResult = persistAssets(ordered);
  broadcastMediaLibraryChange(state);
  return {
    state,
    writeResult,
  };
};

export const getMediaLibraryState = (): MediaLibraryState => {
  const assets = loadStoredAssets();
  return toState(assets);
};

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `media-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

const readImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => reject(new Error("Impossible de lire les dimensions de l'image"));
    image.src = dataUrl;
  });
};

export interface MediaAssetPayload {
  name: string;
  type: string;
  url: string;
  originalSize?: number;
  source?: MediaAssetSource;
  description?: string;
  tags?: string[];
}

export const buildMediaAsset = async (payload: MediaAssetPayload): Promise<MediaAsset> => {
  const { width, height } = await readImageDimensions(payload.url);
  const now = new Date().toISOString();

  return {
    id: createId(),
    name: payload.name,
    type: payload.type,
    url: payload.url,
    size: estimateDataUrlSize(payload.url),
    createdAt: now,
    updatedAt: now,
    width,
    height,
    originalSize: payload.originalSize,
    source: payload.source ?? "upload",
    description: payload.description,
    tags: payload.tags,
  };
};

export const addMediaAssets = async (assetsToAdd: MediaAssetPayload[]): Promise<AddMediaAssetsResult> => {
  if (assetsToAdd.length === 0) {
    const current = loadStoredAssets();
    return {
      state: toState(current),
      writeResult: null,
      addedCount: 0,
      skippedCount: 0,
    };
  }

  const currentAssets = loadStoredAssets();
  const builtAssets: MediaAsset[] = [];
  let skippedCount = 0;

  for (const payload of assetsToAdd) {
    try {
      const asset = await buildMediaAsset(payload);
      builtAssets.push(asset);
    } catch (error) {
      skippedCount += 1;
      logger.warn("⚠️ Impossible de créer un média", { name: payload.name, error });
    }
  }

  const merged = mergeWithDefaults([...builtAssets, ...currentAssets]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const state = toState(merged);
  const writeResult = persistAssets(merged);
  broadcastMediaLibraryChange(state);

  return {
    state,
    writeResult,
    addedCount: builtAssets.length,
    skippedCount,
  };
};

export const removeMediaAsset = (assetId: string): MediaLibraryPersistenceResult => {
  const currentAssets = loadStoredAssets();
  const filtered = currentAssets.filter((asset) => asset.id !== assetId);
  const state = toState(filtered);
  const writeResult = persistAssets(filtered);
  broadcastMediaLibraryChange(state);

  return {
    state,
    writeResult,
  };
};

export const touchMediaAsset = (assetId: string): MediaLibraryPersistenceResult => {
  const currentAssets = loadStoredAssets();
  const now = new Date().toISOString();
  const updated = currentAssets.map((asset) => (asset.id === assetId ? { ...asset, lastUsedAt: now, updatedAt: now } : asset));
  const state = toState(updated);
  const writeResult = persistAssets(updated);
  broadcastMediaLibraryChange(state);

  return {
    state,
    writeResult,
  };
};

export const refreshAssetPreview = async (
  assetId: string,
  options?: { quality?: number; maxWidth?: number; maxHeight?: number },
): Promise<MediaLibraryPersistenceResult> => {
  const currentAssets = loadStoredAssets();
  const target = currentAssets.find((asset) => asset.id === assetId);

  if (!target) {
    const state = toState(currentAssets);
    broadcastMediaLibraryChange(state);
    return {
      state,
      writeResult: null,
    };
  }

  try {
    const compressed = await compressImageUrl(target.url, {
      quality: options?.quality ?? 0.7,
      maxWidth: options?.maxWidth ?? 1200,
      maxHeight: options?.maxHeight ?? 1200,
    });

    const updatedAsset: MediaAsset = {
      ...target,
      url: compressed,
      size: estimateDataUrlSize(compressed),
      updatedAt: new Date().toISOString(),
    };

    const updatedAssets = currentAssets.map((asset) => (asset.id === assetId ? updatedAsset : asset));
    const state = toState(updatedAssets);
    const writeResult = persistAssets(updatedAssets);
    broadcastMediaLibraryChange(state);

    return {
      state,
      writeResult,
    };
  } catch (error) {
    logger.error("❌ Impossible de rafraîchir l'aperçu du média", error);
    const state = toState(currentAssets);
    broadcastMediaLibraryChange(state);
    return {
      state,
      writeResult: null,
    };
  }
};

export interface MediaAssetUpdate {
  name?: string;
  type?: string;
  url?: string;
  description?: string;
  tags?: string[];
}

export const updateMediaAsset = (assetId: string, update: MediaAssetUpdate): MediaLibraryPersistenceResult => {
  const currentAssets = loadStoredAssets();
  const now = new Date().toISOString();

  const updatedAssets = currentAssets.map((asset) => {
    if (asset.id !== assetId) {
      return asset;
    }

    const nextUrl = update.url ?? asset.url;
    return {
      ...asset,
      name: update.name ?? asset.name,
      type: update.type ?? asset.type,
      url: nextUrl,
      size: update.url ? estimateDataUrlSize(nextUrl) : asset.size,
      description: update.description ?? asset.description,
      tags: update.tags ?? asset.tags,
      updatedAt: now,
    };
  });

  const state = toState(updatedAssets);
  const writeResult = persistAssets(updatedAssets);
  broadcastMediaLibraryChange(state);

  return {
    state,
    writeResult,
  };
};

export const clearMediaLibrary = (): void => {
  if (!isBrowser || !mediaClient) {
    return;
  }

  mediaClient.clear();
  broadcastMediaLibraryChange(toState(DEFAULT_MEDIA_ASSETS.map((asset) => ({ ...asset }))));
};

export const isDefaultMediaAsset = (assetId: string): boolean => DEFAULT_ASSET_IDS.has(assetId);

