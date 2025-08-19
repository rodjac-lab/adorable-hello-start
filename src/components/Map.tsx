import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Locations visited in Jordan
  const jordanLocations = [
    {
      name: "Amman",
      coordinates: [35.9106, 31.9539] as [number, number],
      day: 1,
      description: "Arrivée et découverte de la capitale",
      activities: ["Downtown Amman", "Souk traditionnel", "Théâtre romain"]
    },
    {
      name: "Jerash",
      coordinates: [35.8998, 32.2811] as [number, number],
      day: 2,
      description: "Cité romaine exceptionnelle",
      activities: ["Ruines romaines", "Théâtre sud", "Arc d'Hadrien"]
    },
    {
      name: "Ajloun",
      coordinates: [35.7519, 32.3326] as [number, number],
      day: 3,
      description: "Château médiéval et nature",
      activities: ["Château d'Ajloun", "Réserve naturelle", "Randonnée"]
    }
  ];

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken.trim()) return;

    try {
      mapboxgl.accessToken = mapboxToken.trim();
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [35.9106, 31.9539], // Centered on Amman
        zoom: 8,
        pitch: 45,
        bearing: 0
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        if (!map.current) return;

        // Add markers and route
        jordanLocations.forEach((location, index) => {
          // Create custom marker element
          const markerElement = document.createElement('div');
          markerElement.className = 'custom-marker';
          markerElement.innerHTML = `
            <div style="
              background: hsl(var(--primary));
              color: white;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
              border: 3px solid white;
              box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            ">
              ${location.day}
            </div>
          `;

          // Add marker
          const marker = new mapboxgl.Marker(markerElement)
            .setLngLat(location.coordinates)
            .addTo(map.current!);

          // Create popup
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false
          }).setHTML(`
            <div style="padding: 10px; max-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: hsl(var(--primary));">
                Jour ${location.day} - ${location.name}
              </h3>
              <p style="margin: 0 0 8px 0; font-size: 14px; color: hsl(var(--muted-foreground));">
                ${location.description}
              </p>
              <div style="font-size: 12px;">
                <strong>Activités :</strong>
                <ul style="margin: 4px 0 0 16px; padding: 0;">
                  ${location.activities.map(activity => `<li>${activity}</li>`).join('')}
                </ul>
              </div>
            </div>
          `);

          marker.setPopup(popup);
        });

        // Add route line connecting the locations
        if (jordanLocations.length > 1) {
          map.current.addSource('route', {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': jordanLocations.map(loc => loc.coordinates)
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
              'line-color': 'hsl(var(--primary))',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }

        setIsMapInitialized(true);
      });

    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la carte:', error);
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!isMapInitialized && !mapboxToken) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>🗺️ Carte interactive du voyage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Pour afficher la carte interactive, vous devez d'abord obtenir une clé API Mapbox gratuite.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label htmlFor="mapbox-token" className="text-sm font-medium">
                Clé publique Mapbox :
              </label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1IjoiZ..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Créez un compte gratuit sur{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
                {' '}et copiez votre clé publique (elle commence par "pk.")
              </p>
            </div>

            <Button 
              onClick={initializeMap}
              disabled={!mapboxToken.trim()}
              className="w-full"
            >
              Initialiser la carte
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {!isMapInitialized && (
        <div className="text-center">
          <p className="text-muted-foreground">Chargement de la carte...</p>
        </div>
      )}
      
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {isMapInitialized && (
        <Card>
          <CardHeader>
            <CardTitle>📍 Itinéraire du voyage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {jordanLocations.map((location, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {location.day}
                  </div>
                  <div>
                    <h4 className="font-semibold">{location.name}</h4>
                    <p className="text-sm text-muted-foreground">{location.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Map;