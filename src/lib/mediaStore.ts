import { compressImageUrl } from "./imageCompression";

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

const STORAGE_KEY = "mediaLibraryAssets/v1";
const DEFAULT_MAX_ASSETS = 200;
const DEFAULT_MAX_BYTES = 50 * 1024 * 1024; // 50MB

export const DEFAULT_MEDIA_QUOTA: Pick<MediaLibraryUsage, "maxAssets" | "maxBytes"> = {
  maxAssets: DEFAULT_MAX_ASSETS,
  maxBytes: DEFAULT_MAX_BYTES,
};

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safeParse = (value: string | null): MediaAsset[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as MediaAsset[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((asset) => asset && typeof asset.id === "string" && typeof asset.url === "string")
      .map((asset) => ({
        ...asset,
        source: asset.source ?? "upload",
      }));
  } catch (error) {
    console.error("❌ Impossible de parser la médiathèque", error);
    return [];
  }
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

export const loadMediaAssets = (): MediaAsset[] => {
  if (!isBrowser) {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  const assets = safeParse(raw);

  // Nettoyer les assets invalides ou vides
  const deduplicated = assets.reduce<MediaAsset[]>((acc, asset) => {
    if (!asset.id || !asset.url) {
      return acc;
    }

    if (acc.some((existing) => existing.id === asset.id)) {
      return acc;
    }

    const normalizedAsset: MediaAsset = {
      ...asset,
      size: asset.size || estimateDataUrlSize(asset.url),
      source: asset.source ?? "upload",
      createdAt: asset.createdAt ?? new Date().toISOString(),
      updatedAt: asset.updatedAt ?? asset.createdAt ?? new Date().toISOString(),
    };

    return [...acc, normalizedAsset];
  }, []);

  return deduplicated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const persistAssets = (assets: MediaAsset[]) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
};

export const saveMediaAssets = (assets: MediaAsset[]): MediaLibraryState => {
  const ordered = [...assets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  persistAssets(ordered);
  return {
    assets: ordered,
    usage: computeUsage(ordered),
  };
};

export const getMediaLibraryState = (): MediaLibraryState => {
  const assets = loadMediaAssets();
  return {
    assets,
    usage: computeUsage(assets),
  };
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
  };
};

export const addMediaAssets = async (assetsToAdd: MediaAssetPayload[]): Promise<MediaLibraryState> => {
  if (assetsToAdd.length === 0) {
    return getMediaLibraryState();
  }

  const currentAssets = loadMediaAssets();
  const builtAssets: MediaAsset[] = [];

  for (const payload of assetsToAdd) {
    try {
      const asset = await buildMediaAsset(payload);
      builtAssets.push(asset);
    } catch (error) {
      console.warn("⚠️ Impossible de créer un média", payload.name, error);
    }
  }

  const merged = [...builtAssets, ...currentAssets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  persistAssets(merged);
  return {
    assets: merged,
    usage: computeUsage(merged),
  };
};

export const removeMediaAsset = (assetId: string): MediaLibraryState => {
  const currentAssets = loadMediaAssets();
  const filtered = currentAssets.filter((asset) => asset.id !== assetId);
  persistAssets(filtered);
  return {
    assets: filtered,
    usage: computeUsage(filtered),
  };
};

export const touchMediaAsset = (assetId: string): MediaLibraryState => {
  const currentAssets = loadMediaAssets();
  const now = new Date().toISOString();
  const updated = currentAssets.map((asset) => (asset.id === assetId ? { ...asset, lastUsedAt: now, updatedAt: now } : asset));
  persistAssets(updated);
  return {
    assets: updated,
    usage: computeUsage(updated),
  };
};

export const refreshAssetPreview = async (assetId: string, options?: { quality?: number; maxWidth?: number; maxHeight?: number }): Promise<MediaLibraryState> => {
  const currentAssets = loadMediaAssets();
  const target = currentAssets.find((asset) => asset.id === assetId);

  if (!target) {
    return {
      assets: currentAssets,
      usage: computeUsage(currentAssets),
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
    persistAssets(updatedAssets);

    return {
      assets: updatedAssets,
      usage: computeUsage(updatedAssets),
    };
  } catch (error) {
    console.error("❌ Impossible de rafraîchir l'aperçu du média", error);
    return {
      assets: currentAssets,
      usage: computeUsage(currentAssets),
    };
  }
};

export const clearMediaLibrary = (): void => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
