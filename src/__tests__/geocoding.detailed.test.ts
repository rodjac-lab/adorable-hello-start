import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseLocationString, 
  parseJournalEntries, 
  classifyLocations,
  geocodeLocation,
  geocodeJournalEntries 
} from '@/lib/geocoding';
import { JournalEntry } from '@/lib/journalStorage';

describe('Geocoding Detailed Tests', () => {
  describe('parseLocationString', () => {
    it('should parse single location', () => {
      expect(parseLocationString('Amman')).toEqual(['Amman']);
    });

    it('should parse multiple comma-separated locations', () => {
      expect(parseLocationString('Jerash, Ajloun, Amman')).toEqual(['Jerash', 'Ajloun', 'Amman']);
    });

    it('should handle extra spaces', () => {
      expect(parseLocationString(' Jerash , Ajloun , Amman ')).toEqual(['Jerash', 'Ajloun', 'Amman']);
    });

    it('should filter empty strings', () => {
      expect(parseLocationString('Jerash,, Amman,')).toEqual(['Jerash', 'Amman']);
    });

    it('should handle empty input', () => {
      expect(parseLocationString('')).toEqual([]);
    });
  });

  describe('parseJournalEntries', () => {
    const mockEntries: JournalEntry[] = [
      {
        day: 1,
        date: '20 décembre 2024',
        title: 'Arrivée à Amman',
        location: 'Amman',
        story: 'Premier jour',
        mood: 'Excité',
        photos: []
      },
      {
        day: 2,
        date: '21 décembre 2024',
        title: 'Exploration du Nord',
        location: 'Jerash, Ajloun, Amman',
        story: 'Journée découverte',
        mood: 'Émerveillé',
        photos: []
      }
    ];

    it('should parse all journal entries correctly', () => {
      const result = parseJournalEntries(mockEntries);
      
      expect(result).toHaveLength(2);
      
      // Day 1: Single location
      expect(result[0]).toEqual({
        original: 'Amman',
        parsed: ['Amman'],
        day: 1,
        journalEntry: mockEntries[0]
      });
      
      // Day 2: Multiple locations
      expect(result[1]).toEqual({
        original: 'Jerash, Ajloun, Amman',
        parsed: ['Jerash', 'Ajloun', 'Amman'],
        day: 2,
        journalEntry: mockEntries[1]
      });
    });

    it('should handle empty entries', () => {
      expect(parseJournalEntries([])).toEqual([]);
    });
  });

  describe('classifyLocations', () => {
    const mockJournalEntry: JournalEntry = {
      day: 2,
      date: '21 décembre 2024',
      title: 'Test',
      location: 'Test location',
      story: 'Test story',
      mood: 'Test mood',
      photos: []
    };

    it('should classify single location as principal', () => {
      const result = classifyLocations(['Amman'], 1, mockJournalEntry);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Amman',
        type: 'principal',
        day: 1,
        journalEntry: mockJournalEntry
      });
    });

    it('should classify multiple locations with last as principal', () => {
      const result = classifyLocations(['Jerash', 'Ajloun', 'Amman'], 2, mockJournalEntry);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'Jerash',
        type: 'secondaire',
        day: 2,
        journalEntry: mockJournalEntry
      });
      expect(result[1]).toEqual({
        name: 'Ajloun',
        type: 'secondaire',
        day: 2,
        journalEntry: mockJournalEntry
      });
      expect(result[2]).toEqual({
        name: 'Amman',
        type: 'principal',
        day: 2,
        journalEntry: mockJournalEntry
      });
    });

    it('should handle empty locations', () => {
      expect(classifyLocations([], 1, mockJournalEntry)).toEqual([]);
    });
  });

  describe('geocodeLocation', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
      vi.clearAllMocks();
    });

    it('should find location in local Jordan database', async () => {
      const result = await geocodeLocation('Amman', 'test-token');
      
      expect(result).toEqual({
        name: 'Amman',
        coordinates: [35.9106, 31.9539],
        confidence: 0.9
      });
      
      // Should not call API when found locally
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should call Mapbox API for unknown locations', async () => {
      const mockResponse = {
        features: [{
          place_name: 'Test Place',
          center: [35.0, 32.0],
          relevance: 0.8
        }]
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await geocodeLocation('Unknown Place', 'test-token');
      
      expect(result).toEqual({
        name: 'Test Place',
        coordinates: [35.0, 32.0],
        confidence: 0.8
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.mapbox.com/geocoding/v5/mapbox.places/Unknown%20Place.json'),
      );
    });

    it('should return null when API fails', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await geocodeLocation('Unknown Place', 'test-token');
      
      expect(result).toBeNull();
    });

    it('should return null when no features found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      });

      const result = await geocodeLocation('Unknown Place', 'test-token');
      
      expect(result).toBeNull();
    });
  });

  describe('geocodeJournalEntries Integration', () => {
    const mockEntries: JournalEntry[] = [
      {
        day: 1,
        date: '20 décembre 2024',
        title: 'Arrivée à Amman',
        location: 'Amman',
        story: 'Premier jour',
        mood: 'Excité',
        photos: []
      },
      {
        day: 2,
        date: '21 décembre 2024',
        title: 'Exploration du Nord',
        location: 'Jerash, Ajloun, Amman',
        story: 'Journée découverte',
        mood: 'Émerveillé',
        photos: []
      }
    ];

    beforeEach(() => {
      global.fetch = vi.fn();
      vi.clearAllMocks();
    });

    it('should geocode all locations successfully', async () => {
      // All locations should be found in local database
      const result = await geocodeJournalEntries(mockEntries, 'test-token');
      
      expect(result).toHaveLength(4);
      
      // Day 1: Amman (principal)
      expect(result[0]).toEqual({
        name: 'Amman',
        coordinates: [35.9106, 31.9539],
        type: 'principal',
        day: 1,
        journalEntry: mockEntries[0]
      });
      
      // Day 2: Jerash (secondary), Ajloun (secondary), Amman (principal)
      expect(result[1].name).toBe('Jerash');
      expect(result[1].type).toBe('secondaire');
      expect(result[1].day).toBe(2);
      
      expect(result[2].name).toBe('Ajloun');
      expect(result[2].type).toBe('secondaire');
      expect(result[2].day).toBe(2);
      
      expect(result[3].name).toBe('Amman');
      expect(result[3].type).toBe('principal');
      expect(result[3].day).toBe(2);
    });

    it('should handle empty entries', async () => {
      const result = await geocodeJournalEntries([], 'test-token');
      expect(result).toEqual([]);
    });

    it('should call progress callback correctly', async () => {
      const onProgress = vi.fn();
      await geocodeJournalEntries(mockEntries, 'test-token', onProgress);
      
      // Should be called 4 times (once per location)
      expect(onProgress).toHaveBeenCalledTimes(4);
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 4);
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 4);
      expect(onProgress).toHaveBeenNthCalledWith(3, 3, 4);
      expect(onProgress).toHaveBeenNthCalledWith(4, 4, 4);
    });

    it('should skip locations that cannot be geocoded', async () => {
      const entriesWithUnknown: JournalEntry[] = [
        {
          day: 1,
          date: '20 décembre 2024',
          title: 'Test',
          location: 'Unknown Place, Amman',
          story: 'Test',
          mood: 'Test',
          photos: []
        }
      ];

      // Mock API to return empty for unknown place
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      });

      const result = await geocodeJournalEntries(entriesWithUnknown, 'test-token');
      
      // Should only find Amman (from local database)
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Amman');
    });
  });
});