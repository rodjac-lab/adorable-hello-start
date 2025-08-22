import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseLocationString, 
  parseJournalEntries, 
  classifyLocations,
  geocodeLocation,
  geocodeJournalEntries
} from '@/lib/geocoding';
import { JournalEntry } from '@/lib/journalStorage';

// Mock fetch pour les tests de l'API Mapbox
global.fetch = vi.fn();

describe('SPÉCIFICATION: Service de géocodage intelligent', () => {
  const sampleJournalEntries: JournalEntry[] = [
    {
      day: 1,
      date: '12 septembre 2024',
      title: 'Arrivée en Jordanie',
      location: 'Amman, Jordanie',
      story: 'Premier jour...',
      mood: 'Excité',
      photos: []
    },
    {
      day: 2,
      date: '13 septembre 2024',
      title: 'Visite du nord',
      location: 'Jerash, Ajlun, Amman',
      story: 'Exploration...',
      mood: 'Émerveillé',
      photos: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SPÉCIFICATION: Parsing des chaînes de lieux', () => {
    it('devrait parser une chaîne de lieux séparés par des virgules', () => {
      const result = parseLocationString('Jerash, Ajlun, Amman');
      expect(result).toEqual(['Jerash', 'Ajlun', 'Amman']);
    });

    it('devrait gérer les espaces supplémentaires et les chaînes vides', () => {
      const result = parseLocationString('  Jerash  , , Ajlun,   Amman  ');
      expect(result).toEqual(['Jerash', 'Ajlun', 'Amman']);
    });

    it('devrait retourner un tableau vide pour une chaîne vide', () => {
      const result = parseLocationString('');
      expect(result).toEqual([]);
    });
  });

  describe('SPÉCIFICATION: Parsing des entrées de journal', () => {
    it('devrait parser toutes les entrées de journal avec les bonnes métadonnées', () => {
      const result = parseJournalEntries(sampleJournalEntries);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        original: 'Amman, Jordanie',
        parsed: ['Amman', 'Jordanie'],
        day: 1,
        journalEntry: sampleJournalEntries[0]
      });
      expect(result[1]).toEqual({
        original: 'Jerash, Ajlun, Amman',
        parsed: ['Jerash', 'Ajlun', 'Amman'],
        day: 2,
        journalEntry: sampleJournalEntries[1]
      });
    });
  });

  describe('SPÉCIFICATION: Classification des lieux', () => {
    it('devrait classer un lieu unique comme principal', () => {
      const result = classifyLocations(['Amman'], 1, sampleJournalEntries[0]);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Amman',
        type: 'principal',
        day: 1
      });
    });

    it('devrait classer le dernier lieu comme principal et les autres comme secondaires', () => {
      const result = classifyLocations(['Jerash', 'Ajlun', 'Amman'], 2, sampleJournalEntries[1]);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        name: 'Jerash',
        type: 'secondaire',
        day: 2
      });
      expect(result[1]).toMatchObject({
        name: 'Ajlun',
        type: 'secondaire',
        day: 2
      });
      expect(result[2]).toMatchObject({
        name: 'Amman',
        type: 'principal',
        day: 2
      });
    });

    it('devrait retourner un tableau vide pour aucun lieu', () => {
      const result = classifyLocations([], 1, sampleJournalEntries[0]);
      expect(result).toEqual([]);
    });
  });

  describe('SPÉCIFICATION: Géocodage de lieux individuels', () => {
    it('devrait retourner les coordonnées depuis la base de données locale pour un lieu jordanien connu', async () => {
      const result = await geocodeLocation('Amman', 'fake_token');
      
      expect(result).toEqual({
        name: 'Amman',
        coordinates: [35.9106, 31.9539],
        confidence: 0.9
      });
    });

    it('devrait utiliser l\'API Mapbox pour les lieux non trouvés localement', async () => {
      const mockMapboxResponse = {
        features: [{
          place_name: 'Lieu Test, Jordan',
          center: [35.0000, 32.0000],
          relevance: 0.8
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMapboxResponse)
      });

      const result = await geocodeLocation('Lieu Test', 'pk.test_token');
      
      expect(result).toEqual({
        name: 'Lieu Test, Jordan',
        coordinates: [35.0000, 32.0000],
        confidence: 0.8
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://api.mapbox.com/geocoding/v5/mapbox.places/Lieu%20Test.json'),
        expect.anything()
      );
    });

    it('devrait retourner null si l\'API Mapbox échoue', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const result = await geocodeLocation('Lieu Inexistant', 'invalid_token');
      expect(result).toBeNull();
    });

    it('devrait retourner null si aucune feature n\'est trouvée', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ features: [] })
      });

      const result = await geocodeLocation('Lieu Inexistant', 'pk.test_token');
      expect(result).toBeNull();
    });
  });

  describe('SPÉCIFICATION: Géocodage complet des entrées de journal', () => {
    it('devrait géocoder toutes les entrées et retourner les lieux avec coordonnées', async () => {
      // Mock pour que l'API Mapbox retourne des coordonnées pour "Jordanie"
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          features: [{
            place_name: 'Jordanie',
            center: [36.0000, 31.0000],
            relevance: 0.7
          }]
        })
      });

      const result = await geocodeJournalEntries(sampleJournalEntries, 'pk.test_token');
      
      expect(result).toHaveLength(4); // 2 lieux jour 1 + 3 lieux jour 2 - 1 dupliqué
      
      // Vérifier les types et coordonnées
      const ammanDay1 = result.find(l => l.name === 'Amman' && l.day === 1);
      expect(ammanDay1).toMatchObject({
        name: 'Amman',
        type: 'principal',
        day: 1,
        coordinates: [35.9106, 31.9539]
      });

      const jerashDay2 = result.find(l => l.name === 'Jerash' && l.day === 2);
      expect(jerashDay2).toMatchObject({
        name: 'Jerash',
        type: 'secondaire',
        day: 2,
        coordinates: [35.8998, 32.2811]
      });
    });

    it('devrait appeler la fonction de progression si fournie', async () => {
      const mockProgress = vi.fn();
      
      // Mock pour que Jordanie soit trouvée par l'API
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          features: [{
            place_name: 'Jordanie',
            center: [36.0000, 31.0000],
            relevance: 0.7
          }]
        })
      });

      await geocodeJournalEntries(sampleJournalEntries, 'pk.test_token', mockProgress);
      
      // La fonction de progression devrait être appelée plusieurs fois
      expect(mockProgress).toHaveBeenCalled();
      
      // Vérifier la dernière valeur appelée (5 lieux au total)
      const lastCall = mockProgress.mock.calls[mockProgress.mock.calls.length - 1];
      expect(lastCall[1]).toBe(5); // Total expected
    });

    it('devrait retourner un tableau vide si aucune entrée n\'est fournie', async () => {
      const result = await geocodeJournalEntries([], 'pk.test_token');
      expect(result).toEqual([]);
    });
  });
});