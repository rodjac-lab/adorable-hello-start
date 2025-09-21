export type RuntimeMode = 'studio' | 'readonly';

const detectMode = (): RuntimeMode => {
  const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : undefined;
  if (env) {
    if (env.VITE_STUDIO_MODE === 'true' || env.STUDIO_MODE === 'true') {
      return 'studio';
    }
    if (env.MODE === 'studio') {
      return 'studio';
    }
  }

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_STUDIO_MODE === 'true' || process.env.STUDIO_MODE === 'true') {
      return 'studio';
    }
    if (process.env.NODE_ENV === 'studio') {
      return 'studio';
    }
  }

  return 'readonly';
};

let cachedMode: RuntimeMode | null = null;

export const isStudioMode = (): boolean => {
  if (cachedMode === null) {
    cachedMode = detectMode();
  }
  return cachedMode === 'studio';
};

export const getRuntimeMode = (): RuntimeMode => {
  if (cachedMode === null) {
    cachedMode = detectMode();
  }
  return cachedMode;
};

export const forceRuntimeMode = (mode: RuntimeMode | null) => {
  cachedMode = mode;
};
