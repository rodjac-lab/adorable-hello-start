import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookRecommendation } from "@/data/readingRecommendations";
import { EntryForm } from "./EntryForm";
import { GenericListEditor } from "./GenericListEditor";
import { useEditableCollection } from "../hooks/useEditableCollection";
import { PublicationStatusControls } from "./PublicationStatusControls";
import type { ContentStatus } from "@/types/content";

interface BookSectionProps {
  books: BookRecommendation[];
  onChange: (books: BookRecommendation[]) => void;
  getStatus: (id: string) => ContentStatus;
  onStatusChange: (id: string, status: ContentStatus) => void;
}

type BookDraft = {
  id: string;
  title: string;
  author: string;
  type: string;
  description: string;
  why: string;
  amazon: string;
  rating: number | "";
};

const generateId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createDraft = (): BookDraft => ({
  id: generateId(),
  title: "",
  author: "",
  type: "",
  description: "",
  why: "",
  amazon: "",
  rating: 4,
});

const toDraft = (book: BookRecommendation): BookDraft => ({
  id: book.id,
  title: book.title,
  author: book.author,
  type: book.type,
  description: book.description,
  why: book.why,
  amazon: book.amazon,
  rating: book.rating,
});

const fromDraft = (draft: BookDraft): BookRecommendation | null => {
  if (typeof draft.rating !== "number" || Number.isNaN(draft.rating)) {
    return null;
  }

  const title = draft.title.trim();
  const author = draft.author.trim();
  const type = draft.type.trim();
  const description = draft.description.trim();
  const why = draft.why.trim();
  const amazon = draft.amazon.trim();

  if (!title || !author || !type || !description || !why) {
    return null;
  }

  return {
    id: draft.id,
    title,
    author,
    type,
    description,
    why,
    amazon,
    rating: draft.rating,
  };
};

const validateDraft = (draft: BookDraft): string[] => {
  const errors: string[] = [];

  if (!draft.title.trim()) {
    errors.push("Le titre est obligatoire.");
  }

  if (!draft.author.trim()) {
    errors.push("L'auteur est obligatoire.");
  }

  if (!draft.type.trim()) {
    errors.push("La catégorie est obligatoire.");
  }

  if (!draft.description.trim()) {
    errors.push("La description est obligatoire.");
  }

  if (!draft.why.trim()) {
    errors.push("Expliquez pourquoi vous recommandez ce livre.");
  }

  const ratingValue = typeof draft.rating === "number" ? draft.rating : Number.NaN;
  if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    errors.push("La note doit être comprise entre 1 et 5.");
  }

  return errors;
};

export const BookSection = ({ books, onChange, getStatus, onStatusChange }: BookSectionProps) => {
  const editor = useEditableCollection<BookRecommendation, string, BookDraft>({
    items: books,
    onChange,
    getKey: (book) => book.id,
    createDraft,
    toDraft,
    fromDraft,
    validateDraft,
  });

  const formTitle = editor.mode === "edit" ? "Modifier une recommandation" : "Ajouter un livre";
  const isSaveDisabled =
    editor.draft == null ||
    typeof editor.draft.rating !== "number" ||
    !editor.draft.title.trim() ||
    !editor.draft.author.trim() ||
    !editor.draft.type.trim() ||
    !editor.draft.description.trim() ||
    !editor.draft.why.trim();

  return (
    <GenericListEditor
      title="Recommandations de lecture"
      count={editor.sortedItems.length}
      addLabel="➕ Ajouter un livre"
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
                <label className="text-sm font-medium" htmlFor="book-title">Titre</label>
                <Input
                  id="book-title"
                  value={editor.draft.title}
                  placeholder="Lawrence d'Arabie"
                  onChange={(event) => editor.updateDraft({ title: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="book-author">Auteur</label>
                <Input
                  id="book-author"
                  value={editor.draft.author}
                  placeholder="T.E. Lawrence"
                  onChange={(event) => editor.updateDraft({ author: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="book-type">Catégorie</label>
                <Input
                  id="book-type"
                  value={editor.draft.type}
                  placeholder="Histoire"
                  onChange={(event) => editor.updateDraft({ type: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="book-rating">Note (1-5)</label>
                <Input
                  id="book-rating"
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
              <label className="text-sm font-medium" htmlFor="book-description">Description</label>
              <Textarea
                id="book-description"
                rows={3}
                value={editor.draft.description}
                placeholder="Description du livre..."
                onChange={(event) => editor.updateDraft({ description: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="book-why">
                Pourquoi le recommander ?
              </label>
              <Textarea
                id="book-why"
                rows={3}
                value={editor.draft.why}
                placeholder="Expliquez pourquoi vous recommandez ce livre..."
                onChange={(event) => editor.updateDraft({ why: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="book-amazon">Lien (optionnel)</label>
              <Input
                id="book-amazon"
                value={editor.draft.amazon}
                placeholder="https://amazon.fr/..."
                onChange={(event) => editor.updateDraft({ amazon: event.target.value })}
              />
            </div>
          </EntryForm>
        )
      }
    >
      {editor.sortedItems.map((book) => {
        const status = getStatus(book.id);

        return (
          <Card key={book.id}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{book.type}</Badge>
                    <span aria-label={`Note ${book.rating} sur 5`}>{"⭐".repeat(book.rating)}</span>
                  </div>
                  <CardTitle>{book.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">par {book.author}</p>
                </div>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <PublicationStatusControls
                    status={status}
                    onPublish={() => onStatusChange(book.id, "published")}
                    onUnpublish={() => onStatusChange(book.id, "draft")}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editor.startEdit(book.id)}>
                      ✏️ Modifier
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => editor.deleteItem(book.id)}>
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{book.description}</p>
              <Card className="bg-secondary/10 border-secondary/20">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <span className="text-secondary text-lg">💭</span>
                    <div>
                      <p className="font-medium text-secondary mb-1">Pourquoi le lire</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{book.why}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {book.amazon && (
                <Button variant="outline" className="w-full" asChild>
                  <a href={book.amazon} target="_blank" rel="noopener noreferrer">
                    📖 Voir en ligne
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </GenericListEditor>
  );
};
