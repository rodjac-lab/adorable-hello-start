import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FoodExperience } from "@/data/foodExperiences";
import { EntryForm } from "./EntryForm";
import { GenericListEditor } from "./GenericListEditor";
import { useEditableCollection } from "../hooks/useEditableCollection";

interface FoodSectionProps {
  experiences: FoodExperience[];
  onChange: (experiences: FoodExperience[]) => void;
}

type FoodExperienceDraft = {
  id: string;
  day: number | "";
  dish: string;
  location: string;
  description: string;
  rating: number | "";
  cultural_note?: string;
};

const sortByDay = (items: FoodExperience[]): FoodExperience[] =>
  [...items].sort((a, b) => a.day - b.day);

const generateId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDraft = (items: FoodExperience[]): FoodExperienceDraft => {
  const maxDay = items.reduce((max, item) => Math.max(max, item.day), 0);
  return {
    id: generateId(),
    day: maxDay + 1,
    dish: "",
    location: "",
    description: "",
    rating: 5,
    cultural_note: "",
  };
};

const toDraft = (experience: FoodExperience): FoodExperienceDraft => ({
  id: experience.id,
  day: experience.day,
  dish: experience.dish,
  location: experience.location,
  description: experience.description,
  rating: experience.rating,
  cultural_note: experience.cultural_note ?? "",
});

const fromDraft = (draft: FoodExperienceDraft): FoodExperience | null => {
  if (typeof draft.day !== "number" || Number.isNaN(draft.day)) {
    return null;
  }

  if (typeof draft.rating !== "number" || Number.isNaN(draft.rating)) {
    return null;
  }

  return {
    id: draft.id,
    day: draft.day,
    dish: draft.dish.trim(),
    location: draft.location.trim(),
    description: draft.description.trim(),
    rating: draft.rating,
    cultural_note: draft.cultural_note?.trim() || undefined,
  };
};

const validateDraft = (draft: FoodExperienceDraft): string[] => {
  const errors: string[] = [];

  const dayValue = typeof draft.day === "number" ? draft.day : Number.NaN;
  if (Number.isNaN(dayValue) || dayValue <= 0) {
    errors.push("Le jour doit être un nombre positif.");
  }

  if (!draft.dish.trim()) {
    errors.push("Le nom du plat est obligatoire.");
  }

  if (!draft.location.trim()) {
    errors.push("Le lieu est obligatoire.");
  }

  if (!draft.description.trim()) {
    errors.push("La description est obligatoire.");
  }

  const ratingValue = typeof draft.rating === "number" ? draft.rating : Number.NaN;
  if (Number.isNaN(ratingValue)) {
    errors.push("La note doit être un nombre entre 1 et 5.");
  } else if (ratingValue < 1 || ratingValue > 5) {
    errors.push("La note doit être comprise entre 1 et 5.");
  }

  return errors;
};

export const FoodSection = ({ experiences, onChange }: FoodSectionProps) => {
  const editor = useEditableCollection<FoodExperience, string, FoodExperienceDraft>({
    items: experiences,
    onChange,
    getKey: (experience) => experience.id,
    createDraft,
    toDraft,
    fromDraft,
    sort: sortByDay,
    validateDraft,
  });

  const formTitle = editor.mode === "edit" ? "Modifier une expérience" : "Ajouter une expérience";

  return (
    <GenericListEditor
      title="Expériences culinaires"
      count={editor.sortedItems.length}
      addLabel="➕ Ajouter une expérience"
      onAdd={editor.startCreate}
      editingCard={
        editor.draft && (
          <EntryForm
            title={formTitle}
            onSave={editor.saveDraft}
            onCancel={editor.cancelEdit}
            errors={editor.errors}
            isSaveDisabled={editor.draft.day === "" || editor.draft.rating === ""}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="food-day">Jour</label>
                <Input
                  id="food-day"
                  type="number"
                  value={editor.draft.day}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    const parsed = Number.parseInt(rawValue, 10);
                    editor.updateDraft({ day: Number.isNaN(parsed) ? "" : parsed });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="food-rating">Note (1-5)</label>
                <Input
                  id="food-rating"
                  type="number"
                  min={1}
                  max={5}
                  value={editor.draft.rating}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    const parsed = Number.parseInt(rawValue, 10);
                    editor.updateDraft({ rating: Number.isNaN(parsed) ? "" : parsed });
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="food-dish">Plat</label>
              <Input
                id="food-dish"
                value={editor.draft.dish}
                placeholder="Mansaf"
                onChange={(event) => editor.updateDraft({ dish: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="food-location">Lieu</label>
              <Input
                id="food-location"
                value={editor.draft.location}
                placeholder="Restaurant traditionnel, Amman"
                onChange={(event) => editor.updateDraft({ location: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="food-description">Description</label>
              <Textarea
                id="food-description"
                rows={4}
                value={editor.draft.description}
                placeholder="Décrivez le plat et votre expérience..."
                onChange={(event) => editor.updateDraft({ description: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="food-note">Note culturelle (optionnel)</label>
              <Textarea
                id="food-note"
                rows={3}
                value={editor.draft.cultural_note ?? ""}
                placeholder="Informations culturelles sur ce plat..."
                onChange={(event) => editor.updateDraft({ cultural_note: event.target.value })}
              />
            </div>
          </EntryForm>
        )
      }
    >
      {editor.sortedItems.map((experience) => (
        <Card key={experience.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline">Jour {experience.day}</Badge>
                <CardTitle className="mt-2">{experience.dish}</CardTitle>
                <p className="text-sm text-muted-foreground">{experience.location}</p>
                <div className="mt-1 text-sm" aria-label={`Note ${experience.rating} sur 5`}>
                  {"⭐".repeat(experience.rating)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => editor.startEdit(experience.id)}>
                  ✏️ Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => editor.deleteItem(experience.id)}>
                  🗑️
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{experience.description}</p>
            {experience.cultural_note && (
              <p className="mt-3 text-sm text-muted-foreground">{experience.cultural_note}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </GenericListEditor>
  );
};
