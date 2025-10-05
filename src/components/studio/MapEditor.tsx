import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface MapMarker {
  id: string;
  name: string;
  day: number;
  latitude: number;
  longitude: number;
  notes: string;
}

interface MapSettings {
  token: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  markers: MapMarker[];
}

const STORAGE_KEY = "studio_map_settings";

const defaultSettings: MapSettings = {
  token: "",
  centerLat: 31.9539,
  centerLng: 35.9106,
  zoom: 7,
  markers: [],
};

const createMarkerId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `marker-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const loadMapSettings = (): MapSettings => {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultSettings;
    }

    const parsed = JSON.parse(stored) as MapSettings;
    if (!parsed || typeof parsed !== "object") {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...parsed,
      markers: Array.isArray(parsed.markers) ? parsed.markers : [],
    };
  } catch (error) {
    logger.warn("Impossible de charger la configuration de la carte", error);
    return defaultSettings;
  }
};

const blankMarker = (day: number): MapMarker => ({
  id: createMarkerId(),
  name: `Étape ${day}`,
  day,
  latitude: defaultSettings.centerLat,
  longitude: defaultSettings.centerLng,
  notes: "",
});

export const MapEditor = () => {
  const [settings, setSettings] = useState<MapSettings>(() => loadMapSettings());
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (settings.markers.length === 0) {
      setSelectedMarkerId(null);
    } else if (!selectedMarkerId || !settings.markers.some((marker) => marker.id === selectedMarkerId)) {
      setSelectedMarkerId(settings.markers[0].id);
    }
  }, [selectedMarkerId, settings.markers]);

  const selectedMarker = useMemo(
    () => settings.markers.find((marker) => marker.id === selectedMarkerId) || null,
    [selectedMarkerId, settings.markers]
  );

  const updateSettings = <Key extends keyof MapSettings>(field: Key, value: MapSettings[Key]) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateMarker = <Key extends keyof MapMarker>(field: Key, value: MapMarker[Key]) => {
    setSettings((prev) => ({
      ...prev,
      markers: prev.markers.map((marker) =>
        marker.id === selectedMarkerId ? { ...marker, [field]: value } : marker
      ),
    }));
  };

  const addMarker = () => {
    setSettings((prev) => {
      const nextDay = prev.markers.length > 0 ? Math.max(...prev.markers.map((marker) => marker.day)) + 1 : 1;
      const marker = blankMarker(nextDay);
      return {
        ...prev,
        markers: [...prev.markers, marker],
      };
    });
  };

  const removeMarker = () => {
    setSettings((prev) => ({
      ...prev,
      markers: prev.markers.filter((marker) => marker.id !== selectedMarkerId),
    }));
    setSelectedMarkerId(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl">Carte interactive</CardTitle>
        <CardDescription>
          Configurez le token Mapbox et gérez les étapes de votre itinéraire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-2">
            <Label>Token Mapbox</Label>
            <Input
              value={settings.token}
              onChange={(event) => updateSettings("token", event.target.value)}
              placeholder="pk.eyJ..."
            />
          </div>
          <div className="space-y-2">
            <Label>Zoom par défaut</Label>
            <Input
              type="number"
              min={1}
              max={16}
              value={settings.zoom}
              onChange={(event) => updateSettings("zoom", Number(event.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Latitude (centre)</Label>
            <Input
              type="number"
              value={settings.centerLat}
              onChange={(event) => updateSettings("centerLat", Number(event.target.value))}
              step="0.0001"
            />
          </div>
          <div className="space-y-2">
            <Label>Longitude (centre)</Label>
            <Input
              type="number"
              value={settings.centerLng}
              onChange={(event) => updateSettings("centerLng", Number(event.target.value))}
              step="0.0001"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <Button onClick={addMarker} className="w-full flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une étape
            </Button>
            <ScrollArea className="h-[360px] pr-2">
              <div className="space-y-2">
                {settings.markers.map((marker) => (
                  <button
                    type="button"
                    key={marker.id}
                    onClick={() => setSelectedMarkerId(marker.id)}
                    className={cn(
                      "w-full rounded-md border px-4 py-3 text-left transition-colors",
                      selectedMarkerId === marker.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">Jour {marker.day} — {marker.name}</span>
                      <Badge variant="outline">{marker.latitude.toFixed(2)} / {marker.longitude.toFixed(2)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{marker.notes || "Aucune note"}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {selectedMarker ? (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Détails de l'étape</h3>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={removeMarker}
                  disabled={!selectedMarker}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={selectedMarker.name}
                    onChange={(event) => updateMarker("name", event.target.value)}
                    placeholder="Nom de l'étape"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jour</Label>
                  <Input
                    type="number"
                    min={1}
                    value={selectedMarker.day}
                    onChange={(event) => updateMarker("day", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={selectedMarker.latitude}
                    onChange={(event) => updateMarker("latitude", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={selectedMarker.longitude}
                    onChange={(event) => updateMarker("longitude", Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={selectedMarker.notes}
                  onChange={(event) => updateMarker("notes", event.target.value)}
                  placeholder="Conseils pratiques, anecdotes, points de vigilance..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              Ajoutez ou sélectionnez une étape pour la modifier.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
