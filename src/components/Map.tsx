import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { geocodeJournalEntries } from '@/lib/geocoding';
import { MapLocation } from '@/types/map';
import { LocationValidationModal } from './LocationValidationModal';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(true);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [pendingLocations, setPendingLocations] = useState<MapLocation[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const { allEntries } = useJournalEntries();

  const handleGeocode = async () => {
    if (!mapboxToken.trim() || allEntries.length === 0) return;
    
    setIsGeocoding(true);
    try {
      const locations = await geocodeJournalEntries(allEntries, mapboxToken);
      setPendingLocations(locations);
      setShowValidationModal(true);
    } catch (error) {
      console.error('Erreur lors du géocodage:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleValidateLocations = (validatedLocations: MapLocation[]) => {
    setMapLocations(validatedLocations);
    setShowValidationModal(false);
    initializeMap();
  };

  const initializeMap = () => {
    if (!mapboxToken.trim()) {
      console.log('No token provided');
      return;
    }
    
    console.log('Token provided, hiding form and preparing container');
    setShowTokenForm(false);
    
    // Wait for the container to be rendered
    setTimeout(() => {
      if (!mapContainer.current) {
        console.error('Map container not found after timeout');
        setShowTokenForm(true);
        return;
      }

    console.log('Initializing map with token:', mapboxToken.substring(0, 10) + '...');
    setShowTokenForm(false); // Hide form immediately when starting initialization

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [35.9106, 31.9539], // Centered on Amman
        zoom: 7
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        if (!map.current) return;

        // Create a route connecting all locations in chronological order
        if (mapLocations.length > 1) {
          const coordinates = mapLocations
            .sort((a, b) => a.day - b.day)
            .map(location => location.coordinates);
          
          map.current.addSource('route', {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': coordinates
              }
            }
          });

          map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#3b82f6',
              'line-width': 3,
              'line-opacity': 0.8
            }
          });
        }

        // Add markers for each location
        mapLocations.forEach((location) => {
          // Marker colors and sizes based on type
          const isPrincipal = location.type === 'principal';
          const markerColor = isPrincipal ? '#3b82f6' : '#f59e0b'; // Blue for principal, orange for secondary
          const markerSize = isPrincipal ? 30 : 20;

          // Create a custom marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'custom-marker';
          markerElement.style.cssText = `
            width: ${markerSize}px;
            height: ${markerSize}px;
            background-color: ${markerColor};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${isPrincipal ? '12px' : '10px'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          `;
          
          // Show day number only for principal locations
          if (isPrincipal) {
            markerElement.textContent = location.day.toString();
          }

          // Create popup with journal data
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${location.name}</h3>
              <div style="margin-bottom: 8px;">
                <span style="background: ${markerColor}; color: white; padding: 2px 6px; border-radius: 12px; font-size: 10px; text-transform: uppercase;">
                  ${location.type}
                </span>
                <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">
                  Jour ${location.day} - ${location.journalEntry.date}
                </span>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937; font-weight: 600;">
                ${location.journalEntry.title}
              </p>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">
                ${location.journalEntry.story.slice(0, 150)}${location.journalEntry.story.length > 150 ? '...' : ''}
              </p>
              <div style="font-size: 12px; color: #9ca3af;">
                Humeur: ${location.journalEntry.mood}
              </div>
            </div>
          `);

          // Add marker to map
          new mapboxgl.Marker(markerElement)
            .setLngLat(location.coordinates)
            .setPopup(popup)
            .addTo(map.current!);
        });

        setIsMapInitialized(true);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setShowTokenForm(true); // Show form again on error
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
      setShowTokenForm(true); // Show form again on error
    }
    }, 100); // Wait 100ms for container to be available
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="w-full h-full">
      {showTokenForm && (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Configuration Mapbox</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Pour afficher la carte interactive, vous devez fournir votre token Mapbox public.
                Vous pouvez l'obtenir gratuitement sur{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-primary underline"
                >
                  mapbox.com
                </a>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <label htmlFor="mapbox-token" className="text-sm font-medium">
                Token Mapbox Public
              </label>
              <Input
                id="mapbox-token"
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV..."
                className="font-mono text-sm"
              />
            </div>
            <Button 
              onClick={handleGeocode} 
              disabled={!mapboxToken.trim() || allEntries.length === 0 || isGeocoding}
              className="w-full"
            >
              {isGeocoding ? 'Géocodage en cours...' : 'Analyser les lieux du journal'}
            </Button>
            {allEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Aucune entrée de journal trouvée. Ajoutez des entrées dans la section Journal.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <LocationValidationModal
        isOpen={showValidationModal}
        locations={pendingLocations}
        onValidate={handleValidateLocations}
        onCancel={() => setShowValidationModal(false)}
      />

      {!showTokenForm && (
        <>
          <div 
            ref={mapContainer} 
            className="w-full h-[600px] rounded-lg shadow-lg"
          />
          
          {isMapInitialized && mapLocations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Lieux visités ({mapLocations.length} marqueurs)</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mapLocations
                  .sort((a, b) => a.day - b.day)
                  .map((location, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            location.type === 'principal' ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                        >
                          {location.type === 'principal' ? location.day : '•'}
                        </div>
                        <h4 className="font-semibold">{location.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          location.type === 'principal' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {location.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {location.journalEntry.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {location.journalEntry.date} - {location.journalEntry.mood}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Map;