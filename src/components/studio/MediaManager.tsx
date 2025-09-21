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

interface MediaAsset {
  id: string;
  title: string;
  type: "photo" | "video" | "audio" | "document";
  url: string;
  description: string;
  tags: string;
}

const STORAGE_KEY = "studio_media_assets";

const defaultAssets: MediaAsset[] = [
  {
    id: "media-1",
    title: "Coucher de soleil sur Wadi Rum",
    type: "photo",
    url: "/lovable-uploads/wadi-rum-sunset.jpg",
    description: "Panorama capturé depuis un camp bédouin, idéal pour illustrer la section Médias.",
    tags: "wadi-rum,coucher-de-soleil,paysage",
  },
  {
    id: "media-2",
    title: "Ambiance du souk d'Amman",
    type: "audio",
    url: "/lovable-uploads/amman-souk.mp3",
    description: "Ambiance sonore enregistrée sur place, parfaite pour enrichir les stories Instagram ou TikTok.",
    tags: "amman,souk,ambiance",
  },
];

const loadAssets = (): MediaAsset[] => {
  if (typeof window === "undefined") {
    return defaultAssets;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultAssets;
    }
    const parsed = JSON.parse(stored) as MediaAsset[];
    if (!Array.isArray(parsed)) {
      return defaultAssets;
    }
    return parsed;
  } catch (error) {
    console.warn("Impossible de charger les médias", error);
    return defaultAssets;
  }
};

const createAssetId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const blankAsset: MediaAsset = {
  id: createAssetId(),
  title: "Nouveau média",
  type: "photo",
  url: "",
  description: "",
  tags: "",
};

export const MediaManager = () => {
  const [assets, setAssets] = useState<MediaAsset[]>(() => loadAssets());
  const [selectedId, setSelectedId] = useState<string | null>(assets[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    if (assets.length === 0) {
      setSelectedId(null);
    } else if (!selectedId || !assets.some((asset) => asset.id === selectedId)) {
      setSelectedId(assets[0].id);
    }
  }, [assets, selectedId]);

  const selectedAsset = useMemo(() => assets.find((asset) => asset.id === selectedId) ?? null, [assets, selectedId]);

  const updateAsset = <Key extends keyof MediaAsset>(field: Key, value: MediaAsset[Key]) => {
    setAssets((prev) => prev.map((asset) => (asset.id === selectedId ? { ...asset, [field]: value } : asset)));
  };

  const addAsset = () => {
    const asset = { ...blankAsset, id: createAssetId() };
    setAssets((prev) => [...prev, asset]);
    setSelectedId(asset.id);
  };

  const removeAsset = () => {
    setAssets((prev) => prev.filter((asset) => asset.id !== selectedId));
    setSelectedId(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl">Médias</CardTitle>
        <CardDescription>
          Centralisez vos assets visuels et sonores prêts à être publiés.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Button onClick={addAsset} className="w-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un média
          </Button>
          <ScrollArea className="h-[360px] pr-2">
            <div className="space-y-2">
              {assets.map((asset) => (
                <button
                  type="button"
                  key={asset.id}
                  onClick={() => setSelectedId(asset.id)}
                  className={cn(
                    "w-full rounded-md border px-4 py-3 text-left transition-colors",
                    selectedId === asset.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{asset.title || "Média sans titre"}</span>
                    <Badge variant="outline">{asset.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{asset.url || "URL non définie"}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {selectedAsset ? (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Détails du média</h3>
              <Button
                variant="destructive"
                size="icon"
                onClick={removeAsset}
                disabled={!selectedAsset}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={selectedAsset.title}
                  onChange={(event) => updateAsset("title", event.target.value)}
                  placeholder="Nom du média"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedAsset.type}
                  onChange={(event) => updateAsset("type", event.target.value as MediaAsset["type"])}
                >
                  <option value="photo">Photo</option>
                  <option value="video">Vidéo</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={selectedAsset.url}
                onChange={(event) => updateAsset("url", event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={selectedAsset.description}
                onChange={(event) => updateAsset("description", event.target.value)}
                placeholder="Contexte, crédits, conseils d'utilisation..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Mots-clés</Label>
              <Input
                value={selectedAsset.tags}
                onChange={(event) => updateAsset("tags", event.target.value)}
                placeholder="Séparez les tags par des virgules"
              />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Sélectionnez un média pour le modifier ou ajoutez-en un nouveau.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
