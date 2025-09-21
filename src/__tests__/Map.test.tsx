import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Map from '@/components/Map';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import * as geocodingModule from '@/lib/geocoding';
import { mapContentActions } from '@/lib/contentStore';
import { forceRuntimeMode } from '@/utils/environment';
import type { MapLocation } from '@/types/map';

vi.mock('@/hooks/useJournalEntries');

const mockUseJournalEntries = useJournalEntries as unknown as vi.Mock;

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

  beforeEach(() => {
    vi.clearAllMocks();
    mapContentActions.reset();
    forceRuntimeMode('studio');
    mockUseJournalEntries.mockReturnValue({
      allEntries: sampleEntries,
      isLoading: false,
      error: null
    });
  });

  afterEach(() => {
    forceRuntimeMode(null);
    mapContentActions.reset();
  });

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

    render(<Map />);

    const tokenInput = screen.getByPlaceholderText(/pk\.eyJ1/);
    fireEvent.change(tokenInput, { target: { value: 'pk.test_token' } });

    const geocodeButton = screen.getByText('Lancer le géocodage');
    fireEvent.click(geocodeButton);

    await waitFor(() => {
      expect(geocodeSpy).toHaveBeenCalledWith(sampleEntries, 'pk.test_token', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText("Valider l'itinéraire")).toBeInTheDocument();
      expect(screen.getByText('Amman')).toBeInTheDocument();
    });
  });

  it('masque le configurateur hors studio', () => {
    forceRuntimeMode('readonly');
    render(<Map />);
    expect(screen.queryByText('Atelier de géocodage')).not.toBeInTheDocument();
  });
});
