import { useEffect, useState } from "react";
import {
  getMediaLibraryState,
  MEDIA_LIBRARY_UPDATED_EVENT,
  type MediaLibraryState,
} from "@/lib/mediaStore";

const isBrowser = typeof window !== "undefined" && typeof window.addEventListener === "function";

type MediaLibraryUpdateEvent = Event & { detail?: MediaLibraryState };

export const useMediaLibraryState = (): MediaLibraryState => {
  const [state, setState] = useState<MediaLibraryState>(() => getMediaLibraryState());

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const handleUpdate = (event: MediaLibraryUpdateEvent) => {
      if (event.detail) {
        setState(event.detail);
        return;
      }

      setState(getMediaLibraryState());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key.startsWith("mediaLibraryAssets")) {
        setState(getMediaLibraryState());
      }
    };

    window.addEventListener(MEDIA_LIBRARY_UPDATED_EVENT, handleUpdate as EventListener);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(MEDIA_LIBRARY_UPDATED_EVENT, handleUpdate as EventListener);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return state;
};
