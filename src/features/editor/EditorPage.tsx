import { useCallback, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JournalEntry } from "@/data/journalEntries";
import { journalEntries as canonicalJournalEntries } from "@/data/journalEntries";
import type { FoodExperience } from "@/data/foodExperiences";
import { foodExperiences as canonicalFoodExperiences } from "@/data/foodExperiences";
import type { BookRecommendation } from "@/data/readingRecommendations";
import { readingRecommendations as canonicalReadingRecommendations } from "@/data/readingRecommendations";
import { JournalSection } from "./components/JournalSection";
import { FoodSection } from "./components/FoodSection";
import { BookSection } from "./components/BookSection";

const JOURNAL_STORAGE_KEY = "jordan-journal-entries";
const FOOD_STORAGE_KEY = "jordan-food-experiences";
const BOOK_STORAGE_KEY = "jordan-book-recommendations";

const isBrowser = typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const loadCollection = <T,>(key: string, fallback: T[]): T[] => {
  if (!isBrowser) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch (error) {
    console.warn(`Impossible de lire ${key} depuis le localStorage`, error);
    return fallback;
  }
};

const saveCollection = <T,>(key: string, value: T[]): void => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde de ${key} dans le localStorage`, error);
  }
};

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
  day: number;
  dish: string;
  location: string;
  description: string;
  rating: number;
  cultural_note?: string;
}

export const foodExperiences: FoodExperience[] = ${JSON.stringify(experiences, null, 2)};

export const getFoodExperiences = () => foodExperiences;
`;

const serializeBookRecommendations = (books: BookRecommendation[]): string => `export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  why_recommend: string;
  amazon_link?: string;
}

export const readingRecommendations: BookRecommendation[] = ${JSON.stringify(books, null, 2)};

export const getReadingRecommendations = () => readingRecommendations;
`;

const EditorPage = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() =>
    loadCollection(JOURNAL_STORAGE_KEY, canonicalJournalEntries),
  );
  const [foodExperiences, setFoodExperiences] = useState<FoodExperience[]>(() =>
    loadCollection(FOOD_STORAGE_KEY, canonicalFoodExperiences),
  );
  const [bookRecommendations, setBookRecommendations] = useState<BookRecommendation[]>(() =>
    loadCollection(BOOK_STORAGE_KEY, canonicalReadingRecommendations),
  );

  const handleSave = useCallback(() => {
    saveCollection(JOURNAL_STORAGE_KEY, journalEntries);
    saveCollection(FOOD_STORAGE_KEY, foodExperiences);
    saveCollection(BOOK_STORAGE_KEY, bookRecommendations);
  }, [bookRecommendations, foodExperiences, journalEntries]);

  const handleExport = useCallback(() => {
    downloadFile("journalEntries.ts", serializeJournalEntries(journalEntries));
    downloadFile("foodExperiences.ts", serializeFoodExperiences(foodExperiences));
    downloadFile("readingRecommendations.ts", serializeBookRecommendations(bookRecommendations));
  }, [bookRecommendations, foodExperiences, journalEntries]);

  const tabCounts = {
    journal: journalEntries.length,
    food: foodExperiences.length,
    books: bookRecommendations.length,
  };

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
              <Button onClick={handleSave} variant="outline">
                💾 Sauvegarder
              </Button>
              <Button onClick={handleExport}>📥 Exporter les fichiers</Button>
            </div>
          </div>

          <Tabs defaultValue="journal" className="mx-auto max-w-4xl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="journal">📖 Journal ({tabCounts.journal})</TabsTrigger>
              <TabsTrigger value="food">🍽️ Gastronomie ({tabCounts.food})</TabsTrigger>
              <TabsTrigger value="books">📚 Lectures ({tabCounts.books})</TabsTrigger>
            </TabsList>

            <TabsContent value="journal">
              <JournalSection entries={journalEntries} onChange={setJournalEntries} />
            </TabsContent>

            <TabsContent value="food">
              <FoodSection experiences={foodExperiences} onChange={setFoodExperiences} />
            </TabsContent>

            <TabsContent value="books">
              <BookSection books={bookRecommendations} onChange={setBookRecommendations} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default EditorPage;
