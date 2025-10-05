import { useCallback, useMemo, useState } from "react";
import { compressImage } from "@/lib/imageCompression";
import { logger } from "@/lib/logger";
import {
  addMediaAssets,
  getMediaLibraryState,
  refreshAssetPreview,
  removeMediaAsset,
  touchMediaAsset,
  updateMediaAsset,
  type AddMediaAssetsResult,
  type MediaAsset,
  type MediaAssetUpdate,
  type MediaLibraryState,
  type MediaLibraryPersistenceResult,
} from "@/lib/mediaStore";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export interface ImportMediaResult {
  imported: number;
  skipped: number;
  quotaExceeded: boolean;
}

export interface UseMediaLibraryResult {
  state: MediaLibraryState;
  assets: MediaAsset[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  importFiles: (files: FileList | File[]) => Promise<ImportMediaResult>;
  updateAsset: (id: string, update: MediaAssetUpdate) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  refreshAsset: (id: string) => Promise<void>;
  markAssetAsUsed: (id: string) => Promise<void>;
  clearError: () => void;
}

const createError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }

  return new Error(String(value));
};

const parseTags = (value: string): string[] => {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

const normalizeFileName = (name: string): string => {
  const withoutExtension = name.replace(/\.[^.]+$/, "");
  return withoutExtension || "Média importé";
};

const handlePersistenceResult = (
  result: MediaLibraryPersistenceResult | AddMediaAssetsResult,
  setState: (state: MediaLibraryState) => void,
  setError: (value: string | null) => void,
) => {
  if (result.writeResult && !result.writeResult.success) {
    const message = result.writeResult.quotaExceeded
      ? "Quota localStorage atteint pour la médiathèque. Supprimez des médias avant de réessayer."
      : result.writeResult.error?.message ?? "Impossible d'enregistrer la médiathèque.";
    setError(message);
    throw new Error(message);
  }

  setState(result.state);
  setError(null);
};

export const useMediaLibrary = (): UseMediaLibraryResult => {
  const [state, setState] = useState<MediaLibraryState>(() => getMediaLibraryState());
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assets = useMemo(() => state.assets, [state.assets]);

  const importFiles = useCallback<UseMediaLibraryResult["importFiles"]>(
    async (files) => {
      if (!isBrowser) {
        const message = "localStorage n'est pas disponible dans cet environnement.";
        setError(message);
        throw new Error(message);
      }

      const fileArray = Array.from(files);
      if (fileArray.length === 0) {
        return { imported: 0, skipped: 0, quotaExceeded: false };
      }

      setIsProcessing(true);

      try {
        const payloads = await Promise.all(
          fileArray.map(async (file) => {
            const compressed = await compressImage(file, {
              maxWidth: 1600,
              maxHeight: 1200,
              quality: 0.82,
              format: "jpeg",
            });

            return {
              name: normalizeFileName(file.name),
              type: file.type || "image/jpeg",
              url: compressed,
              originalSize: file.size,
              source: "upload" as const,
            };
          }),
        );

        const result = await addMediaAssets(payloads);
        handlePersistenceResult(result, setState, setError);

        return {
          imported: result.addedCount,
          skipped: result.skippedCount,
          quotaExceeded: Boolean(result.writeResult?.quotaExceeded),
        };
      } catch (value) {
        const normalized = createError(value);
        logger.error("❌ Import de média impossible", normalized);
        setError(normalized.message);
        throw normalized;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const updateAsset = useCallback<UseMediaLibraryResult["updateAsset"]>(
    async (id, update) => {
      if (!isBrowser) {
        const message = "localStorage n'est pas disponible dans cet environnement.";
        setError(message);
        throw new Error(message);
      }

      setIsProcessing(true);

      try {
        const result = updateMediaAsset(id, update);
        handlePersistenceResult(result, setState, setError);
      } catch (value) {
        const normalized = createError(value);
        logger.error("❌ Mise à jour du média impossible", normalized);
        setError(normalized.message);
        throw normalized;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const deleteAsset = useCallback<UseMediaLibraryResult["deleteAsset"]>(
    async (id) => {
      if (!isBrowser) {
        const message = "localStorage n'est pas disponible dans cet environnement.";
        setError(message);
        throw new Error(message);
      }

      setIsProcessing(true);

      try {
        const result = removeMediaAsset(id);
        handlePersistenceResult(result, setState, setError);
      } catch (value) {
        const normalized = createError(value);
        logger.error("❌ Suppression du média impossible", normalized);
        setError(normalized.message);
        throw normalized;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const refreshAsset = useCallback<UseMediaLibraryResult["refreshAsset"]>(
    async (id) => {
      if (!isBrowser) {
        const message = "localStorage n'est pas disponible dans cet environnement.";
        setError(message);
        throw new Error(message);
      }

      setIsProcessing(true);

      try {
        const result = await refreshAssetPreview(id, { quality: 0.75, maxWidth: 1400, maxHeight: 1400 });
        handlePersistenceResult(result, setState, setError);
      } catch (value) {
        const normalized = createError(value);
        logger.error("❌ Rafraîchissement du média impossible", normalized);
        setError(normalized.message);
        throw normalized;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const markAssetAsUsed = useCallback<UseMediaLibraryResult["markAssetAsUsed"]>(
    async (id) => {
      if (!isBrowser) {
        const message = "localStorage n'est pas disponible dans cet environnement.";
        setError(message);
        throw new Error(message);
      }

      setIsLoading(true);

      try {
        const result = touchMediaAsset(id);
        handlePersistenceResult(result, setState, setError);
      } catch (value) {
        const normalized = createError(value);
        logger.error("❌ Impossible d'actualiser l'utilisation du média", normalized);
        setError(normalized.message);
        throw normalized;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    state,
    assets,
    isLoading,
    isProcessing,
    error,
    importFiles,
    updateAsset,
    deleteAsset,
    refreshAsset,
    markAssetAsUsed,
    clearError,
  };
};

export const parseTagsInput = (value: string): string[] => parseTags(value);

