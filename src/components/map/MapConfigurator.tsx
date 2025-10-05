import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { geocodeJournalEntries } from '@/lib/geocoding';
import { useMapContent } from '@/hooks/useMapContent';
import { MapValidationPanel } from './MapValidationPanel';

export const MapConfigurator = () => {
  const { allEntries } = useJournalEntries();
  const { status, failedLocations, pendingLocations, lastGeocodeAt, error } = useMapContent((state) => ({
    status: state.status,
    failedLocations: state.failedLocations,
    pendingLocations: state.pendingLocations,
    lastGeocodeAt: state.lastGeocodeAt,
    error: state.error
  }));

  const [mapboxToken, setMapboxToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const hasEntries = allEntries.length > 0;
  const isGeocoding = status === 'geocoding' || isProcessing;

  const handleGeocode = async () => {
    if (!hasEntries) return;

    setIsProcessing(true);
    setProgress(null);

    try {
      await geocodeJournalEntries(allEntries, mapboxToken, {
        mode: 'studio',
        onProgress: (current, total) => setProgress({ current, total })
      });
    } catch (exception) {
      logger.error('❌ Erreur lors du géocodage:', exception);
    } finally {
      setIsProcessing(false);
    }
  };

  const hasPending = pendingLocations.length > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Atelier de géocodage</CardTitle>
          <CardDescription>
            Analysez vos entrées du journal et préparez les données à afficher sur la carte publique.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="mapbox-token" className="text-sm font-medium">
              Token Mapbox public
            </label>
            <Input
              id="mapbox-token"
              value={mapboxToken}
              onChange={(event) => setMapboxToken(event.target.value)}
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV..."
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Requis uniquement pour profiter de l'autocomplétion Mapbox. Sans token, seul le référentiel local de lieux sera utilisé.
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleGeocode}
              disabled={!hasEntries || isGeocoding}
              className="w-full"
            >
              {isGeocoding ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Géocodage en cours...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Lancer le géocodage
                </span>
              )}
            </Button>
            {!hasEntries && (
              <p className="text-xs text-muted-foreground text-center">
                Ajoutez des entrées dans le journal avant de lancer l'analyse.
              </p>
            )}
            {progress && (
              <p className="text-xs text-muted-foreground text-center">
                Progression: {progress.current} / {progress.total}
              </p>
            )}
            {lastGeocodeAt && (
              <p className="text-xs text-muted-foreground text-center">
                Dernier géocodage: {new Date(lastGeocodeAt).toLocaleString()}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {failedLocations.length > 0 && (
            <Alert>
              <AlertDescription>
                {failedLocations.length} lieu{failedLocations.length > 1 ? 'x' : ''} n'ont pas pu être résolus automatiquement.
              </AlertDescription>
            </Alert>
          )}

          {hasPending && (
            <Alert>
              <AlertDescription>
                {pendingLocations.length} proposition{pendingLocations.length > 1 ? 's' : ''} à valider.
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              {mapboxToken ? (
                <span>
                  <Badge variant="default" className="mr-2">Mode Mapbox</Badge>
                  Les suggestions combinent la base locale et les résultats distants.
                </span>
              ) : (
                <span>
                  <Badge variant="secondary" className="mr-2">Mode MapLibre</Badge>
                  Sans token, les coordonnées proviennent uniquement de la base interne.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <MapValidationPanel mapboxToken={mapboxToken || undefined} />
    </div>
  );
};
