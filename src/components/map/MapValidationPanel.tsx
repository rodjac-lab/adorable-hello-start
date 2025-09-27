import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { useMapContent } from '@/hooks/useMapContent';
import { mapContentActions } from '@/lib/contentStore';
import type { MapLocation } from '@/types/map';

interface MapPreviewProps {
  locations: MapLocation[];
  mapboxToken?: string;
}

const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v11';
const MAPLIBRE_STYLE = 'https://demotiles.maplibre.org/style.json';

const MapPreview = ({ locations, mapboxToken }: MapPreviewProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (mapRef.current) {
      mapRef.current.remove();
    }

    mapboxgl.accessToken = mapboxToken ?? '';

    const map = new mapboxgl.Map({
      container,
      style: mapboxToken ? MAPBOX_STYLE : MAPLIBRE_STYLE,
      center: [35.9106, 31.9539],
      zoom: 6
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((location) => {
      const element = document.createElement('div');
      const isPrincipal = location.type === 'principal';
      element.className = 'rounded-full shadow-md flex items-center justify-center text-white font-semibold bg-primary';
      element.style.width = isPrincipal ? '24px' : '18px';
      element.style.height = isPrincipal ? '24px' : '18px';
      element.style.backgroundColor = isPrincipal ? '#2563eb' : '#f97316';
      element.textContent = isPrincipal ? location.day.toString() : '';

      const marker = new mapboxgl.Marker({ element })
        .setLngLat([location.coordinates[1], location.coordinates[0]])
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([location.coordinates[1], location.coordinates[0]]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 11 });
    }
  }, [locations]);

  return <div ref={containerRef} className="h-48 w-full rounded-lg border bg-muted" />;
};

interface MapValidationPanelProps {
  mapboxToken?: string;
}

export const MapValidationPanel = ({ mapboxToken }: MapValidationPanelProps) => {
  const { pendingLocations, failedLocations, status } = useMapContent((state) => ({
    pendingLocations: state.pendingLocations,
    failedLocations: state.failedLocations,
    status: state.status
  }));

  const [editedLocations, setEditedLocations] = useState<MapLocation[]>(pendingLocations);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<'principal' | 'secondaire'>('secondaire');

  useEffect(() => {
    setEditedLocations(pendingLocations);
  }, [pendingLocations]);

  useEffect(() => {
    mapContentActions.setPendingLocations(editedLocations);
  }, [editedLocations]);

  const groupedByDay = useMemo(() => {
    return editedLocations.reduce<Record<number, MapLocation[]>>((acc, location) => {
      acc[location.day] = acc[location.day] ? [...acc[location.day], location] : [location];
      return acc;
    }, {});
  }, [editedLocations]);

  const handleUpdateLocation = (index: number, updates: Partial<MapLocation>) => {
    setEditedLocations((current) =>
      current.map((location, currentIndex) =>
        currentIndex === index ? { ...location, ...updates } : location
      )
    );
  };

  const handleRemoveLocation = (index: number) => {
    setEditedLocations((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim() || editedLocations.length === 0) {
      return;
    }

    const baseEntry = editedLocations[0].journalEntry;
    const location: MapLocation = {
      name: newLocationName.trim(),
      type: newLocationType,
      day: baseEntry.day,
      journalEntry: baseEntry,
      coordinates: [31.9539, 35.9106]
    };

    setEditedLocations((current) => [...current, location]);
    setNewLocationName('');
  };

  const handleValidate = () => {
    if (editedLocations.length === 0) {
      return;
    }
    mapContentActions.validateLocations(editedLocations);
  };

  const handleReset = () => {
    mapContentActions.setPendingLocations([]);
    setEditedLocations([]);
  };

  const hasPending = editedLocations.length > 0;
  const hasFailures = failedLocations.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Validation des lieux</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPending && status === 'awaiting-validation' && (
          <Alert variant="destructive">
            <AlertTitle>Aucune donnée à valider</AlertTitle>
            <AlertDescription>
              Les lieux détectés ont été supprimés. Relancez un géocodage pour obtenir une proposition d'itinéraire.
            </AlertDescription>
          </Alert>
        )}

        {hasPending ? (
          <div className="space-y-4">
            <MapPreview locations={editedLocations} mapboxToken={mapboxToken} />
            <Separator />
            <ScrollArea className="h-56 pr-4">
              <div className="space-y-4">
                {Object.entries(groupedByDay).map(([day, locations]) => (
                  <div key={day} className="space-y-3">
                    <h3 className="font-semibold">Jour {day}</h3>
                    {locations.map((location) => {
                      const globalIndex = editedLocations.findIndex((item) => item === location);
                      return (
                        <div
                          key={`${location.name}-${location.day}-${globalIndex}`}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                value={location.name}
                                onChange={(event) =>
                                  handleUpdateLocation(globalIndex, { name: event.target.value })
                                }
                                placeholder="Nom du lieu"
                              />
                              <Select
                                value={location.type}
                                onValueChange={(value: 'principal' | 'secondaire') =>
                                  handleUpdateLocation(globalIndex, { type: value })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="principal">Principal</SelectItem>
                                  <SelectItem value="secondaire">Secondaire</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)} (lat, lng)
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLocation(globalIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={newLocationName}
                onChange={(event) => setNewLocationName(event.target.value)}
                placeholder="Ajouter un lieu manquant"
              />
              <Select
                value={newLocationType}
                onValueChange={(value: 'principal' | 'secondaire') => setNewLocationType(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="secondaire">Secondaire</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddLocation} disabled={!newLocationName.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Effacer
              </Button>
              <Button onClick={handleValidate} disabled={editedLocations.length === 0}>
                Valider l'itinéraire
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
              Lancez un géocodage pour analyser les lieux détectés dans le journal. Les propositions apparaîtront ici pour vérification.
            </div>
          </div>
        )}

        {hasFailures && (
          <div className="space-y-2">
            <Separator />
            <h3 className="text-sm font-semibold">Lieux non résolus</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              {failedLocations.map((failure, index) => (
                <div key={`${failure.name}-${failure.day}-${index}`} className="rounded border p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{failure.name}</span>
                    <Badge variant="outline">Jour {failure.day}</Badge>
                  </div>
                  <p className="mt-1">
                    {failure.reason ?? "Aucune suggestion trouvée"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
