import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Map from '@/components/Map';
import * as useJournalEntriesModule from '@/hooks/useJournalEntries';
import * as geocodingModule from '@/lib/geocoding';

// Mock du hook useJournalEntries
const mockUseJournalEntries = vi.fn();
vi.mock('@/hooks/useJournalEntries', () => ({
  useJournalEntries: () => mockUseJournalEntries()
}));

// Mock du service de géocodage
const mockGeocodeJournalEntries = vi.fn();
vi.mock('@/lib/geocoding', () => ({
  geocodeJournalEntries: (entries: any, token: string) => mockGeocodeJournalEntries(entries, token)
}));

// Mock de mapbox-gl pour éviter les erreurs
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn()
    })),
    NavigationControl: vi.fn(),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis()
    })),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis()
    }))
  }
}));

describe('Map Component', () => {
  const mockJournalEntries = [
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

  const expectedGeocodeResults = [
    {
      name: 'Amman',
      coordinates: [35.9106, 31.9539],
      type: 'principal',
      day: 1,
      journalEntry: mockJournalEntries[0]
    },
    {
      name: 'Jerash',
      coordinates: [35.8998, 32.2811],
      type: 'secondaire',
      day: 2,
      journalEntry: mockJournalEntries[1]
    },
    {
      name: 'Ajlun',
      coordinates: [35.7519, 32.3326],
      type: 'secondaire',
      day: 2,
      journalEntry: mockJournalEntries[1]
    },
    {
      name: 'Amman',
      coordinates: [35.9106, 31.9539],
      type: 'principal',
      day: 2,
      journalEntry: mockJournalEntries[1]
    }
  ];

  const createHookValue = (overrides: Partial<Record<string, any>> = {}) => ({
    allEntries: mockJournalEntries,
    customEntries: mockJournalEntries,
    isCustom: vi.fn().mockReturnValue(false),
    isLoading: false,
    error: null,
    addEntry: vi.fn(),
    editEntry: vi.fn(),
    getStats: vi.fn(),
    reloadEntries: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SPÉCIFICATION: Interface initiale sans token', () => {
    it('devrait afficher le formulaire de configuration Mapbox quand aucun token n\'est fourni', () => {
      mockUseJournalEntries.mockReturnValue(createHookValue());

      render(<Map />);

      expect(screen.getByText('Configuration Mapbox')).toBeInTheDocument();
      expect(screen.getByText('Token Mapbox Public')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/pk\.eyJ1/)).toBeInTheDocument();
      expect(screen.getByText('Analyser les lieux du journal')).toBeInTheDocument();
    });

    it('devrait désactiver le bouton si aucune entrée de journal n\'existe', () => {
      mockUseJournalEntries.mockReturnValue(createHookValue({
        allEntries: [],
        customEntries: [],
      }));

      render(<Map />);

      const button = screen.getByText('Analyser les lieux du journal');
      expect(button).toBeDisabled();
      expect(screen.getByText('Aucune entrée de journal trouvée')).toBeInTheDocument();
    });
  });

  describe('SPÉCIFICATION: Géocodage automatique des entrées du journal', () => {
    it('devrait analyser automatiquement les lieux du journal quand un token valide est fourni', async () => {
      mockUseJournalEntries.mockReturnValue(createHookValue());

      mockGeocodeJournalEntries.mockResolvedValue(expectedGeocodeResults);

      render(<Map />);

      // Saisir le token Mapbox
      const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
      fireEvent.change(tokenInput, { target: { value: 'pk.test_token_valid' } });

      // Cliquer sur le bouton d'analyse
      const analyzeButton = screen.getByText('Analyser les lieux du journal');
      expect(analyzeButton).not.toBeDisabled();
      fireEvent.click(analyzeButton);

      // Vérifier que le géocodage est appelé avec les bonnes données
      await waitFor(() => {
        expect(mockGeocodeJournalEntries).toHaveBeenCalledWith(
          mockJournalEntries,
          'pk.test_token_valid'
        );
      });

      // Vérifier qu'un modal de validation apparaît
      await waitFor(() => {
        expect(screen.getByText('Validation des lieux détectés')).toBeInTheDocument();
      });
    });

    it('devrait afficher les lieux détectés dans le modal de validation', async () => {
      mockUseJournalEntries.mockReturnValue(createHookValue());

      mockGeocodeJournalEntries.mockResolvedValue(expectedGeocodeResults);

      render(<Map />);

      const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
      fireEvent.change(tokenInput, { target: { value: 'pk.test_token_valid' } });

      const analyzeButton = screen.getByText('Analyser les lieux du journal');
      fireEvent.click(analyzeButton);

      // Attendre que le modal apparaisse avec les lieux détectés
      await waitFor(() => {
        expect(screen.getByText('4 marqueur(s) détecté(s)')).toBeInTheDocument();
        expect(screen.getByText('Jour 1')).toBeInTheDocument();
        expect(screen.getByText('Jour 2')).toBeInTheDocument();
      });
    });

    it('devrait gérer les erreurs de géocodage avec un message d\'erreur explicite', async () => {
      mockUseJournalEntries.mockReturnValue(createHookValue());

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockGeocodeJournalEntries.mockRejectedValue(new Error('Token invalide'));

      render(<Map />);

      const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
      fireEvent.change(tokenInput, { target: { value: 'pk.invalid_token' } });

      const analyzeButton = screen.getByText('Analyser les lieux du journal');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erreur lors du géocodage: Error: Token invalide');
      });

      mockAlert.mockRestore();
    });

    it('devrait afficher un avertissement si aucun lieu n\'est géocodé avec succès', async () => {
      mockUseJournalEntries.mockReturnValue(createHookValue());

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockGeocodeJournalEntries.mockResolvedValue([]);

      render(<Map />);

      const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
      fireEvent.change(tokenInput, { target: { value: 'pk.test_token_valid' } });

      const analyzeButton = screen.getByText('Analyser les lieux du journal');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Aucun lieu n\'a pu être géocodé. Vérifiez votre token Mapbox et la connectivité réseau.'
        );
      });

      mockAlert.mockRestore();
    });
  });

  describe('SPÉCIFICATION: États de chargement et feedback utilisateur', () => {
    it('devrait afficher un indicateur de chargement pendant le géocodage', async () => {
      mockUseJournalEntries.mockReturnValue({
        allEntries: mockJournalEntries,
        isLoading: false,
        error: null
      });

      // Mock qui attend indéfiniment pour pouvoir tester l'état de chargement
      let resolveGeocode: (value: any) => void;
      const geocodePromise = new Promise(resolve => {
        resolveGeocode = resolve;
      });
      mockGeocodeJournalEntries.mockReturnValue(geocodePromise);

      render(<Map />);

      const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
      fireEvent.change(tokenInput, { target: { value: 'pk.test_token_valid' } });

      const analyzeButton = screen.getByText('Analyser les lieux du journal');
      fireEvent.click(analyzeButton);

      // Vérifier que le texte change pendant le chargement
      expect(screen.getByText('Géocodage en cours...')).toBeInTheDocument();
      expect(screen.getByText('Géocodage en cours...')).toBeDisabled();

      // Résoudre la promesse pour nettoyer
      resolveGeocode!(expectedGeocodeResults);
    });
  });
});