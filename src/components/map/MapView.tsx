import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMapContent } from '@/hooks/useMapContent';
import type { MapLocation } from '@/types/map';

const MAPLIBRE_STYLE = 'https://demotiles.maplibre.org/style.json';

const createMarkerElement = (location: MapLocation) => {
  const element = document.createElement('div');
  const isPrincipal = location.type === 'principal';

  element.className = 'rounded-full shadow-md flex items-center justify-center text-white font-semibold';
  element.style.width = isPrincipal ? '28px' : '20px';
  element.style.height = isPrincipal ? '28px' : '20px';
  element.style.backgroundColor = isPrincipal ? '#2563eb' : '#f97316';
  element.style.border = '2px solid white';
  element.style.fontSize = isPrincipal ? '12px' : '10px';

  if (isPrincipal) {
    element.textContent = location.day.toString();
  }

  return element;
};

const buildPopupHtml = (location: MapLocation) => `
  <div style="padding: 8px; max-width: 260px;">
    <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">
      ${location.name}
    </h3>
    <div style="margin-bottom: 8px;">
      <span style="background: ${location.type === 'principal' ? '#2563eb' : '#f97316'}; color: white; padding: 2px 6px; border-radius: 9999px; font-size: 10px; text-transform: uppercase;">
        ${location.type}
      </span>
      <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">
        Jour ${location.day} - ${location.journalEntry.date}
      </span>
    </div>
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #1f2937; font-weight: 600;">
      ${location.journalEntry.title}
    </p>
    <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
      ${location.journalEntry.story.slice(0, 160)}${
  location.journalEntry.story.length > 160 ? '…' : ''
}
    </p>
  </div>
`;

export const MapView = () => {
  const { mapLocations, status, lastGeocodeAt } = useMapContent((state) => ({
    mapLocations: state.mapLocations,
    status: state.status,
    lastGeocodeAt: state.lastGeocodeAt
  }));

  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const sortedLocations = useMemo(
    () => [...mapLocations].sort((a, b) => a.day - b.day),
    [mapLocations]
  );

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) {
      return;
    }

    mapboxgl.accessToken = '';
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPLIBRE_STYLE,
      center: [35.9106, 31.9539],
      zoom: 6
    });

    mapInstance.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    const routeSourceId = 'map-view-route';
    if (map.getLayer(routeSourceId)) {
      map.removeLayer(routeSourceId);
    }
    if (map.getSource(routeSourceId)) {
      map.removeSource(routeSourceId);
    }

    if (sortedLocations.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    sortedLocations.forEach((location) => {
      const marker = new mapboxgl.Marker({ element: createMarkerElement(location) })
        .setLngLat([location.coordinates[1], location.coordinates[0]])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setHTML(buildPopupHtml(location)))
        .addTo(map);
      markers.current.push(marker);
      bounds.extend([location.coordinates[1], location.coordinates[0]]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 11, duration: 800 });
    }

    if (sortedLocations.length > 1) {
      const coordinates = sortedLocations.map((location) => [
        location.coordinates[1],
        location.coordinates[0]
      ]);

      map.addSource(routeSourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {}
        }
      });

      map.addLayer({
        id: routeSourceId,
        type: 'line',
        source: routeSourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': 3,
          'line-opacity': 0.75
        }
      });
    }
  }, [sortedLocations]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base sm:text-lg">
            Itinéraire validé
            <Badge variant="secondary">
              {status === 'ready'
                ? `${sortedLocations.length} lieu${sortedLocations.length > 1 ? 'x' : ''}`
                : status === 'awaiting-validation'
                ? 'Validation en attente'
                : status === 'geocoding'
                ? 'Géocodage en cours'
                : 'Carte inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            ref={mapContainer}
            className="w-full h-[320px] rounded-lg border bg-muted"
          />
          {sortedLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun lieu validé pour le moment. Utilisez l'atelier pour lancer le géocodage et valider les étapes de l'itinéraire.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedLocations.map((location, index) => (
                <div
                  key={`${location.name}-${location.day}-${index}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className={
                        location.type === 'principal'
                          ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white'
                          : 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white'
                      }>
                        {location.type === 'principal' ? location.day : '•'}
                      </span>
                      {location.name}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {location.journalEntry.title}
                    </p>
                  </div>
                  <Badge variant={location.type === 'principal' ? 'default' : 'outline'}>
                    {location.type === 'principal' ? 'Étape' : 'Visite'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {lastGeocodeAt && (
            <p className="text-xs text-muted-foreground text-right">
              Dernier géocodage: {new Date(lastGeocodeAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
