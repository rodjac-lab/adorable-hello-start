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
  name: string;
  type: string;
  description: string;
  experience: string;
  rating: number | "";
  location: string;
  price: string;
};

const sortByName = (items: FoodExperience[]): FoodExperience[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

const generateId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDraft = (items: FoodExperience[]): FoodExperienceDraft => {
  return {
    id: generateId(),
    name: "",
    type: "",
    description: "",
    experience: "",
    rating: items.length > 0 ? 4 : 5,
    location: "",
    price: "",
  };
};

const toDraft = (experience: FoodExperience): FoodExperienceDraft => ({
  id: experience.id,
  name: experience.name,
  type: experience.type,
  description: experience.description,
  experience: experience.experience,
  rating: experience.rating,
  location: experience.location,
  price: experience.price,
});

const fromDraft = (draft: FoodExperienceDraft): FoodExperience | null => {
  if (typeof draft.rating !== "number" || Number.isNaN(draft.rating)) {
    return null;
  }

  const name = draft.name.trim();
  const type = draft.type.trim();
  const description = draft.description.trim();
  const personalExperience = draft.experience.trim();
  const location = draft.location.trim();
  const price = draft.price.trim();

  if (!name || !type || !description || !personalExperience || !location || !price) {
    return null;
  }

  return {
    id: draft.id,
    name,
    type,
    description,
    experience: personalExperience,
    rating: draft.rating,
    location,
    price,
  };
};

const validateDraft = (draft: FoodExperienceDraft): string[] => {
  const errors: string[] = [];

  if (!draft.name.trim()) {
    errors.push("Le nom du plat est obligatoire.");
  }

  if (!draft.type.trim()) {
    errors.push("Le type de plat est obligatoire.");
  }

  if (!draft.location.trim()) {
    errors.push("Le lieu est obligatoire.");
  }

  if (!draft.description.trim()) {
    errors.push("La description est obligatoire.");
  }

  if (!draft.experience.trim()) {
    errors.push("Racontez votre expérience personnelle.");
  }

  if (!draft.price.trim()) {
    errors.push("Indiquez une indication de prix.");
  }

  const ratingValue = typeof draft.rating === "number" ? draft.rating : Number.NaN;
  if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
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
    sort: sortByName,
    validateDraft,
  });

  const formTitle = editor.mode === "edit" ? "Modifier une expérience" : "Ajouter une expérience";
  const isSaveDisabled =
    editor.draft == null ||
    typeof editor.draft.rating !== "number" ||
    !editor.draft.name.trim() ||
    !editor.draft.type.trim() ||
    !editor.draft.description.trim() ||
    !editor.draft.experience.trim() ||
    !editor.draft.location.trim() ||
    !editor.draft.price.trim();

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
            isSaveDisabled={isSaveDisabled}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="food-name">
                  Nom du plat
                </label>
                <Input
                  id="food-name"
                  value={editor.draft.name}
                  placeholder="Mansaf"
                  onChange={(event) => editor.updateDraft({ name: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="food-type">
                  Type
                </label>
                <Input
                  id="food-type"
                  value={editor.draft.type}
                  placeholder="Plat national"
                  onChange={(event) => editor.updateDraft({ type: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="food-rating">
                  Note (1-5)
                </label>
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
              <div>
                <label className="text-sm font-medium" htmlFor="food-price">
                  Prix / budget
                </label>
                <Input
                  id="food-price"
                  value={editor.draft.price}
                  placeholder="Abordable"
                  onChange={(event) => editor.updateDraft({ price: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="food-location">
                  Lieu
                </label>
                <Input
                  id="food-location"
                  value={editor.draft.location}
                  placeholder="Downtown Amman"
                  onChange={(event) => editor.updateDraft({ location: event.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="food-description">
                Description
              </label>
              <Textarea
                id="food-description"
                rows={3}
                value={editor.draft.description}
                placeholder="Décrivez le plat..."
                onChange={(event) => editor.updateDraft({ description: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="food-experience">
                Votre expérience
              </label>
              <Textarea
                id="food-experience"
                rows={3}
                value={editor.draft.experience}
                placeholder="Partagez votre ressenti, anecdotes, contexte..."
                onChange={(event) => editor.updateDraft({ experience: event.target.value })}
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
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{experience.type}</Badge>
                  <Badge>{experience.price}</Badge>
                </div>
                <CardTitle>{experience.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{experience.location}</p>
                <div className="text-sm" aria-label={`Note ${experience.rating} sur 5`}>
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
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </h3>
              <p className="text-sm leading-relaxed">{experience.description}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Mon expérience
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{experience.experience}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </GenericListEditor>
  );
};
