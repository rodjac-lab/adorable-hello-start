import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Map from '@/components/Map';

 main
import * as geocodingModule from '@/lib/geocoding';
import { mapContentActions } from '@/lib/contentStore';
import { forceRuntimeMode } from '@/utils/environment';
import type { MapLocation } from '@/types/map';


// Mock du hook useMapContent
const mockUseMapContent = vi.fn();
vi.mock('@/hooks/useMapContent', () => ({
  useMapContent: () => mockUseMapContent()
}));
main

const mapboxControlMock = vi.fn();
const markerMock = vi.fn(() => ({
  setLngLat: vi.fn().mockReturnThis(),
  setPopup: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn()
}));
const popupMock = vi.fn(() => ({
  setHTML: vi.fn().mockReturnThis()
}));

vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      getLayer: vi.fn(),
      getSource: vi.fn()
    })),
    NavigationControl: mapboxControlMock,
    Marker: markerMock,
    Popup: popupMock,
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn(),
      isEmpty: vi.fn(() => false)
    }))
  }
}));

describe('Map component', () => {
  const sampleEntries = [
    {
      day: 1,
      date: '15 janvier 2024',
      title: 'Arrivée à Amman',
      location: 'Amman',
      story: 'Premier jour en Jordanie.',
      mood: 'Excité',
      photos: []
    }
  ];

  const geocodedLocations: MapLocation[] = [
    {
      name: 'Amman',
      coordinates: [31.9539, 35.9106],
      type: 'principal',
      day: 1,
      journalEntry: sampleEntries[0]
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

    mockUseMapContent.mockReturnValue({
      entries: mockJournalEntries,
      status: 'published',
      isLoading: false,
      error: null,
      isStudioEditing: false,
    });
  });

  describe('SPÉCIFICATION: Interface initiale sans token', () => {
    it('devrait afficher le formulaire de configuration Mapbox quand aucun token n\'est fourni', () => {

      mockUseJournalEntries.mockReturnValue(createHookValue());
main

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
main

      render(<Map />);

      const button = screen.getByText('Analyser les lieux du journal');
      expect(button).toBeDisabled();
      expect(screen.getByText('Aucune entrée de journal trouvée')).toBeInTheDocument();
    });
  });

  describe('SPÉCIFICATION: Géocodage automatique des entrées du journal', () => {
    it('devrait analyser automatiquement les lieux du journal quand un token valide est fourni', async () => {

      mockUseJournalEntries.mockReturnValue(createHookValue());
      main

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
main

      mockGeocodeJournalEntries.mockResolvedValue(expectedGeocodeResults);

      render(<Map />);
 main

  it('affiche le configurateur en mode studio', () => {
    render(<Map />);
    expect(screen.getByText('Atelier de géocodage')).toBeInTheDocument();
    expect(screen.getByLabelText('Token Mapbox public')).toBeInTheDocument();
  });

  it('désactive le bouton de géocodage sans entrées', () => {
    mockUseJournalEntries.mockReturnValueOnce({ allEntries: [], isLoading: false, error: null });
    render(<Map />);
    expect(screen.getByText('Lancer le géocodage')).toBeDisabled();
  });

  it('lance le géocodage et met à jour le panneau de validation', async () => {
    const geocodeSpy = vi.spyOn(geocodingModule, 'geocodeJournalEntries').mockImplementation(async () => {
      mapContentActions.startGeocoding();
      mapContentActions.completeGeocoding({ pending: geocodedLocations, failed: [], error: undefined });
      return geocodedLocations;
    });


    it('devrait gérer les erreurs de géocodage avec un message d\'erreur explicite', async () => {

      mockUseJournalEntries.mockReturnValue(createHookValue());
 main

      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockGeocodeJournalEntries.mockRejectedValue(new Error('Token invalide'));
 main

    const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
    fireEvent.change(tokenInput, { target: { value: 'pk.test_token' } });

    const geocodeButton = screen.getByText('Lancer le géocodage');
    fireEvent.click(geocodeButton);

    await waitFor(() => {
      expect(geocodeSpy).toHaveBeenCalledWith(sampleEntries, 'pk.test_token', expect.any(Object));
    });


    it('devrait afficher un avertissement si aucun lieu n\'est géocodé avec succès', async () => {

      mockUseJournalEntries.mockReturnValue(createHookValue());
 main

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
      mockUseMapContent.mockReturnValue({
        entries: mockJournalEntries,
        status: 'published',
        isLoading: false,
        error: null,
        isStudioEditing: false,
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
 main
  });
});
