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
import type { ContentStatus, ReadingRecommendation } from "@/types/content";
import { PublicationStatusControls } from "@/features/editor/components/PublicationStatusControls";

interface ReadingEditorProps {
  items: ReadingRecommendation[];
  onChange: (next: ReadingRecommendation[]) => void;
  getStatus: (id: string) => ContentStatus;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onGenerateId: () => string;
}

const createBlankRecommendation = (generateId: () => string): ReadingRecommendation => ({
  id: generateId(),
  title: "Nouvelle recommandation",
  author: "Auteur à définir",
  type: "Essai",
  description: "",
  why: "",
  amazon: "",
  rating: 4,
});

const getStatusVariant = (status: ContentStatus): "default" | "outline" => {
  return status === "published" ? "default" : "outline";
};

const getStatusLabel = (status: ContentStatus): string => {
  return status === "published" ? "Publié" : "Brouillon";
};

export const ReadingEditor = ({
  items,
  onChange,
  getStatus,
  onStatusChange,
  onGenerateId,
}: ReadingEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const updateSelected = <Key extends keyof ReadingRecommendation>(
    field: Key,
    value: ReadingRecommendation[Key],
  ) => {
    if (!selectedId) {
      return;
    }

    const next = items.map((item) => (item.id === selectedId ? { ...item, [field]: value } : item));
    onChange(next);
  };

  const addItem = () => {
    const nextItem = createBlankRecommendation(onGenerateId);
    onChange([...items, nextItem]);
    setSelectedId(nextItem.id);
  };

  const removeItem = () => {
    if (!selectedId) {
      return;
    }

    const currentIndex = items.findIndex((item) => item.id === selectedId);
    const next = items.filter((item) => item.id !== selectedId);
    onChange(next);

    if (next.length === 0) {
      setSelectedId(null);
      return;
    }

    const fallbackIndex = Math.max(0, currentIndex - 1);
    setSelectedId(next[fallbackIndex]?.id ?? next[0].id);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl">Lectures</CardTitle>
        <CardDescription>
          Préparez vos recommandations de livres, podcasts ou ressources.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Button onClick={addItem} className="w-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une ressource
          </Button>
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-2">
              {items.map((item) => {
                const status = getStatus(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full rounded-md border px-4 py-3 text-left transition-colors",
                      selectedId === item.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.title || "Ressource sans titre"}</span>
                      <Badge variant={getStatusVariant(status)} className="text-xs">
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.author}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {selectedItem ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Détails de la ressource</h3>
                <p className="text-xs text-muted-foreground">
                  Publiez la recommandation une fois prête pour le site public
                </p>
              </div>
              <div className="flex items-center gap-3">
                <PublicationStatusControls
                  status={getStatus(selectedItem.id)}
                  onPublish={() => onStatusChange(selectedItem.id, "published")}
                  onUnpublish={() => onStatusChange(selectedItem.id, "draft")}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={removeItem}
                  disabled={items.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reading-title">Titre</Label>
                <Input
                  id="reading-title"
                  value={selectedItem.title}
                  onChange={(event) => updateSelected("title", event.target.value)}
                  placeholder="Titre de la ressource"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading-author">Auteur</Label>
                <Input
                  id="reading-author"
                  value={selectedItem.author}
                  onChange={(event) => updateSelected("author", event.target.value)}
                  placeholder="Auteur ou créateur"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading-type">Type</Label>
                <Input
                  id="reading-type"
                  value={selectedItem.type}
                  onChange={(event) => updateSelected("type", event.target.value)}
                  placeholder="Livre, podcast, article..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reading-rating">Note (1-5)</Label>
                <Input
                  id="reading-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={selectedItem.rating}
                  onChange={(event) => {
                    const parsed = Number(event.target.value);
                    if (Number.isNaN(parsed)) {
                      return;
                    }

                    const clamped = Math.min(5, Math.max(1, parsed));
                    updateSelected("rating", clamped);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading-description">Description</Label>
              <Textarea
                id="reading-description"
                value={selectedItem.description}
                onChange={(event) => updateSelected("description", event.target.value)}
                placeholder="Résumé de la ressource"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading-why">Pourquoi la recommander</Label>
              <Textarea
                id="reading-why"
                value={selectedItem.why}
                onChange={(event) => updateSelected("why", event.target.value)}
                placeholder="Votre regard personnel, ce qui rend la ressource unique"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reading-amazon">Lien (Amazon, éditeur...)</Label>
              <Input
                id="reading-amazon"
                value={selectedItem.amazon}
                onChange={(event) => updateSelected("amazon", event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Sélectionnez une ressource pour la modifier ou ajoutez une nouvelle recommandation.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
