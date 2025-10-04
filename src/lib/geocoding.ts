import { JournalEntry } from './journalStorage';
import {
  MapLocation,
  GeocodeResult,
  ParsedLocation,
  FailedLocation
} from '@/types/map';
import { mapContentActions } from './contentStore';
import { getRuntimeMode, RuntimeMode } from '@/utils/environment';

const geocodeCache = new Map<string, [number, number]>();

const jordanLocations: Record<string, [number, number]> = {
  amman: [31.9539, 35.9106],
  jerash: [32.2811, 35.8998],
  ajloun: [32.3326, 35.7519],
  ajlun: [32.3326, 35.7519],
  petra: [30.3285, 35.4444],
  'wadi rum': [29.5324, 35.4155],
  aqaba: [29.5262, 35.005],
  'dead sea': [31.559, 35.5883],
  'mer morte': [31.559, 35.5883],
  madaba: [31.7169, 35.7933],
  'mount nebo': [31.7687, 35.7269],
  'mont nebo': [31.7687, 35.7269],
  karak: [31.1804, 35.7058],
  irbid: [32.5556, 35.85],
  zarqa: [32.0722, 36.0882],
  salt: [32.0389, 35.7278],
  mafraq: [32.3434, 36.2076],
  tafilah: [30.8373, 35.6044],
  bethany: [31.8269, 35.6714],
  bethabara: [31.8269, 35.6714],
  jordanie: [31.9539, 35.9106],
  jordan: [31.9539, 35.9106],
  'amman et environ': [31.9539, 35.9106],
  'environ amman': [31.9539, 35.9106],
  "région d'amman": [31.9539, 35.9106],
  "région de amman": [31.9539, 35.9106],
  'secteur amman': [31.9539, 35.9106],
  "périphérie amman": [31.9539, 35.9106],
  "alentours amman": [31.9539, 35.9106],
  'zone amman': [31.9539, 35.9106]
};

class RateLimitedQueue {
  private tail = Promise.resolve();
  private lastExecution = 0;

  constructor(private readonly delayMs: number) {}

  schedule<T>(task: () => Promise<T>): Promise<T> {
    const runner = async () => {
      const now = Date.now();
      const wait = Math.max(0, this.delayMs - (now - this.lastExecution));
      if (wait > 0) {
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
      try {
        const result = await task();
        this.lastExecution = Date.now();
        return result;
      } catch (error) {
        this.lastExecution = Date.now();
        throw error;
      }
    };

    this.tail = this.tail.then(runner, runner);
    return this.tail as Promise<T>;
  }
}

const mapboxQueue = new RateLimitedQueue(350);

const buildMapboxUrl = (query: string, token: string) =>
  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=JO&types=place,locality,neighborhood&limit=1`;

const shouldUseRemoteGeocoding = (mode: RuntimeMode, token: string) => mode === 'studio' && Boolean(token);

export type GeocodeProgress = (current: number, total: number) => void;

export interface GeocodeOptions {
  onProgress?: GeocodeProgress;
  mode?: RuntimeMode;
  persistToStore?: boolean;
}

export async function geocodeLocation(
  locationName: string,
  mapboxToken: string,
  mode: RuntimeMode = getRuntimeMode()
): Promise<GeocodeResult | null> {
  const cleanName = locationName.toLowerCase().trim();

  if (geocodeCache.has(cleanName)) {
    const coords = geocodeCache.get(cleanName)!;
    return {
      name: locationName,
      coordinates: coords,
      confidence: 1
    };
  }

  if (jordanLocations[cleanName]) {
    const coords = jordanLocations[cleanName];
    geocodeCache.set(cleanName, coords);
    return {
      name: locationName,
      coordinates: coords,
      confidence: 0.9
    };
  }

  if (!shouldUseRemoteGeocoding(mode, mapboxToken)) {
    return null;
  }

  try {
    const response = await mapboxQueue.schedule(() => fetch(buildMapboxUrl(locationName, mapboxToken)));

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coords: [number, number] = [feature.center[1], feature.center[0]];
      geocodeCache.set(cleanName, coords);
      return {
        name: feature.place_name || locationName,
        coordinates: coords,
        confidence: feature.relevance || 0.5
      };
    }
  } catch (error) {
    console.error(`❌ Erreur de géocodage pour "${locationName}":`, error);
    throw error;
  }

  return null;
}

export function parseLocationString(locationString: string): string[] {
  return locationString
    .split(/[,;]/)
    .map((loc) => loc.trim())
    .filter((loc) => loc.length > 0)
    .map((loc) => loc.replace(/^(à|en|de|du|des|le|la|les)\s+/i, '').replace(/\s+/g, ' ').trim());
}

export function parseJournalEntries(entries: JournalEntry[]): ParsedLocation[] {
  return entries.map((entry) => {
    const parsedLocations = parseLocationString(entry.location);
    return {
      original: entry.location,
      parsed: parsedLocations,
      day: entry.day,
      journalEntry: entry
    };
  });
}

export function classifyLocations(
  parsedLocations: string[],
  day: number,
  journalEntry: JournalEntry
): Omit<MapLocation, 'coordinates'>[] {
  if (parsedLocations.length === 0) return [];

  if (parsedLocations.length === 1) {
    return [
      {
        name: parsedLocations[0],
        type: 'principal',
        day,
        journalEntry
      }
    ];
  }

  return parsedLocations.map((location, index) => ({
    name: location,
    type: index === parsedLocations.length - 1 ? 'principal' : 'secondaire',
    day,
    journalEntry
  }));
}

const getTotalLocationCount = (parsedEntries: ParsedLocation[]): number =>
  parsedEntries.reduce((total, entry) => total + entry.parsed.length, 0);

const formatFailureReason = (
  mode: RuntimeMode,
  token: string,
  error?: unknown
): string | undefined => {
  if (error instanceof Error) {
    return error.message;
  }
  if (!shouldUseRemoteGeocoding(mode, token)) {
    return "Mode lecture: géocodage distant désactivé";
  }
  return undefined;
};

export async function geocodeJournalEntries(
  entries: JournalEntry[],
  mapboxToken: string,
  options?: GeocodeProgress | GeocodeOptions
): Promise<MapLocation[]> {
  const resolvedOptions: GeocodeOptions =
    typeof options === 'function' ? { onProgress: options } : options ?? {};
  const mode = resolvedOptions.mode ?? getRuntimeMode();
  const persist = resolvedOptions.persistToStore ?? true;

  if (entries.length === 0) {
    if (persist) {
      mapContentActions.completeGeocoding({ pending: [], failed: [], error: undefined });
    }
    return [];
  }

  const parsedEntries = parseJournalEntries(entries);
  const totalCount = getTotalLocationCount(parsedEntries);

  const pending: MapLocation[] = [];
  const failed: FailedLocation[] = [];

  if (persist) {
    mapContentActions.startGeocoding();
  }

  let processed = 0;

  try {
    // Flatten all locations to process them in parallel
    const allLocations = parsedEntries.flatMap((parsedEntry) =>
      classifyLocations(
        parsedEntry.parsed,
        parsedEntry.day,
        parsedEntry.journalEntry
      )
    );

    // Process all locations in parallel with Promise.all
    const results = await Promise.all(
      allLocations.map(async (location) => {
        try {
          const geocodeResult = await geocodeLocation(location.name, mapboxToken, mode);

          processed += 1;
          resolvedOptions.onProgress?.(processed, totalCount);

          if (geocodeResult) {
            return {
              success: true as const,
              location: {
                ...location,
                coordinates: geocodeResult.coordinates
              }
            };
          } else {
            return {
              success: false as const,
              failed: {
                name: location.name,
                day: location.day,
                journalEntry: location.journalEntry,
                reason:
                  mode === 'studio'
                    ? "Aucune coordonnée trouvée"
                    : 'Mode lecture: géocodage distant désactivé'
              }
            };
          }
        } catch (error) {
          processed += 1;
          resolvedOptions.onProgress?.(processed, totalCount);

          return {
            success: false as const,
            failed: {
              name: location.name,
              day: location.day,
              journalEntry: location.journalEntry,
              reason: formatFailureReason(mode, mapboxToken, error)
            }
          };
        }
      })
    );

    // Separate successful and failed results
    results.forEach((result) => {
      if (result.success) {
        pending.push(result.location);
      } else {
        failed.push(result.failed);
      }
    });

    if (persist) {
      mapContentActions.completeGeocoding({ pending, failed, error: undefined });
    }
  } catch (error) {
    if (persist) {
      mapContentActions.completeGeocoding({
        pending,
        failed,
        error: formatFailureReason(mode, mapboxToken, error)
      });
    }
    throw error;
  }

  return pending;
}
