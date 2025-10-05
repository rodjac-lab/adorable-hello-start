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
import { foodExperiences as canonicalFoodExperiences } from "@/data/foodExperiences";
import type { FoodExperience } from "@/types/content";

const STORAGE_KEY = "studio_food_items";

const defaultFoodExperiences: FoodExperience[] = canonicalFoodExperiences.map((experience) => ({
  name: experience.name,
  type: experience.type,
  description: experience.description,
  experience: experience.experience,
  rating: experience.rating,
  location: experience.location,
  price: experience.price,
}));

const loadFoodExperiences = (): FoodExperience[] => {
  if (typeof window === "undefined") {
    return defaultFoodExperiences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultFoodExperiences;
    }
    const parsed = JSON.parse(stored) as FoodExperience[];
    if (!Array.isArray(parsed)) {
      return defaultFoodExperiences;
    }
    return parsed;
  } catch (error) {
    console.warn("Impossible de charger les expériences culinaires", error);
    return defaultFoodExperiences;
  }
};

const blankExperience: FoodExperience = {
  name: "Nouveau plat",
  type: "Découverte",
  description: "",
  experience: "",
  rating: 3,
  location: "",
  price: "Abordable",
};

export const FoodEditor = () => {
  const [experiences, setExperiences] = useState<FoodExperience[]>(() => loadFoodExperiences());
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(experiences));
  }, [experiences]);

  useEffect(() => {
    if (selectedIndex >= experiences.length) {
      setSelectedIndex(Math.max(0, experiences.length - 1));
    }
  }, [experiences.length, selectedIndex]);

  const selectedExperience = useMemo(() => experiences[selectedIndex], [experiences, selectedIndex]);

  const updateSelected = <Key extends keyof FoodExperience>(field: Key, value: FoodExperience[Key]) => {
    setExperiences((prev) =>
      prev.map((experience, index) =>
        index === selectedIndex ? { ...experience, [field]: value } : experience
      )
    );
  };

  const addExperience = () => {
    setExperiences((prev) => [...prev, { ...blankExperience }]);
    setSelectedIndex(experiences.length);
  };

  const removeExperience = () => {
    setExperiences((prev) => prev.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((prev) => Math.max(0, prev - 1));
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
              {experiences.map((experience, index) => (
                <button
                  type="button"
                  key={`${experience.name}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full rounded-md border px-4 py-3 text-left transition-colors",
                    index === selectedIndex
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{experience.name || `Entrée ${index + 1}`}</span>
                    <Badge variant="outline">{experience.price}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{experience.type}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {selectedExperience ? (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Fiche détaillée</h3>
              <Button
                variant="destructive"
                size="icon"
                onClick={removeExperience}
                disabled={experiences.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={selectedExperience.name}
                  onChange={(event) => updateSelected("name", event.target.value)}
                  placeholder="Nom du plat"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={selectedExperience.type}
                  onChange={(event) => updateSelected("type", event.target.value)}
                  placeholder="Street food, dessert..."
                />
              </div>

              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input
                  value={selectedExperience.location}
                  onChange={(event) => updateSelected("location", event.target.value)}
                  placeholder="Lieu de dégustation"
                />
              </div>

              <div className="space-y-2">
                <Label>Fourchette de prix</Label>
                <Input
                  value={selectedExperience.price}
                  onChange={(event) => updateSelected("price", event.target.value)}
                  placeholder="Très abordable, modéré..."
                />
              </div>

              <div className="space-y-2">
                <Label>Note (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={selectedExperience.rating}
                  onChange={(event) => updateSelected("rating", Number(event.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={selectedExperience.description}
                onChange={(event) => updateSelected("description", event.target.value)}
                placeholder="Décrivez le plat et ses spécificités"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Votre expérience</Label>
              <Textarea
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
