import { useSyncExternalStore } from 'react';
import { MapLocation, FailedLocation } from '@/types/map';
import type { MapContentStatus, MapContentState } from '@/types/map';

export interface ContentStoreActions {
  startGeocoding: () => void;
  completeGeocoding: (payload: {
    pending: MapLocation[];
    failed: FailedLocation[];
    error?: string;
  }) => void;
  cancelGeocoding: (message?: string) => void;
  validateLocations: (locations: MapLocation[]) => void;
  setPendingLocations: (locations: MapLocation[]) => void;
  updatePendingLocation: (index: number, updater: (location: MapLocation) => MapLocation) => void;
  removePendingLocation: (index: number) => void;
  addPendingLocation: (location: MapLocation) => void;
  reset: () => void;
}

type Listener = (state: MapContentState) => void;

const defaultState: MapContentState = {
  mapLocations: [],
  pendingLocations: [],
  failedLocations: [],
  status: 'idle',
  lastGeocodeAt: null,
  error: undefined
};

const cloneState = (state: MapContentState = defaultState): MapContentState =>
  JSON.parse(JSON.stringify(state)) as MapContentState;

class ContentStore {
  private state: MapContentState = cloneState();
  private listeners = new Set<Listener>();

  getState = (): MapContentState => this.state;

  private emit() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  setState = (updater: Partial<MapContentState> | ((state: MapContentState) => MapContentState)) => {
    if (typeof updater === 'function') {
      this.state = updater(this.state);
    } else {
      this.state = { ...this.state, ...updater };
    }
    this.emit();
  };

  reset = () => {
    this.state = cloneState();
    this.emit();
  };

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const contentStore = new ContentStore();

export const mapContentActions: ContentStoreActions = {
  startGeocoding: () => {
    contentStore.setState((state) => ({
      ...state,
      status: 'geocoding',
      pendingLocations: [],
      failedLocations: [],
      error: undefined
    }));
  },
  completeGeocoding: ({ pending, failed, error }) => {
    contentStore.setState((state) => ({
      ...state,
      pendingLocations: pending,
      failedLocations: failed,
      status: error ? 'error' : pending.length > 0 ? 'awaiting-validation' : 'ready',
      error,
      lastGeocodeAt: new Date().toISOString()
    }));
  },
  cancelGeocoding: (message) => {
    contentStore.setState((state) => ({
      ...state,
      status: 'error',
      error: message ?? 'Le géocodage a été annulé.'
    }));
  },
  validateLocations: (locations) => {
    contentStore.setState((state) => ({
      ...state,
      mapLocations: locations,
      pendingLocations: [],
      status: 'ready',
      error: undefined
    }));
  },
  setPendingLocations: (locations) => {
    contentStore.setState((state) => ({
      ...state,
      pendingLocations: locations
    }));
  },
  updatePendingLocation: (index, updater) => {
    contentStore.setState((state) => {
      const next = [...state.pendingLocations];
      if (!next[index]) {
        return state;
      }
      next[index] = updater(next[index]);
      return { ...state, pendingLocations: next };
    });
  },
  removePendingLocation: (index) => {
    contentStore.setState((state) => {
      const next = state.pendingLocations.filter((_, i) => i !== index);
      return { ...state, pendingLocations: next };
    });
  },
  addPendingLocation: (location) => {
    contentStore.setState((state) => ({
      ...state,
      pendingLocations: [...state.pendingLocations, location]
    }));
  },
  reset: () => {
    contentStore.reset();
  }
};

export function useMapContent<T>(selector: (state: MapContentState) => T): T {
  const subscribe = (callback: Listener) => contentStore.subscribe(callback);
  const getSnapshot = () => selector(contentStore.getState());
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
