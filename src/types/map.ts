import { JournalEntry } from '@/lib/journalStorage';

export interface MapLocation {
  name: string;
  coordinates: [number, number];
  type: 'principal' | 'secondaire';
  day: number;
  journalEntry: JournalEntry;
}

export interface GeocodeResult {
  name: string;
  coordinates: [number, number];
  confidence: number;
}

export interface ParsedLocation {
  original: string;
  parsed: string[];
  day: number;
  journalEntry: JournalEntry;
}

export type MapContentStatus =
  | 'idle'
  | 'geocoding'
  | 'awaiting-validation'
  | 'ready'
  | 'error';

export interface FailedLocation {
  name: string;
  day: number;
  journalEntry: JournalEntry;
  reason?: string;
}

export interface MapContentState {
  mapLocations: MapLocation[];
  pendingLocations: MapLocation[];
  failedLocations: FailedLocation[];
  status: MapContentStatus;
  lastGeocodeAt: string | null;
  error?: string;
}