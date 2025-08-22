import { JournalEntry } from './journalStorage';
import { MapLocation, GeocodeResult, ParsedLocation } from '@/types/map';

// Cache pour éviter les re-géocodages
const geocodeCache = new Map<string, [number, number]>();

// Base de données de lieux jordaniens populaires
const jordanLocations: Record<string, [number, number]> = {
  'amman': [35.9106, 31.9539],
  'jerash': [35.8998, 32.2811],
  'ajloun': [35.7519, 32.3326],
  'petra': [35.4444, 30.3285],
  'wadi rum': [35.4155, 29.5324],
  'aqaba': [35.0050, 29.5262],
  'dead sea': [35.5883, 31.5590],
  'madaba': [35.7933, 31.7169],
  'mount nebo': [35.7269, 31.7687],
  'karak': [35.7058, 31.1804],
  'irbid': [35.8500, 32.5556],
  'zarqa': [36.0882, 32.0722],
  'salt': [35.7278, 32.0389],
  'mafraq': [36.2076, 32.3434],
  'tafilah': [35.6044, 30.8373]
};

export async function geocodeLocation(locationName: string, mapboxToken: string): Promise<GeocodeResult | null> {
  const cleanName = locationName.toLowerCase().trim();
  
  // Vérifier le cache d'abord
  if (geocodeCache.has(cleanName)) {
    const coords = geocodeCache.get(cleanName)!;
    return {
      name: locationName,
      coordinates: coords,
      confidence: 1.0
    };
  }

  // Vérifier la base de données locale
  if (jordanLocations[cleanName]) {
    const coords = jordanLocations[cleanName];
    geocodeCache.set(cleanName, coords);
    return {
      name: locationName,
      coordinates: coords,
      confidence: 0.9
    };
  }

  // Utiliser l'API Mapbox Geocoding
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?` +
      `access_token=${mapboxToken}&` +
      `country=JO&` +
      `types=place,locality,neighborhood&` +
      `limit=1`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coords: [number, number] = [feature.center[0], feature.center[1]];
      
      // Mettre en cache
      geocodeCache.set(cleanName, coords);
      
      return {
        name: feature.place_name || locationName,
        coordinates: coords,
        confidence: feature.relevance || 0.5
      };
    }
  } catch (error) {
    console.error(`Erreur de géocodage pour "${locationName}":`, error);
  }

  return null;
}

export function parseLocationString(locationString: string): string[] {
  return locationString
    .split(',')
    .map(loc => loc.trim())
    .filter(loc => loc.length > 0);
}

export function parseJournalEntries(entries: JournalEntry[]): ParsedLocation[] {
  return entries.map(entry => ({
    original: entry.location,
    parsed: parseLocationString(entry.location),
    day: entry.day,
    journalEntry: entry
  }));
}

export function classifyLocations(parsedLocations: string[], day: number, journalEntry: JournalEntry): Omit<MapLocation, 'coordinates'>[] {
  if (parsedLocations.length === 0) return [];
  
  if (parsedLocations.length === 1) {
    return [{
      name: parsedLocations[0],
      type: 'principal',
      day,
      journalEntry
    }];
  }

  // Pour plusieurs locations : la dernière est principale, les autres sont secondaires
  return parsedLocations.map((location, index) => ({
    name: location,
    type: index === parsedLocations.length - 1 ? 'principal' : 'secondaire',
    day,
    journalEntry
  }));
}

export async function geocodeJournalEntries(
  entries: JournalEntry[],
  mapboxToken: string,
  onProgress?: (current: number, total: number) => void
): Promise<MapLocation[]> {
  const parsedEntries = parseJournalEntries(entries);
  const allLocations: MapLocation[] = [];
  let processed = 0;

  for (const parsedEntry of parsedEntries) {
    const classifiedLocations = classifyLocations(
      parsedEntry.parsed,
      parsedEntry.day,
      parsedEntry.journalEntry
    );

    for (const location of classifiedLocations) {
      const geocodeResult = await geocodeLocation(location.name, mapboxToken);
      
      if (geocodeResult) {
        allLocations.push({
          ...location,
          coordinates: geocodeResult.coordinates
        });
      }
      
      processed++;
      onProgress?.(processed, getTotalLocationCount(parsedEntries));
    }
  }

  return allLocations;
}

function getTotalLocationCount(parsedEntries: ParsedLocation[]): number {
  return parsedEntries.reduce((total, entry) => total + entry.parsed.length, 0);
}