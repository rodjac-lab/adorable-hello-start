import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JournalEntry } from "@/data/journalEntries";
import { journalEntries as canonicalJournalEntries } from "@/data/journalEntries";
import type { FoodExperience } from "@/data/foodExperiences";
import { foodExperiences as canonicalFoodExperiences } from "@/data/foodExperiences";
import type { BookRecommendation } from "@/data/readingRecommendations";
import { readingRecommendations as canonicalReadingRecommendations } from "@/data/readingRecommendations";
import { useToast } from "@/hooks/use-toast";
import type { ContentStatus } from "@/types/content";
import { EDITOR_STORAGE_KEYS } from "./constants";
import { usePublicationState } from "@/features/publishing/usePublicationState";
import { JournalSection } from "./components/JournalSection";
import { FoodSection } from "./components/FoodSection";
import { BookSection } from "./components/BookSection";
import {
  isBrowser,
  loadCollection,
  saveCollection,
  SaveCollectionResult,
  toError,
} from "./storage";

const JOURNAL_STORAGE_KEY = EDITOR_STORAGE_KEYS.journal;
const FOOD_STORAGE_KEY = EDITOR_STORAGE_KEYS.food;
const BOOK_STORAGE_KEY = EDITOR_STORAGE_KEYS.books;


const downloadFile = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: "text/typescript" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const serializeJournalEntries = (entries: JournalEntry[]): string => `export interface JournalEntry {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
}

export const journalEntries: JournalEntry[] = ${JSON.stringify(entries, null, 2)};

export const getJournalEntries = () => journalEntries;
export const getJournalEntry = (day: number) => journalEntries.find((entry) => entry.day === day);
`;

const serializeFoodExperiences = (experiences: FoodExperience[]): string => `export interface FoodExperience {
  id: string;
  name: string;
  type: string;
  description: string;
  experience: string;
  rating: number;
  location: string;
  price: string;
}

export const foodExperiences: FoodExperience[] = ${JSON.stringify(experiences, null, 2)};

export const getFoodExperiences = () => foodExperiences;
`;

const serializeBookRecommendations = (books: BookRecommendation[]): string => `export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  type: string;
  description: string;
  why: string;
  amazon: string;
  rating: number;
}

export const readingRecommendations: BookRecommendation[] = ${JSON.stringify(books, null, 2)};

export const getReadingRecommendations = () => readingRecommendations;
`;

const EditorPage = () => {
  const { toast } = useToast();

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadCollection(
      JOURNAL_STORAGE_KEY,
      canonicalJournalEntries.map((entry) => ({ ...entry })),
    ),
  );
  const [foodExperiences, setFoodExperiences] = useState<FoodExperience[]>(() =>
    loadCollection(
      FOOD_STORAGE_KEY,
      canonicalFoodExperiences.map((experience) => ({ ...experience })),
    ),
  );
  const [bookRecommendations, setBookRecommendations] = useState<BookRecommendation[]>(() =>
    loadCollection(
      BOOK_STORAGE_KEY,
      canonicalReadingRecommendations.map((book) => ({ ...book })),
    ),
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { syncCollectionEntries, setStatus, getStatus } = usePublicationState();

  const canonicalJournalIds = useMemo(
    () => new Set(canonicalJournalEntries.map((entry) => entry.day.toString())),
    [],
  );
  const canonicalFoodIds = useMemo(
    () => new Set(canonicalFoodExperiences.map((experience) => experience.id)),
    [],
  );
  const canonicalBookIds = useMemo(
    () => new Set(canonicalReadingRecommendations.map((book) => book.id)),
    [],
  );

  useEffect(() => {
    syncCollectionEntries(
      "journal",
      journalEntries.map((entry) => entry.day.toString()),
      canonicalJournalIds,
    );
  }, [journalEntries, canonicalJournalIds, syncCollectionEntries]);

  useEffect(() => {
    syncCollectionEntries(
      "food",
      foodExperiences.map((experience) => experience.id),
      canonicalFoodIds,
    );
  }, [foodExperiences, canonicalFoodIds, syncCollectionEntries]);

  useEffect(() => {
    syncCollectionEntries(
      "books",
      bookRecommendations.map((book) => book.id),
      canonicalBookIds,
    );
  }, [bookRecommendations, canonicalBookIds, syncCollectionEntries]);

  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleJournalChange = useCallback((entries: JournalEntry[]) => {
    setJournalEntries(entries);
    markDirty();
  }, [markDirty]);

  const handleFoodChange = useCallback((experiences: FoodExperience[]) => {
    setFoodExperiences(experiences);
    markDirty();
  }, [markDirty]);

  const handleBookChange = useCallback((books: BookRecommendation[]) => {
    setBookRecommendations(books);
    markDirty();
  }, [markDirty]);

  const handleSave = useCallback(() => {
    if (!isBrowser) {
      toast({
        title: "Sauvegarde indisponible",
        description: "localStorage n'est pas accessible dans cet environnement.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const results: SaveCollectionResult[] = [
        saveCollection(JOURNAL_STORAGE_KEY, journalEntries),
        saveCollection(FOOD_STORAGE_KEY, foodExperiences),
        saveCollection(BOOK_STORAGE_KEY, bookRecommendations),
      ];

      const allSucceeded = results.every((result) => result.success);

      if (allSucceeded) {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        toast({
          title: "Sauvegarde réussie",
          description: "Vos contenus sont enregistrés dans ce navigateur.",
        });
        return;
      }

      const quotaExceeded = results.some((result) => result.quotaExceeded);
      const firstError = results.find((result) => result.error)?.error;

      toast({
        title: quotaExceeded ? "Quota de stockage atteint" : "Impossible d'enregistrer",
        description: quotaExceeded
          ? "Le navigateur n'a plus d'espace disponible. Exportez ou supprimez du contenu avant de réessayer."
          : firstError?.message ?? "Une erreur inattendue est survenue lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [bookRecommendations, foodExperiences, journalEntries, toast]);

  const handleExport = useCallback(() => {
    if (!isBrowser) {
      toast({
        title: "Export impossible",
        description: "localStorage n'est pas accessible dans cet environnement.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      downloadFile("journalEntries.ts", serializeJournalEntries(journalEntries));
      downloadFile("foodExperiences.ts", serializeFoodExperiences(foodExperiences));
      downloadFile("readingRecommendations.ts", serializeBookRecommendations(bookRecommendations));
      toast({
        title: "Export généré",
        description: "Les fichiers TypeScript ont été téléchargés.",
      });
    } catch (error) {
      const normalizedError = toError(error);
      toast({
        title: "Export interrompu",
        description: normalizedError.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [bookRecommendations, foodExperiences, journalEntries, toast]);

  const getJournalStatus = useCallback(
    (day: number): ContentStatus => {
      const id = day.toString();
      const defaultStatus: ContentStatus = canonicalJournalIds.has(id) ? "published" : "draft";
      return getStatus("journal", id, defaultStatus);
    },
    [canonicalJournalIds, getStatus],
  );

  const getFoodStatus = useCallback(
    (id: string): ContentStatus => {
      const defaultStatus: ContentStatus = canonicalFoodIds.has(id) ? "published" : "draft";
      return getStatus("food", id, defaultStatus);
    },
    [canonicalFoodIds, getStatus],
  );

  const getBookStatus = useCallback(
    (id: string): ContentStatus => {
      const defaultStatus: ContentStatus = canonicalBookIds.has(id) ? "published" : "draft";
      return getStatus("books", id, defaultStatus);
    },
    [canonicalBookIds, getStatus],
  );

  const handleJournalStatusChange = useCallback(
    (day: number, status: ContentStatus) => {
      const id = day.toString();
      setStatus("journal", id, status);

      const entry = journalEntries.find((item) => item.day === day);
      const description = entry ? `${entry.title} (Jour ${entry.day})` : `Jour ${day}`;

      toast({
        title: status === "published" ? "Entrée publiée" : "Entrée en brouillon",
        description,
      });
    },
    [journalEntries, setStatus, toast],
  );

  const handleFoodStatusChange = useCallback(
    (id: string, status: ContentStatus) => {
      setStatus("food", id, status);

      const experience = foodExperiences.find((item) => item.id === id);
      toast({
        title: status === "published" ? "Expérience publiée" : "Expérience en brouillon",
        description: experience ? experience.name : id,
      });
    },
    [foodExperiences, setStatus, toast],
  );

  const handleBookStatusChange = useCallback(
    (id: string, status: ContentStatus) => {
      setStatus("books", id, status);

      const book = bookRecommendations.find((item) => item.id === id);
      toast({
        title: status === "published" ? "Recommandation publiée" : "Recommandation en brouillon",
        description: book ? book.title : id,
      });
    },
    [bookRecommendations, setStatus, toast],
  );

  const journalDraftCount = useMemo(
    () =>
      journalEntries.reduce((count, entry) => (getJournalStatus(entry.day) === "draft" ? count + 1 : count), 0),
    [journalEntries, getJournalStatus],
  );

  const foodDraftCount = useMemo(
    () =>
      foodExperiences.reduce((count, experience) => (getFoodStatus(experience.id) === "draft" ? count + 1 : count), 0),
    [foodExperiences, getFoodStatus],
  );

  const bookDraftCount = useMemo(
    () =>
      bookRecommendations.reduce((count, book) => (getBookStatus(book.id) === "draft" ? count + 1 : count), 0),
    [bookRecommendations, getBookStatus],
  );

  const tabCounts = {
    journal: { total: journalEntries.length, drafts: journalDraftCount },
    food: { total: foodExperiences.length, drafts: foodDraftCount },
    books: { total: bookRecommendations.length, drafts: bookDraftCount },
  };

  const renderDraftBadge = useCallback((count: number) => {
    if (count === 0) {
      return null;
    }

    return (
      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
        {count} brouillon{count > 1 ? "s" : ""}
      </span>
    );
  }, []);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-8 text-center">
            <h1 className="mb-4 text-4xl font-bold">✏️ Éditeur de Contenu</h1>
            <p className="mb-6 text-muted-foreground">
              Créez et gérez le contenu de votre carnet de voyage
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleSave}
                variant="outline"
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? "⏳ Sauvegarde..." : "💾 Sauvegarder"}
              </Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? "Préparation..." : "📥 Exporter les fichiers"}
              </Button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-1 text-sm text-muted-foreground">
              {hasUnsavedChanges ? (
                <span className="flex items-center gap-2 text-amber-600">
                  <span aria-hidden>⚠️</span>
                  Modifications non sauvegardées
                </span>
              ) : (
                <span className="flex items-center gap-2 text-emerald-600">
                  <span aria-hidden>✅</span>
                  Toutes les modifications sont synchronisées
                </span>
              )}
              {lastSavedAt && (
                <span>
                  Dernière sauvegarde :
                  {" "}
                  {lastSavedAt.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>

          <Tabs defaultValue="journal" className="mx-auto max-w-4xl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="journal">
                <span className="flex items-center justify-center gap-2">
                  📖 Journal ({tabCounts.journal.total})
                  {renderDraftBadge(tabCounts.journal.drafts)}
                </span>
              </TabsTrigger>
              <TabsTrigger value="food">
                <span className="flex items-center justify-center gap-2">
                  🍽️ Gastronomie ({tabCounts.food.total})
                  {renderDraftBadge(tabCounts.food.drafts)}
                </span>
              </TabsTrigger>
              <TabsTrigger value="books">
                <span className="flex items-center justify-center gap-2">
                  📚 Lectures ({tabCounts.books.total})
                  {renderDraftBadge(tabCounts.books.drafts)}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="journal">
              <JournalSection
                entries={journalEntries}
                onChange={handleJournalChange}
                getStatus={getJournalStatus}
                onStatusChange={handleJournalStatusChange}
              />
            </TabsContent>

            <TabsContent value="food">
              <FoodSection
                experiences={foodExperiences}
                onChange={handleFoodChange}
                getStatus={getFoodStatus}
                onStatusChange={handleFoodStatusChange}
              />
            </TabsContent>

            <TabsContent value="books">
              <BookSection
                books={bookRecommendations}
                onChange={handleBookChange}
                getStatus={getBookStatus}
                onStatusChange={handleBookStatusChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default EditorPage;
