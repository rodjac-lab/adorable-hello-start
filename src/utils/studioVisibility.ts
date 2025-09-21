const STORAGE_KEY = "studioVisible";

const truthyValues = new Set(["1", "true", "on", "yes"]);
const falsyValues = new Set(["0", "false", "off", "no"]);

const parseBoolean = (value: string | null | undefined): boolean | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (truthyValues.has(normalized)) {
    return true;
  }

  if (falsyValues.has(normalized)) {
    return false;
  }

  return null;
};

/**
 * Returns whether the studio area should be visible based on localStorage or environment variables.
 * Local storage takes precedence over environment configuration.
 */
export const getStudioVisibility = (): boolean => {
  if (typeof window !== "undefined") {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      const parsedStored = parseBoolean(storedValue);

      if (parsedStored !== null) {
        return parsedStored;
      }
    } catch (error) {
      console.warn("Unable to read studio visibility from localStorage", error);
    }
  }

  const envValue = import.meta.env.VITE_STUDIO_VISIBLE as string | undefined;
  const parsedEnv = parseBoolean(envValue);

  return parsedEnv ?? false;
};

/**
 * Persist the studio visibility flag in localStorage for subsequent sessions.
 */
export const setStudioVisibility = (visible: boolean) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, visible ? "true" : "false");
  } catch (error) {
    console.warn("Unable to persist studio visibility", error);
  }
};

/**
 * Subscribe to visibility changes triggered via storage events.
 */
export const subscribeToStudioVisibility = (callback: (visible: boolean) => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    const parsed = parseBoolean(event.newValue);
    callback(parsed ?? false);
  };

  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener("storage", handler);
  };
};
