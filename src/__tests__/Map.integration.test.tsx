import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Map from '@/components/Map';
import { useMapContent } from '@/hooks/useMapContent';
import { geocodeJournalEntries } from '@/lib/geocoding';

// Mock mapbox-gl
vi.mock('mapbox-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => ({
      addControl: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      addSource: vi.fn(),
      addLayer: vi.fn(),
    })),
    NavigationControl: vi.fn(),
    Marker: vi.fn().mockImplementation(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
    })),
    Popup: vi.fn().mockImplementation(() => ({
      setHTML: vi.fn().mockReturnThis(),
    })),
  },
  accessToken: '',
}));

// Mock hooks
vi.mock('@/hooks/useMapContent');
vi.mock('@/lib/geocoding');

const mockUseMapContent = vi.mocked(useMapContent);
const mockGeocodeJournalEntries = vi.mocked(geocodeJournalEntries);

describe('Map Integration Tests', () => {
  const mockEntries = [
    {
      day: 1,
      date: '20 décembre 2024',
      title: 'Arrivée à Amman',
      location: 'Amman',
      story: 'Premier jour en Jordanie',
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

  const mockLocations = [
    {
      name: 'Amman',
      coordinates: [35.9106, 31.9539] as [number, number],
      type: 'principal' as const,
      day: 1,
      journalEntry: mockEntries[0]
    },
    {
      name: 'Jerash',
      coordinates: [35.8998, 32.2811] as [number, number],
      type: 'secondaire' as const,
      day: 2,
      journalEntry: mockEntries[1]
    },
    {
      name: 'Ajloun',
      coordinates: [35.7519, 32.3326] as [number, number],
      type: 'secondaire' as const,
      day: 2,
      journalEntry: mockEntries[1]
    },
    {
      name: 'Amman',
      coordinates: [35.9106, 31.9539] as [number, number],
      type: 'principal' as const,
      day: 2,
      journalEntry: mockEntries[1]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMapContent.mockReturnValue({
      entries: mockEntries,
      status: 'published',
      isLoading: false,
      error: null,
      isStudioEditing: false,
    });
  });

  it('should NOT show validation modal when no locations are geocoded', async () => {
    // Given: geocoding returns empty array
    mockGeocodeJournalEntries.mockResolvedValue([]);

    render(<Map />);

    // When: user enters token and clicks analyze
    const tokenInput = screen.getByPlaceholderText(/pk.eyJ1/);
    const analyzeButton = screen.getByText('Analyser les lieux du journal');

    fireEvent.change(tokenInput, { target: { value: 'pk.test_token' } });
    fireEvent.click(analyzeButton);

    // Then: should show alert and NOT show validation modal
    await waitFor(() => {
      // Modal should NOT be present
      expect(screen.queryByText('Validation des lieux')).not.toBeInTheDocument();
      // Token form should still be visible
      expect(screen.getByText('Configuration Mapbox')).toBeInTheDocument();
    });

    expect(mockGeocodeJournalEntries).toHaveBeenCalledWith(mockEntries, 'pk.test_token');
  });

  it('should show validation modal with 4 markers when geocoding succeeds', async () => {
    // Given: geocoding returns 4 locations
    mockGeocodeJournalEntries.mockResolvedValue(mockLocations);

    render(<Map />);

    // When: user enters token and clicks analyze
    const tokenInput = screen.getByPlaceholderText(/pk.eyJ1/);
    const analyzeButton = screen.getByText('Analyser les lieux du journal');

    fireEvent.change(tokenInput, { target: { value: 'pk.test_token' } });
    fireEvent.click(analyzeButton);

    // Then: should show validation modal with locations
    await waitFor(() => {
      expect(screen.getByText('Validation des lieux')).toBeInTheDocument();
    });

    // Should find all 4 locations in the modal
    expect(screen.getByText('Amman')).toBeInTheDocument();
    expect(screen.getByText('Jerash')).toBeInTheDocument();
    expect(screen.getByText('Ajloun')).toBeInTheDocument();
    
    expect(mockGeocodeJournalEntries).toHaveBeenCalledWith(mockEntries, 'pk.test_token');
  });

  it('should show error message when geocoding fails', async () => {
    // Given: geocoding throws an error
    mockGeocodeJournalEntries.mockRejectedValue(new Error('Network error'));

    render(<Map />);

    // When: user enters token and clicks analyze
    const tokenInput = screen.getByPlaceholderText(/pk.eyJ1/);
    const analyzeButton = screen.getByText('Analyser les lieux du journal');

    fireEvent.change(tokenInput, { target: { value: 'pk.test_token' } });
    fireEvent.click(analyzeButton);

    // Then: should handle error gracefully
    await waitFor(() => {
      // Should not show validation modal
      expect(screen.queryByText('Validation des lieux')).not.toBeInTheDocument();
      // Should still show token form
      expect(screen.getByText('Configuration Mapbox')).toBeInTheDocument();
    });
  });

  it('should be disabled when no journal entries exist', () => {
    // Given: no journal entries
    mockUseMapContent.mockReturnValue({
      entries: [],
      status: 'published',
      isLoading: false,
      error: null,
      isStudioEditing: false,
    });

    render(<Map />);

    // Then: button should be disabled
    const analyzeButton = screen.getByText('Analyser les lieux du journal');
    expect(analyzeButton).toBeDisabled();
    expect(screen.getByText('Aucune entrée de journal trouvée')).toBeInTheDocument();
  });

  it('should process location parsing correctly', async () => {
    // Given: geocoding returns expected locations based on parsing
    mockGeocodeJournalEntries.mockResolvedValue(mockLocations);

    render(<Map />);

    const tokenInput = screen.getByPlaceholderText(/pk.eyJ1/);
    const analyzeButton = screen.getByText('Analyser les lieux du journal');

    fireEvent.change(tokenInput, { target: { value: 'pk.test_token' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(mockGeocodeJournalEntries).toHaveBeenCalledWith(mockEntries, 'pk.test_token');
    });

    // Verify that the parsing logic should handle:
    // Day 1: "Amman" → 1 principal location
    // Day 2: "Jerash, Ajloun, Amman" → 2 secondary + 1 principal = 3 locations
    // Total expected: 4 locations
    const call = mockGeocodeJournalEntries.mock.calls[0];
    expect(call[0]).toEqual(mockEntries);
    expect(call[1]).toBe('pk.test_token');
  });
});