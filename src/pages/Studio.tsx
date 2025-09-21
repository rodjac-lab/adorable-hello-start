
import { useMemo, useState } from "react";
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
import { JournalEntryFormData } from "@/components/AddJournalEntryForm";
import { JournalDiagnostic } from "@/components/JournalDiagnostic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw, NotebookPen, Map as MapIcon, UtensilsCrossed, BookOpen, Images, Activity } from "lucide-react";

const formatFormDataToEntry = (data: JournalEntryFormData): JournalEntry => ({
  day: data.day,
  date: data.date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
  title: data.title,
  location: data.location,
  story: data.story,
  mood: data.mood,
  photos: data.photos || [],
  link: data.link || undefined,
});

const Studio = () => {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const { allEntries, addEntry, editEntry, isLoading, error, reloadEntries } = useJournalEntries();

  const sortedEntries = useMemo(() => [...allEntries].sort((a, b) => a.day - b.day), [allEntries]);

  const handleSelectEntry = (entry: JournalEntry) => {
    setMode("edit");
    setSelectedEntry(entry);
  };

  const handleCreateNew = () => {
    setMode("create");
    setSelectedEntry(null);
  };

  const handleEntrySaved = (data: JournalEntryFormData) => {
    const entry = formatFormDataToEntry(data);
    setSelectedEntry(entry);
    setMode("edit");
  };

  const handleSubmitEntry = async (data: JournalEntryFormData) => {
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
  };

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
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Carte
              </TabsTrigger>
              <TabsTrigger value="food" className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Gastronomie
              </TabsTrigger>
              <TabsTrigger value="reading" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lectures
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
                />
                <EntryFormPanel
                  mode={mode}
                  entry={selectedEntry}
                  onSubmit={handleSubmitEntry}
                  onCancel={handleCreateNew}
                  onSuccess={handleEntrySaved}
                />
              </div>
            </TabsContent>

            <TabsContent value="map">
              <MapEditor />
            </TabsContent>

            <TabsContent value="food">
              <FoodEditor />
            </TabsContent>

            <TabsContent value="reading">
              <ReadingEditor />
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
              <JournalDiagnostic />
 main
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </>
 main
  );
};

export default Studio;
