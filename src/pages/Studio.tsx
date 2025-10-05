
import { useMemo, useState, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EntryFormPanel } from "@/components/studio/EntryFormPanel";
import { JournalEntryList } from "@/components/studio/JournalEntryList";
import { FoodEditor } from "@/components/studio/FoodEditor";
import { ReadingEditor } from "@/components/studio/ReadingEditor";
import { MapEditor } from "@/components/studio/MapEditor";
import { MediaManager } from "@/components/studio/MediaManager";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { JournalEntry } from "@/lib/journalStorage";
import type { JournalEntryFormData } from "@/types/journal";
import { toPersistedJournalEntry } from "@/lib/journalMapper";
import { JournalDiagnostic } from "@/components/JournalDiagnostic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCw, NotebookPen, Map as MapIcon, UtensilsCrossed, BookOpen, Images, Activity } from "lucide-react";
import { toast } from "sonner";
import { foodExperiences as canonicalFoodExperiences } from "@/data/foodExperiences";
import { readingRecommendations as canonicalReadingRecommendations } from "@/data/readingRecommendations";
import { journalEntries as canonicalJournalEntries } from "@/data/journalEntries";
import type { FoodExperience, ReadingRecommendation } from "@/types/content";
import { usePublicationState } from "@/features/publishing/usePublicationState";
import { EDITOR_STORAGE_KEYS } from "@/features/editor/constants";
import { isBrowser, loadCollection, saveCollection } from "@/features/editor/storage";
import { logger } from "@/lib/logger";

const FOOD_STORAGE_KEY = EDITOR_STORAGE_KEYS.food;
const BOOK_STORAGE_KEY = EDITOR_STORAGE_KEYS.books;

const canonicalFoodIds = new Set(canonicalFoodExperiences.map((experience) => experience.id));
const canonicalBookIds = new Set(canonicalReadingRecommendations.map((book) => book.id));
const canonicalJournalIds = new Set(canonicalJournalEntries.map((entry) => entry.day.toString()));

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeFoodExperience = (value: FoodExperience): FoodExperience => ({
  id: value.id,
  name: value.name,
  type: value.type,
  description: value.description,
  experience: value.experience,
  rating: value.rating,
  location: value.location,
  price: value.price,
});

const sanitizeReadingRecommendation = (value: ReadingRecommendation): ReadingRecommendation => ({
  id: value.id,
  title: value.title,
  author: value.author,
  type: value.type,
  description: value.description,
  why: value.why,
  amazon: value.amazon,
  rating: value.rating,
});

const loadFoodExperiences = (): FoodExperience[] => {
  const fallback = canonicalFoodExperiences.map((experience) => ({ ...experience }));

  if (!isBrowser) {
    return fallback;
  }

  const stored = loadCollection<FoodExperience>(FOOD_STORAGE_KEY, []);
  if (stored.length === 0) {
    return fallback;
  }

  const overrides = new Map<string, FoodExperience>();
  const custom: FoodExperience[] = [];

  stored.forEach((experience) => {
    if (!experience || typeof experience.id !== "string") {
      return;
    }

    const sanitized = sanitizeFoodExperience({
      ...experience,
      id: experience.id,
      rating: Number.isFinite(experience.rating) ? experience.rating : 0,
    });

    if (canonicalFoodIds.has(sanitized.id)) {
      overrides.set(sanitized.id, sanitized);
    } else {
      custom.push(sanitized);
    }
  });

  const merged = canonicalFoodExperiences.map((experience) => {
    const override = overrides.get(experience.id);
    return override ? sanitizeFoodExperience(override) : { ...experience };
  });

  return [...merged, ...custom];
};

const loadReadingRecommendations = (): ReadingRecommendation[] => {
  const fallback = canonicalReadingRecommendations.map((book) => ({ ...book }));

  if (!isBrowser) {
    return fallback;
  }

  const stored = loadCollection<ReadingRecommendation>(BOOK_STORAGE_KEY, []);
  if (stored.length === 0) {
    return fallback;
  }

  const overrides = new Map<string, ReadingRecommendation>();
  const custom: ReadingRecommendation[] = [];

  stored.forEach((book) => {
    if (!book || typeof book.id !== "string") {
      return;
    }

    const sanitized = sanitizeReadingRecommendation({ ...book });

    if (canonicalBookIds.has(sanitized.id)) {
      overrides.set(sanitized.id, sanitized);
    } else {
      custom.push(sanitized);
    }
  });

  const merged = canonicalReadingRecommendations.map((book) => {
    const override = overrides.get(book.id);
    return override ? sanitizeReadingRecommendation(override) : { ...book };
  });

  return [...merged, ...custom];
};

const Studio = () => {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [foodExperiences, setFoodExperiences] = useState<FoodExperience[]>(() => loadFoodExperiences());
  const [readingList, setReadingList] = useState<ReadingRecommendation[]>(() => loadReadingRecommendations());

  const { allEntries, addEntry, editEntry, isLoading, error, reloadEntries } = useJournalEntries();
  const { syncCollectionEntries, setStatus, getStatus } = usePublicationState();

  const sortedEntries = useMemo(() => [...allEntries].sort((a, b) => a.day - b.day), [allEntries]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const result = saveCollection(FOOD_STORAGE_KEY, foodExperiences);
    if (!result.success && result.error) {
      logger.error("Impossible d'enregistrer les expériences culinaires", result.error);
      if (result.quotaExceeded) {
        toast.error("Quota localStorage atteint pour les expériences culinaires");
      }
    }
  }, [foodExperiences]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const result = saveCollection(BOOK_STORAGE_KEY, readingList);
    if (!result.success && result.error) {
      logger.error("Impossible d'enregistrer les recommandations de lecture", result.error);
      if (result.quotaExceeded) {
        toast.error("Quota localStorage atteint pour les recommandations de lecture");
      }
    }
  }, [readingList]);

  useEffect(() => {
    syncCollectionEntries(
      "journal",
      sortedEntries.map((entry) => entry.day.toString()),
      canonicalJournalIds,
    );
  }, [sortedEntries, syncCollectionEntries]);

  useEffect(() => {
    syncCollectionEntries(
      "food",
      foodExperiences.map((experience) => experience.id),
      canonicalFoodIds,
    );
  }, [foodExperiences, syncCollectionEntries]);

  useEffect(() => {
    syncCollectionEntries(
      "books",
      readingList.map((book) => book.id),
      canonicalBookIds,
    );
  }, [readingList, syncCollectionEntries]);

  const handleSelectEntry = useCallback((entry: JournalEntry) => {
    setMode("edit");
    setSelectedEntry(entry);
  }, []);

  const handleCreateNew = useCallback(() => {
    setMode("create");
    setSelectedEntry(null);
  }, []);

  const handleEntrySaved = useCallback((data: JournalEntryFormData) => {
    const entry = toPersistedJournalEntry(data);
    setSelectedEntry(entry);
    setMode("edit");
  }, []);

  const handleSubmitEntry = useCallback(async (data: JournalEntryFormData) => {
    if (mode === "edit" && selectedEntry) {
      const success = await editEntry(data, selectedEntry.day);
      if (success) {
        handleEntrySaved(data);
      }
      return success;
    }

    const success = await addEntry(data);
    if (success) {
      handleEntrySaved(data);
    }
    return success;
  }, [mode, selectedEntry, editEntry, addEntry, handleEntrySaved]);

  const handleFoodChange = useCallback((next: FoodExperience[]) => {
    setFoodExperiences(next);
  }, []);

  const handleReadingChange = useCallback((next: ReadingRecommendation[]) => {
    setReadingList(next);
  }, []);

  const getJournalStatus = useCallback(
    (day: number) => {
      const id = day.toString();
      const defaultStatus = canonicalJournalIds.has(id) ? "published" : "draft";
      return getStatus("journal", id, defaultStatus);
    },
    [getStatus],
  );

  const getFoodStatus = useCallback(
    (id: string) => {
      const defaultStatus = canonicalFoodIds.has(id) ? "published" : "draft";
      return getStatus("food", id, defaultStatus);
    },
    [getStatus],
  );

  const getBookStatus = useCallback(
    (id: string) => {
      const defaultStatus = canonicalBookIds.has(id) ? "published" : "draft";
      return getStatus("books", id, defaultStatus);
    },
    [getStatus],
  );

  const handleJournalStatusChange = useCallback(
    (day: number, status: "draft" | "published") => {
      const id = day.toString();
      setStatus("journal", id, status);
      const entry = sortedEntries.find((item) => item.day === day);
      const description = entry ? `${entry.title} (Jour ${entry.day})` : `Jour ${day}`;
      toast.success(status === "published" ? "Entrée publiée" : "Entrée mise en brouillon", {
        description,
      });
    },
    [setStatus, sortedEntries],
  );

  const handleFoodStatusChange = useCallback(
    (id: string, status: "draft" | "published") => {
      setStatus("food", id, status);
      const experience = foodExperiences.find((item) => item.id === id);
      toast.success(status === "published" ? "Expérience publiée" : "Expérience en brouillon", {
        description: experience ? experience.name : id,
      });
    },
    [foodExperiences, setStatus],
  );

  const handleBookStatusChange = useCallback(
    (id: string, status: "draft" | "published") => {
      setStatus("books", id, status);
      const book = readingList.find((item) => item.id === id);
      toast.success(status === "published" ? "Recommandation publiée" : "Recommandation en brouillon", {
        description: book ? book.title : id,
      });
    },
    [readingList, setStatus],
  );

  const journalDraftCount = useMemo(
    () => sortedEntries.reduce((count, entry) => (getJournalStatus(entry.day) === "draft" ? count + 1 : count), 0),
    [sortedEntries, getJournalStatus],
  );

  const foodDraftCount = useMemo(
    () => foodExperiences.reduce((count, experience) => (getFoodStatus(experience.id) === "draft" ? count + 1 : count), 0),
    [foodExperiences, getFoodStatus],
  );

  const readingDraftCount = useMemo(
    () => readingList.reduce((count, book) => (getBookStatus(book.id) === "draft" ? count + 1 : count), 0),
    [readingList, getBookStatus],
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-foreground pt-20">
        <div className="container mx-auto px-4 py-16 space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-playfair font-bold">Studio créateur</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pilotez vos contenus, ajustez vos récits et préparez vos publications privées depuis une interface dédiée.
            </p>
          </div>

          <Tabs defaultValue="journal" className="space-y-8">
            <TabsList className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="journal" className="flex items-center gap-2">
                <NotebookPen className="h-4 w-4" />
                Journal
                {journalDraftCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {journalDraftCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Carte
              </TabsTrigger>
              <TabsTrigger value="food" className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Gastronomie
                {foodDraftCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {foodDraftCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reading" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lectures
                {readingDraftCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                    {readingDraftCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Images className="h-4 w-4" />
                Médias
              </TabsTrigger>
              <TabsTrigger value="diagnostics" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Diagnostics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="journal" className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <JournalEntryList
                  entries={sortedEntries}
                  onSelect={handleSelectEntry}
                  onCreate={handleCreateNew}
                  selectedDay={selectedEntry?.day ?? null}
                  isLoading={isLoading}
                  getStatus={getJournalStatus}
                />
                <EntryFormPanel
                  mode={mode}
                  entry={selectedEntry}
                  onSubmit={handleSubmitEntry}
                  onCancel={handleCreateNew}
                  onSuccess={handleEntrySaved}
                  status={selectedEntry ? getJournalStatus(selectedEntry.day) : "draft"}
                  onStatusChange={selectedEntry ? (status) => handleJournalStatusChange(selectedEntry.day, status) : undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="map">
              <MapEditor />
            </TabsContent>

            <TabsContent value="food">
              <FoodEditor
                experiences={foodExperiences}
                onChange={handleFoodChange}
                getStatus={getFoodStatus}
                onStatusChange={handleFoodStatusChange}
                onGenerateId={generateId}
              />
            </TabsContent>

            <TabsContent value="reading">
              <ReadingEditor
                items={readingList}
                onChange={handleReadingChange}
                getStatus={getBookStatus}
                onStatusChange={handleBookStatusChange}
                onGenerateId={generateId}
              />
            </TabsContent>

            <TabsContent value="media">
              <MediaManager />
            </TabsContent>

            <TabsContent value="diagnostics" className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={reloadEntries} className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Recharger les entrées
                </Button>
                {isLoading && <span className="text-sm text-muted-foreground">Actualisation en cours...</span>}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Journal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Entrées</span>
                      <span className="font-semibold">{sortedEntries.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Brouillons</span>
                      <span className="font-semibold">{journalDraftCount}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Gastronomie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Expériences</span>
                      <span className="font-semibold">{foodExperiences.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Brouillons</span>
                      <span className="font-semibold">{foodDraftCount}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Lectures</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Ressources</span>
                      <span className="font-semibold">{readingList.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Brouillons</span>
                      <span className="font-semibold">{readingDraftCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <JournalDiagnostic />
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </>
  );
};

export default Studio;
