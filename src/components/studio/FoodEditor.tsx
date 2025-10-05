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
import type { ContentStatus, FoodExperience } from "@/types/content";
import { PublicationStatusControls } from "@/features/editor/components/PublicationStatusControls";

interface FoodEditorProps {
  experiences: FoodExperience[];
  onChange: (next: FoodExperience[]) => void;
  getStatus: (id: string) => ContentStatus;
  onStatusChange: (id: string, status: ContentStatus) => void;
  onGenerateId: () => string;
}

const createBlankExperience = (generateId: () => string): FoodExperience => ({
  id: generateId(),
  name: "Nouveau plat",
  type: "Découverte",
  description: "",
  experience: "",
  rating: 3,
  location: "",
  price: "Abordable",
});

const getStatusVariant = (status: ContentStatus): "default" | "outline" => {
  return status === "published" ? "default" : "outline";
};

const getStatusLabel = (status: ContentStatus): string => {
  return status === "published" ? "Publié" : "Brouillon";
};

export const FoodEditor = ({
  experiences,
  onChange,
  getStatus,
  onStatusChange,
  onGenerateId,
}: FoodEditorProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(experiences[0]?.id ?? null);

  useEffect(() => {
    if (experiences.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !experiences.some((experience) => experience.id === selectedId)) {
      setSelectedId(experiences[0].id);
    }
  }, [experiences, selectedId]);

  const selectedExperience = useMemo(
    () => experiences.find((experience) => experience.id === selectedId) ?? null,
    [experiences, selectedId],
  );

  const updateSelected = <Key extends keyof FoodExperience>(field: Key, value: FoodExperience[Key]) => {
    if (!selectedId) {
      return;
    }

    const next = experiences.map((experience) =>
      experience.id === selectedId ? { ...experience, [field]: value } : experience,
    );
    onChange(next);
  };

  const addExperience = () => {
    const nextExperience = createBlankExperience(onGenerateId);
    onChange([...experiences, nextExperience]);
    setSelectedId(nextExperience.id);
  };

  const removeExperience = () => {
    if (!selectedId) {
      return;
    }

    const currentIndex = experiences.findIndex((experience) => experience.id === selectedId);
    const next = experiences.filter((experience) => experience.id !== selectedId);
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
        <CardTitle className="font-serif text-2xl">Gastronomie</CardTitle>
        <CardDescription>
          Centralisez vos notes culinaires et les informations à publier.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Button onClick={addExperience} className="w-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un plat
          </Button>
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-2">
              {experiences.map((experience) => {
                const status = getStatus(experience.id);
                return (
                  <button
                    type="button"
                    key={experience.id}
                    onClick={() => setSelectedId(experience.id)}
                    className={cn(
                      "w-full rounded-md border px-4 py-3 text-left transition-colors",
                      selectedId === experience.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {experience.name || "Entrée sans titre"}
                      </span>
                      <Badge variant={getStatusVariant(status)} className="text-xs">
                        {getStatusLabel(status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{experience.type}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {selectedExperience ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Fiche détaillée</h3>
                <p className="text-xs text-muted-foreground">Dernière étape avant publication</p>
              </div>
              <div className="flex items-center gap-3">
                <PublicationStatusControls
                  status={getStatus(selectedExperience.id)}
                  onPublish={() => onStatusChange(selectedExperience.id, "published")}
                  onUnpublish={() => onStatusChange(selectedExperience.id, "draft")}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={removeExperience}
                  disabled={experiences.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="food-name">Nom</Label>
                <Input
                  id="food-name"
                  value={selectedExperience.name}
                  onChange={(event) => updateSelected("name", event.target.value)}
                  placeholder="Nom du plat"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-type">Type</Label>
                <Input
                  id="food-type"
                  value={selectedExperience.type}
                  onChange={(event) => updateSelected("type", event.target.value)}
                  placeholder="Street food, dessert..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-location">Lieu</Label>
                <Input
                  id="food-location"
                  value={selectedExperience.location}
                  onChange={(event) => updateSelected("location", event.target.value)}
                  placeholder="Lieu de dégustation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-price">Fourchette de prix</Label>
                <Input
                  id="food-price"
                  value={selectedExperience.price}
                  onChange={(event) => updateSelected("price", event.target.value)}
                  placeholder="Très abordable, modéré..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="food-rating">Note (1-5)</Label>
                <Input
                  id="food-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={selectedExperience.rating}
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
              <Label htmlFor="food-description">Description</Label>
              <Textarea
                id="food-description"
                value={selectedExperience.description}
                onChange={(event) => updateSelected("description", event.target.value)}
                placeholder="Décrivez le plat et ses spécificités"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="food-experience">Votre expérience</Label>
              <Textarea
                id="food-experience"
                value={selectedExperience.experience}
                onChange={(event) => updateSelected("experience", event.target.value)}
                placeholder="Ce qui a rendu cette dégustation mémorable"
                className="min-h-[120px]"
              />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Sélectionnez un plat pour le modifier ou créez une nouvelle expérience.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
