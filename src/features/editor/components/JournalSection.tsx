import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { JournalEntry } from "@/data/journalEntries";
import { EntryForm } from "./EntryForm";
import { GenericListEditor } from "./GenericListEditor";
import { useEditableCollection } from "../hooks/useEditableCollection";
import { PublicationStatusControls } from "./PublicationStatusControls";
import type { ContentStatus } from "@/types/content";

interface JournalSectionProps {
  entries: JournalEntry[];
  onChange: (entries: JournalEntry[]) => void;
  getStatus: (day: number) => ContentStatus;
  onStatusChange: (day: number, status: ContentStatus) => void;
}

type JournalEntryDraft = {
  day: number | "";
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
};

const sortByDay = (items: JournalEntry[]): JournalEntry[] =>
  [...items].sort((a, b) => a.day - b.day);

const createDraft = (items: JournalEntry[]): JournalEntryDraft => {
  const maxDay = items.reduce((max, entry) => Math.max(max, entry.day), 0);
  return {
    day: maxDay + 1,
    date: "",
    title: "",
    location: "",
    story: "",
    mood: "",
  };
};

const toDraft = (entry: JournalEntry): JournalEntryDraft => ({
  day: entry.day,
  date: entry.date,
  title: entry.title,
  location: entry.location,
  story: entry.story,
  mood: entry.mood,
});

const fromDraft = (draft: JournalEntryDraft): JournalEntry | null => {
  if (typeof draft.day !== "number" || Number.isNaN(draft.day)) {
    return null;
  }

  return {
    day: draft.day,
    date: draft.date.trim(),
    title: draft.title.trim(),
    location: draft.location.trim(),
    story: draft.story.trim(),
    mood: draft.mood.trim(),
  };
};

const validateDraft = (draft: JournalEntryDraft): string[] => {
  const errors: string[] = [];

  const dayValue = typeof draft.day === "number" ? draft.day : Number.NaN;
  if (Number.isNaN(dayValue) || dayValue <= 0) {
    errors.push("Le jour doit être un nombre positif.");
  }

  if (!draft.date.trim()) {
    errors.push("La date est obligatoire.");
  }

  if (!draft.title.trim()) {
    errors.push("Le titre est obligatoire.");
  }

  if (!draft.location.trim()) {
    errors.push("Le lieu est obligatoire.");
  }

  if (!draft.story.trim()) {
    errors.push("L'histoire ne peut pas être vide.");
  }

  if (!draft.mood.trim()) {
    errors.push("L'humeur est obligatoire.");
  }

  return errors;
};

export const JournalSection = ({ entries, onChange, getStatus, onStatusChange }: JournalSectionProps) => {
  const editor = useEditableCollection<JournalEntry, number, JournalEntryDraft>({
    items: entries,
    onChange,
    getKey: (entry) => entry.day,
    createDraft,
    toDraft,
    fromDraft,
    sort: sortByDay,
    validateDraft,
  });

  const formTitle = editor.mode === "edit"
    ? `Modifier - Jour ${editor.draft?.day ?? ""}`
    : `Ajouter une entrée`;

  return (
    <GenericListEditor
      title="Entrées du journal"
      count={editor.sortedItems.length}
      addLabel="➕ Ajouter un jour"
      onAdd={editor.startCreate}
      editingCard={
        editor.draft && (
          <EntryForm
            title={formTitle}
            onSave={editor.saveDraft}
            onCancel={editor.cancelEdit}
            errors={editor.errors}
            isSaveDisabled={editor.draft.day === ""}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="journal-day">Jour</label>
                <Input
                  id="journal-day"
                  type="number"
                  value={editor.draft.day}
                  onChange={(event) => {
                    const rawValue = event.target.value;
                    const parsedValue = Number.parseInt(rawValue, 10);
                    editor.updateDraft({ day: Number.isNaN(parsedValue) ? "" : parsedValue });
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="journal-date">Date</label>
                <Input
                  id="journal-date"
                  value={editor.draft.date}
                  placeholder="15 janvier 2024"
                  onChange={(event) => editor.updateDraft({ date: event.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="journal-title">Titre</label>
              <Input
                id="journal-title"
                value={editor.draft.title}
                placeholder="Arrivée à Amman"
                onChange={(event) => editor.updateDraft({ title: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium" htmlFor="journal-location">Lieu</label>
                <Input
                  id="journal-location"
                  value={editor.draft.location}
                  placeholder="Amman"
                  onChange={(event) => editor.updateDraft({ location: event.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="journal-mood">Humeur</label>
                <Input
                  id="journal-mood"
                  value={editor.draft.mood}
                  placeholder="Excité"
                  onChange={(event) => editor.updateDraft({ mood: event.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="journal-story">Histoire</label>
              <Textarea
                id="journal-story"
                rows={6}
                value={editor.draft.story}
                placeholder="Racontez votre journée..."
                onChange={(event) => editor.updateDraft({ story: event.target.value })}
              />
            </div>
          </EntryForm>
        )
      }
    >
      {editor.sortedItems.map((entry) => {
        const status = getStatus(entry.day);

        return (
          <Card key={entry.day}>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge variant="outline">Jour {entry.day}</Badge>
                  <CardTitle className="mt-2">{entry.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {entry.date} • {entry.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <PublicationStatusControls
                    status={status}
                    onPublish={() => onStatusChange(entry.day, "published")}
                    onUnpublish={() => onStatusChange(entry.day, "draft")}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => editor.startEdit(entry.day)}>
                      ✏️ Modifier
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => editor.deleteItem(entry.day)}>
                      🗑️
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{entry.story}</p>
              <Badge variant="secondary" className="mt-3">
                {entry.mood}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </GenericListEditor>
  );
};
