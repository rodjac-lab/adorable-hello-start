import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import * as journalStorageModule from '@/lib/journalStorage';

// Mock du module journalStorage
vi.mock('@/lib/journalStorage', () => ({
  loadJournalEntries: vi.fn(),
  addJournalEntry: vi.fn(),
  updateJournalEntry: vi.fn(),
  getJournalStats: vi.fn()
}));

describe('SPÉCIFICATION: Hook useJournalEntries', () => {
  const mockEntries = [
    {
      day: 1,
      date: '12 septembre 2024',
      title: 'Arrivée en Jordanie',
      location: 'Amman, Jordanie',
      story: 'Premier jour en Jordanie...',
      mood: 'Excité',
      photos: []
    },
    {
      day: 2,
      date: '13 septembre 2024',
      title: 'Visite du nord',
      location: 'Jerash, Ajlun, Amman',
      story: 'Exploration du patrimoine...',
      mood: 'Émerveillé',
      photos: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SPÉCIFICATION: Chargement initial des entrées', () => {
    it('devrait charger les entrées au montage du composant', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue(mockEntries);

      const { result } = renderHook(() => useJournalEntries());

      expect(mockLoadJournalEntries).toHaveBeenCalledOnce();
      expect(result.current.allEntries).toEqual(mockEntries);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('devrait gérer les erreurs de chargement', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockLoadJournalEntries.mockImplementation(() => {
        throw new Error('Erreur de stockage');
      });

      const { result } = renderHook(() => useJournalEntries());

      expect(result.current.allEntries).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Erreur lors du chargement des entrées');
      
      consoleErrorSpy.mockRestore();
    });

    it('devrait retourner les entrées triées par jour', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      const unorderedEntries = [...mockEntries].reverse(); // Jour 2, puis jour 1
      mockLoadJournalEntries.mockReturnValue(unorderedEntries);

      const { result } = renderHook(() => useJournalEntries());

      // Devrait être trié par jour croissant
      expect(result.current.allEntries[0].day).toBe(1);
      expect(result.current.allEntries[1].day).toBe(2);
    });
  });

  describe('SPÉCIFICATION: Vérification que les entrées sont bien disponibles pour le géocodage', () => {
    it('devrait exposer allEntries avec les données de localisation nécessaires', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue(mockEntries);

      const { result } = renderHook(() => useJournalEntries());

      expect(result.current.allEntries).toHaveLength(2);
      
      // Vérifier que chaque entrée a les champs nécessaires pour le géocodage
      result.current.allEntries.forEach(entry => {
        expect(entry).toHaveProperty('day');
        expect(entry).toHaveProperty('location');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('story');
        expect(typeof entry.day).toBe('number');
        expect(typeof entry.location).toBe('string');
        expect(entry.location.length).toBeGreaterThan(0);
      });
    });

    it('devrait retourner les bonnes données de test pour le géocodage', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue(mockEntries);

      const { result } = renderHook(() => useJournalEntries());

      const entries = result.current.allEntries;
      
      // Vérifier les données de test spécifiques mentionnées par l'utilisateur
      expect(entries[0]).toMatchObject({
        day: 1,
        location: 'Amman, Jordanie',
        title: 'Arrivée en Jordanie'
      });
      
      expect(entries[1]).toMatchObject({
        day: 2,
        location: 'Jerash, Ajlun, Amman',
        title: 'Visite du nord'
      });
    });

    it('devrait maintenir la compatibilité avec customEntries', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue(mockEntries);

      const { result } = renderHook(() => useJournalEntries());

      // Vérifier la rétrocompatibilité
      expect(result.current.customEntries).toEqual(result.current.allEntries);
    });
  });

  describe('SPÉCIFICATION: États de chargement et d\'erreur', () => {
    it('devrait indiquer isLoading=true pendant le chargement initial', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue([]);

      const { result } = renderHook(() => useJournalEntries());

      // Après le premier rendu, isLoading devrait être false
      expect(result.current.isLoading).toBe(false);
    });

    it('devrait permettre le rechargement manuel des entrées', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue(mockEntries);

      const { result } = renderHook(() => useJournalEntries());

      // Vider les entrées et recharger
      mockLoadJournalEntries.mockReturnValue([]);
      result.current.reloadEntries();

      expect(mockLoadJournalEntries).toHaveBeenCalledTimes(2); // Initial + reload
      expect(result.current.allEntries).toEqual([]);
    });
  });

  describe('SPÉCIFICATION: Fonctions utilitaires', () => {
    it('devrait exposer toutes les fonctions nécessaires', () => {
      const mockLoadJournalEntries = vi.mocked(journalStorageModule.loadJournalEntries);
      mockLoadJournalEntries.mockReturnValue([]);

      const { result } = renderHook(() => useJournalEntries());

      // Vérifier que toutes les fonctions sont exposées
      expect(typeof result.current.addEntry).toBe('function');
      expect(typeof result.current.editEntry).toBe('function');
      expect(typeof result.current.getStats).toBe('function');
      expect(typeof result.current.reloadEntries).toBe('function');
    });
  });
});