import { describe, it, expect, beforeEach } from 'vitest';
import { 
  parseLocationString, 
  parseJournalEntries, 
  classifyLocations,
  geocodeLocation
} from '@/lib/geocoding';
import { JournalEntry } from '@/lib/journalStorage';

describe('Geocoding Bug Fix Tests', () => {
  describe('parseLocationString enhanced parsing', () => {
    it('should handle French location formats', () => {
      expect(parseLocationString('Amman, Jordanie')).toEqual(['Amman', 'Jordanie']);
      expect(parseLocationString('à Jerash, en Jordanie')).toEqual(['Jerash', 'Jordanie']);
      expect(parseLocationString('du château de Ajloun')).toEqual(['château de Ajloun']);
    });

    it('should support semicolon separation', () => {
      expect(parseLocationString('Jerash; Ajloun; Amman')).toEqual(['Jerash', 'Ajloun', 'Amman']);
    });

    it('should remove French articles', () => {
      expect(parseLocationString('le château de Ajloun')).toEqual(['château de Ajloun']);
      expect(parseLocationString('la mer Morte')).toEqual(['mer Morte']);
    });
  });

  describe('Jordan locations database', () => {
    it('should find Bethany in local database', async () => {
      const result = await geocodeLocation('Bethany', 'test-token');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Bethany');
      expect(result?.coordinates).toEqual([35.6714, 31.8269]);
    });

    it('should find Jordanie (as fallback to Amman)', async () => {
      const result = await geocodeLocation('Jordanie', 'test-token');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Jordanie');
      expect(result?.coordinates).toEqual([35.9106, 31.9539]);
    });

    it('should handle Ajlun/Ajloun variations', async () => {
      const result1 = await geocodeLocation('Ajlun', 'test-token');
      const result2 = await geocodeLocation('Ajloun', 'test-token');
      
      expect(result1).not.toBeNull();
      expect(result2).not.toBeNull();
      expect(result1?.coordinates).toEqual(result2?.coordinates);
    });
  });

  describe('Real user data processing', () => {
    const realUserEntries: JournalEntry[] = [
      {
        day: 1,
        date: "15 mars 2024",
        title: "Arrivée à Amman",
        location: "Amman, Jordanie",
        story: "Premier jour",
        mood: "Enthousiaste",
        photos: []
      },
      {
        day: 2,
        date: "16 mars 2024",
        title: "Jerash, Ajlun et spa à Amman",
        location: "Jerash, Ajlun, Amman",
        story: "Exploration",
        mood: "Mitigé",
        photos: []
      }
    ];

    it('should parse real user entries correctly', () => {
      const parsed = parseJournalEntries(realUserEntries);
      
      expect(parsed).toHaveLength(2);
      
      // Day 1: "Amman, Jordanie" → ["Amman", "Jordanie"]
      expect(parsed[0].parsed).toEqual(['Amman', 'Jordanie']);
      
      // Day 2: "Jerash, Ajlun, Amman" → ["Jerash", "Ajlun", "Amman"]
      expect(parsed[1].parsed).toEqual(['Jerash', 'Ajlun', 'Amman']);
    });

    it('should classify real user locations correctly', () => {
      // Day 1: 2 locations → Amman principal, Jordanie secondaire
      const day1Locations = classifyLocations(['Amman', 'Jordanie'], 1, realUserEntries[0]);
      expect(day1Locations).toHaveLength(2);
      expect(day1Locations[0]).toMatchObject({ name: 'Amman', type: 'secondaire' });
      expect(day1Locations[1]).toMatchObject({ name: 'Jordanie', type: 'principal' });
      
      // Day 2: 3 locations → 2 secondaires + 1 principal
      const day2Locations = classifyLocations(['Jerash', 'Ajlun', 'Amman'], 2, realUserEntries[1]);
      expect(day2Locations).toHaveLength(3);
      expect(day2Locations[0]).toMatchObject({ name: 'Jerash', type: 'secondaire' });
      expect(day2Locations[1]).toMatchObject({ name: 'Ajlun', type: 'secondaire' });
      expect(day2Locations[2]).toMatchObject({ name: 'Amman', type: 'principal' });
    });

    it('should geocode all real user locations successfully', async () => {
      // Test each location individually to ensure they all work
      const locationTests = [
        'Amman',
        'Jordanie', 
        'Jerash',
        'Ajlun'
      ];

      for (const location of locationTests) {
        const result = await geocodeLocation(location, 'test-token');
        expect(result, `Failed to geocode ${location}`).not.toBeNull();
        expect(result?.coordinates).toHaveLength(2);
        expect(typeof result?.coordinates[0]).toBe('number');
        expect(typeof result?.coordinates[1]).toBe('number');
      }
    });
  });

  describe('Expected total markers for user', () => {
    it('should produce exactly 5 markers from user data', () => {
      const realUserEntries: JournalEntry[] = [
        {
          day: 1,
          date: "15 mars 2024",
          title: "Arrivée à Amman", 
          location: "Amman, Jordanie",
          story: "Premier jour",
          mood: "Enthousiaste",
          photos: []
        },
        {
          day: 2,
          date: "16 mars 2024",
          title: "Jerash, Ajlun et spa à Amman",
          location: "Jerash, Ajlun, Amman", 
          story: "Exploration",
          mood: "Mitigé",
          photos: []
        }
      ];

      const parsed = parseJournalEntries(realUserEntries);
      const totalLocations = parsed.reduce((total, entry) => total + entry.parsed.length, 0);
      
      // Day 1: "Amman, Jordanie" = 2 locations
      // Day 2: "Jerash, Ajlun, Amman" = 3 locations  
      // Total expected: 5 markers
      expect(totalLocations).toBe(5);
    });
  });
});