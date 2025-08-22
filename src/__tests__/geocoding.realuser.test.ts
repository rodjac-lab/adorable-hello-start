import { describe, it, expect, vi } from 'vitest';
import {
  parseLocationString,
  parseJournalEntries,
  classifyLocations,
  geocodeLocation,
  geocodeJournalEntries
} from '@/lib/geocoding';
import { JournalEntry } from '@/lib/journalStorage';

// Mock des vraies données utilisateur (3 entrées)
const realUserEntries: JournalEntry[] = [
  {
    day: 1,
    title: 'Arrivée en Jordanie',
    story: 'Premier jour en Jordanie...',
    location: 'Amman, Jordanie',
    mood: 'Enthousiaste',
    date: '2024-01-01'
  },
  {
    day: 2,
    title: 'Exploration du nord',
    story: 'Visite des sites historiques...',
    location: 'Jerash, Ajlun, Amman',
    mood: 'Mitigé',
    date: '2024-01-02'
  },
  {
    day: 3, 
    title: 'Amman et ses environs',
    story: 'Découverte de la région...',
    location: 'Amman et environ',
    mood: 'Enthousiaste',
    date: '2024-01-03'
  }
];

describe('Geocoding - Real User Data (3 entries)', () => {
  it('should parse all 3 user entries correctly', () => {
    const parsed = parseJournalEntries(realUserEntries);
    
    expect(parsed).toHaveLength(3);
    
    // Jour 1: "Amman, Jordanie" → [Amman, Jordanie]
    expect(parsed[0].parsed).toEqual(['Amman', 'Jordanie']);
    expect(parsed[0].day).toBe(1);
    
    // Jour 2: "Jerash, Ajlun, Amman" → [Jerash, Ajlun, Amman]  
    expect(parsed[1].parsed).toEqual(['Jerash', 'Ajlun', 'Amman']);
    expect(parsed[1].day).toBe(2);
    
    // Jour 3: "Amman et environ" → [Amman et environ]
    expect(parsed[2].parsed).toEqual(['Amman et environ']);
    expect(parsed[2].day).toBe(3);
  });

  it('should classify locations correctly for expected 6 markers total', () => {
    const parsed = parseJournalEntries(realUserEntries);
    
    let totalMarkers = 0;
    
    parsed.forEach(entry => {
      const classified = classifyLocations(entry.parsed, entry.day, entry.journalEntry);
      totalMarkers += classified.length;
      
      if (entry.day === 1) {
        // Jour 1: Amman (secondaire), Jordanie (principal) = 2 marqueurs
        expect(classified).toHaveLength(2);
        expect(classified[0]).toMatchObject({ name: 'Amman', type: 'secondaire' });
        expect(classified[1]).toMatchObject({ name: 'Jordanie', type: 'principal' });
      } else if (entry.day === 2) {
        // Jour 2: Jerash (secondaire), Ajlun (secondaire), Amman (principal) = 3 marqueurs
        expect(classified).toHaveLength(3);
        expect(classified[0]).toMatchObject({ name: 'Jerash', type: 'secondaire' });
        expect(classified[1]).toMatchObject({ name: 'Ajlun', type: 'secondaire' });
        expect(classified[2]).toMatchObject({ name: 'Amman', type: 'principal' });
      } else if (entry.day === 3) {
        // Jour 3: "Amman et environ" (principal) = 1 marqueur
        expect(classified).toHaveLength(1);
        expect(classified[0]).toMatchObject({ name: 'Amman et environ', type: 'principal' });
      }
    });
    
    // Total attendu: 2 + 3 + 1 = 6 marqueurs
    expect(totalMarkers).toBe(6);
  });

  it('should geocode problematic "Amman et environ" location', async () => {
    const result = await geocodeLocation('Amman et environ', 'fake-token');
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Amman et environ');
    expect(result?.coordinates).toEqual([35.9106, 31.9539]); // Coordonnées d'Amman
    expect(result?.confidence).toBe(0.9);
  });

  it('should geocode all user locations successfully', async () => {
    const mockToken = 'fake-mapbox-token';
    
    const locations = await geocodeJournalEntries(realUserEntries, mockToken);
    
    // Devrait avoir 6 locations géocodées avec succès
    expect(locations).toHaveLength(6);
    
    // Vérifier que toutes les locations ont des coordonnées
    locations.forEach(location => {
      expect(location.coordinates).toBeDefined();
      expect(location.coordinates).toHaveLength(2);
      expect(typeof location.coordinates[0]).toBe('number');
      expect(typeof location.coordinates[1]).toBe('number');
    });
    
    // Vérifier la répartition par jour
    const jour1Locations = locations.filter(l => l.day === 1);
    const jour2Locations = locations.filter(l => l.day === 2);
    const jour3Locations = locations.filter(l => l.day === 3);
    
    expect(jour1Locations).toHaveLength(2); // Amman, Jordanie
    expect(jour2Locations).toHaveLength(3); // Jerash, Ajlun, Amman
    expect(jour3Locations).toHaveLength(1); // Amman et environ
  });

  it('should handle "Amman et environ" parsing correctly', () => {
    const result = parseLocationString('Amman et environ');
    expect(result).toEqual(['Amman et environ']);
  });
});