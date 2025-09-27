import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LocationValidationModal } from '../LocationValidationModal';
import { MapLocation } from '@/types/map';

// Mock data matching the MapLocation interface
const mockLocations: MapLocation[] = [
  {
    name: 'Amman',
    coordinates: [31.9539, 35.9106],
    type: 'principal',
    day: 1,
    journalEntry: {
      day: 1,
      date: '15 janvier 2024',
      title: 'Arrivée à Amman',
      location: 'Amman',
      story: 'Premier jour en Jordanie, découverte de la capitale.',
      mood: 'Excité'
    }
  },
  {
    name: 'Jerash',
    coordinates: [32.2681, 35.8911],
    type: 'secondaire',
    day: 2,
    journalEntry: {
      day: 2,
      date: '16 janvier 2024',
      title: 'Visite de Jerash',
      location: 'Jerash',
      story: 'Exploration des ruines romaines.',
      mood: 'Émerveillé'
    }
  }
];

describe('LocationValidationModal', () => {
  const mockOnValidate = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(
      <LocationValidationModal
        isOpen={true}
        locations={mockLocations}
        onValidate={mockOnValidate}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Validation des lieux géocodés')).toBeInTheDocument();
    expect(screen.getByText('Amman')).toBeInTheDocument();
    expect(screen.getByText('Jerash')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <LocationValidationModal
        isOpen={false}
        locations={mockLocations}
        onValidate={mockOnValidate}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Validation des lieux géocodés')).not.toBeInTheDocument();
  });

  it('calls onValidate with selected locations', () => {
    render(
      <LocationValidationModal
        isOpen={true}
        locations={mockLocations}
        onValidate={mockOnValidate}
        onCancel={mockOnCancel}
      />
    );

    const validateButton = screen.getByRole('button', { name: /Valider \(2\)/ });
    fireEvent.click(validateButton);

    expect(mockOnValidate).toHaveBeenCalledWith(mockLocations);
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <LocationValidationModal
        isOpen={true}
        locations={mockLocations}
        onValidate={mockOnValidate}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Annuler' });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows location type badges correctly', () => {
    render(
      <LocationValidationModal
        isOpen={true}
        locations={mockLocations}
        onValidate={mockOnValidate}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('principal')).toBeInTheDocument();
    expect(screen.getByText('secondaire')).toBeInTheDocument();
  });
});