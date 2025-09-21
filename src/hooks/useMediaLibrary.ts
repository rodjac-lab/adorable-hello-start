import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { compressImage } from "@/lib/imageCompression";
import {
  DEFAULT_MEDIA_QUOTA,
  MediaAsset,
  MediaLibraryState,
  addMediaAssets,
  estimateDataUrlSize,
  formatBytes,
  getMediaLibraryState,
  removeMediaAsset,
  saveMediaAssets,
  touchMediaAsset,
} from "@/lib/mediaStore";

const createInitialState = (): MediaLibraryState => ({
  assets: [],
  usage: {
    assetCount: 0,
    totalBytes: 0,
    maxAssets: DEFAULT_MEDIA_QUOTA.maxAssets,
    maxBytes: DEFAULT_MEDIA_QUOTA.maxBytes,
    remainingAssets: DEFAULT_MEDIA_QUOTA.maxAssets,
    remainingBytes: DEFAULT_MEDIA_QUOTA.maxBytes,
  },
});

export interface UploadError {
  fileName: string;
  reason: string;
}

export interface UploadResult {
  added: MediaAsset[];
  errors: UploadError[];
}

export const useMediaLibrary = () => {
  const [state, setState] = useState<MediaLibraryState>(createInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const refresh = useCallback(() => {
    const library = getMediaLibraryState();
    setState(library);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const usagePercent = useMemo(() => {
    if (state.usage.maxBytes === 0) {
      return 0;
    }
    return Math.min(100, Math.round((state.usage.totalBytes / state.usage.maxBytes) * 100));
  }, [state.usage.totalBytes, state.usage.maxBytes]);

  const uploadMedia = useCallback(
    async (files: File[]): Promise<UploadResult> => {
      if (!files || files.length === 0) {
        return { added: [], errors: [] };
      }

      setIsUploading(true);
      const errors: UploadError[] = [];
      const payloads: { file: File; dataUrl: string }[] = [];

      let remainingSlots = state.usage.remainingAssets;
      let remainingBytes = state.usage.remainingBytes;

      try {
        for (const file of files) {
          if (!file.type.startsWith("image")) {
            errors.push({ fileName: file.name, reason: "Format non supporté" });
            continue;
          }

          if (remainingSlots <= 0) {
            errors.push({ fileName: file.name, reason: "Quota de fichiers atteint" });
            continue;
          }

          try {
            const dataUrl = await compressImage(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.75,
              format: "jpeg",
            });

            const estimatedSize = estimateDataUrlSize(dataUrl);

            if (remainingBytes - estimatedSize < 0) {
              errors.push({ fileName: file.name, reason: "Quota de stockage dépassé" });
              continue;
            }

            remainingBytes -= estimatedSize;
            remainingSlots -= 1;
            payloads.push({ file, dataUrl });
          } catch (error) {
            console.error("❌ Upload impossible", error);
            errors.push({ fileName: file.name, reason: "Compression impossible" });
          }
        }

        if (payloads.length === 0) {
          if (errors.length) {
            const details = errors.map((error) => `${error.fileName}: ${error.reason}`).join(", ");
            toast.error("Aucun média n'a pu être importé", {
              description: details,
            });
          }
          return { added: [], errors };
        }

        const beforeIds = new Set(state.assets.map((asset) => asset.id));

        // Utiliser addMediaAssets pour construire les assets correctement (dimensions & IDs)
        const result = await addMediaAssets(
          payloads.map((payload) => ({
            name: payload.file.name,
            type: "image/jpeg",
            url: payload.dataUrl,
            originalSize: payload.file.size,
            source: "upload",
          })),
        );

        setState(result);

        const addedAssets = result.assets.filter((asset) => !beforeIds.has(asset.id)).slice(0, payloads.length);

        if (addedAssets.length) {
          toast.success(`${addedAssets.length} média(s) ajouté(s)`);
        }

        if (errors.length) {
          const details = errors.map((error) => `${error.fileName}: ${error.reason}`).join(", ");
          toast.warning("Certains médias n'ont pas été importés", {
            description: details,
          });
        }

        return { added: addedAssets, errors };
      } finally {
        setIsUploading(false);
      }
    },
    [state.usage.remainingAssets, state.usage.remainingBytes],
  );

  const deleteAsset = useCallback((assetId: string) => {
    const nextState = removeMediaAsset(assetId);
    setState(nextState);
    toast.success("Média supprimé");
  }, []);

  const markAsUsed = useCallback((assetId: string) => {
    const nextState = touchMediaAsset(assetId);
    setState(nextState);
  }, []);

  const replaceLibrary = useCallback((assets: MediaAsset[]) => {
    const nextState = saveMediaAssets(assets);
    setState(nextState);
  }, []);

  return {
    assets: state.assets,
    usage: state.usage,
    usagePercent,
    isLoading,
    isUploading,
    uploadMedia,
    deleteAsset,
    refresh,
    markAsUsed,
    replaceLibrary,
    formatBytes,
    DEFAULT_MEDIA_QUOTA,
  };
};
