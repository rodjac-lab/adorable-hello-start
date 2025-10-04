import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { BookRecommendation } from "@/data/readingRecommendations";
import { EntryForm } from "./EntryForm";
import { GenericListEditor } from "./GenericListEditor";
import { useEditableCollection } from "../hooks/useEditableCollection";

interface BookSectionProps {
  books: BookRecommendation[];
  onChange: (books: BookRecommendation[]) => void;
}

type BookDraft = {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  why_recommend: string;
  amazon_link?: string;
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
  description: "",
  category: "",
  why_recommend: "",
  amazon_link: "",
});

const toDraft = (book: BookRecommendation): BookDraft => ({
  id: book.id,
  title: book.title,
  author: book.author,
  description: book.description,
  category: book.category,
  why_recommend: book.why_recommend,
  amazon_link: book.amazon_link ?? "",
});

const fromDraft = (draft: BookDraft): BookRecommendation | null => {
  return {
    id: draft.id,
    title: draft.title.trim(),
    author: draft.author.trim(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    why_recommend: draft.why_recommend.trim(),
    amazon_link: draft.amazon_link?.trim() || undefined,
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

  if (!draft.category.trim()) {
    errors.push("La catégorie est obligatoire.");
  }

  if (!draft.description.trim()) {
    errors.push("La description est obligatoire.");
  }

  if (!draft.why_recommend.trim()) {
    errors.push("Expliquez pourquoi vous recommandez ce livre.");
  }

  return errors;
};

export const BookSection = ({ books, onChange }: BookSectionProps) => {
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
            <div>
              <label className="text-sm font-medium" htmlFor="book-category">Catégorie</label>
              <Input
                id="book-category"
                value={editor.draft.category}
                placeholder="Histoire"
                onChange={(event) => editor.updateDraft({ category: event.target.value })}
              />
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
              <label className="text-sm font-medium" htmlFor="book-why">Pourquoi le recommander ?</label>
              <Textarea
                id="book-why"
                rows={3}
                value={editor.draft.why_recommend}
                placeholder="Expliquez pourquoi vous recommandez ce livre..."
                onChange={(event) => editor.updateDraft({ why_recommend: event.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="book-amazon">Lien Amazon (optionnel)</label>
              <Input
                id="book-amazon"
                value={editor.draft.amazon_link ?? ""}
                placeholder="https://amazon.com/..."
                onChange={(event) => editor.updateDraft({ amazon_link: event.target.value })}
              />
            </div>
          </EntryForm>
        )
      }
    >
      {editor.sortedItems.map((book) => (
        <Card key={book.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="outline">{book.category}</Badge>
                <CardTitle className="mt-2">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">par {book.author}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => editor.startEdit(book.id)}>
                  ✏️ Modifier
                </Button>
                <Button size="sm" variant="destructive" onClick={() => editor.deleteItem(book.id)}>
                  🗑️
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{book.description}</p>
            <p className="mt-3 text-sm text-muted-foreground">{book.why_recommend}</p>
            {book.amazon_link && (
              <a
                className="mt-3 inline-flex text-sm text-primary underline"
                href={book.amazon_link}
                target="_blank"
                rel="noreferrer"
              >
                Voir sur Amazon ↗
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </GenericListEditor>
  );
};
