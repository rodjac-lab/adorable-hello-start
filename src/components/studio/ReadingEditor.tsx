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

interface BookRecommendation {
  title: string;
  author: string;
  type: string;
  description: string;
  why: string;
  amazon: string;
  rating: number;
}

const STORAGE_KEY = "studio_reading_items";

const defaultBooks: BookRecommendation[] = [
  {
    title: "Lawrence d'Arabie",
    author: "T.E. Lawrence",
    type: "Autobiographie",
    description: "Le récit captivant de l'officier britannique qui a vécu la révolte arabe de 1916-1918. Une plongée dans l'histoire du Moyen-Orient moderne.",
    why: "Indispensable pour comprendre l'histoire moderne de la région et l'émergence de la Jordanie moderne sous l'émir Abdullah.",
    amazon: "https://amazon.fr/...",
    rating: 5,
  },
  {
    title: "Pétra : Merveille du monde",
    author: "Jane Taylor",
    type: "Guide culturel",
    description: "Guide complet sur l'histoire, l'archéologie et l'art nabatéen de Pétra. Avec de magnifiques photographies et plans détaillés.",
    why: "Le guide de référence pour comprendre l'ingéniosité nabatéenne et l'importance historique du site.",
    amazon: "https://amazon.fr/...",
    rating: 4,
  },
  {
    title: "Les Bédouins de Jordanie",
    author: "Shelagh Weir",
    type: "Anthropologie",
    description: "Étude approfondie de la culture bédouine traditionnelle, ses traditions, son artisanat et son mode de vie.",
    why: "Pour découvrir l'âme nomade de la Jordanie et comprendre l'hospitalité légendaire de ses habitants.",
    amazon: "https://amazon.fr/...",
    rating: 4,
  },
  {
    title: "Cuisine du Moyen-Orient",
    author: "Claudia Roden",
    type: "Gastronomie",
    description: "Bible de la cuisine moyen-orientale avec des recettes authentiques jordaniennes, palestiniennes et syriennes.",
    why: "Pour reproduire chez soi les saveurs découvertes et prolonger le voyage culinaire.",
    amazon: "https://amazon.fr/...",
    rating: 5,
  },
  {
    title: "Jordan: A Timeless Land",
    author: "Mohamed El-Khoury",
    type: "Beau livre",
    description: "Superbe livre photographique qui capture la beauté des paysages jordaniens, de Pétra au Wadi Rum.",
    why: "Pour revivre visuellement la magie des paysages jordaniens et partager la beauté du pays.",
    amazon: "https://amazon.fr/...",
    rating: 4,
  },
  {
    title: "Le Royaume hachémite de Jordanie",
    author: "Philippe Droz-Vincent",
    type: "Géopolitique",
    description: "Analyse politique et sociale de la Jordanie contemporaine, son rôle régional et ses défis.",
    why: "Pour comprendre les enjeux actuels du royaume et son importance stratégique au Moyen-Orient.",
    amazon: "https://amazon.fr/...",
    rating: 4,
  },
];

const loadBooks = (): BookRecommendation[] => {
  if (typeof window === "undefined") {
    return defaultBooks;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return defaultBooks;
    }
    const parsed = JSON.parse(stored) as BookRecommendation[];
    if (!Array.isArray(parsed)) {
      return defaultBooks;
    }
    return parsed;
  } catch (error) {
    console.warn("Impossible de charger les recommandations de lecture", error);
    return defaultBooks;
  }
};

const blankBook: BookRecommendation = {
  title: "Nouvelle recommandation",
  author: "Auteur à définir",
  type: "Essai",
  description: "",
  why: "",
  amazon: "",
  rating: 4,
};

export const ReadingEditor = () => {
  const [books, setBooks] = useState<BookRecommendation[]>(() => loadBooks());
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    if (selectedIndex >= books.length) {
      setSelectedIndex(Math.max(0, books.length - 1));
    }
  }, [books.length, selectedIndex]);

  const selectedBook = useMemo(() => books[selectedIndex], [books, selectedIndex]);

  const updateSelected = <Key extends keyof BookRecommendation>(field: Key, value: BookRecommendation[Key]) => {
    setBooks((prev) =>
      prev.map((book, index) =>
        index === selectedIndex ? { ...book, [field]: value } : book
      )
    );
  };

  const addBook = () => {
    setBooks((prev) => [...prev, { ...blankBook }]);
    setSelectedIndex(books.length);
  };

  const removeBook = () => {
    setBooks((prev) => prev.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl">Lectures</CardTitle>
        <CardDescription>
          Préparez vos recommandations de livres, podcasts ou ressources.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <Button onClick={addBook} className="w-full flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une ressource
          </Button>
          <ScrollArea className="h-[480px] pr-2">
            <div className="space-y-2">
              {books.map((book, index) => (
                <button
                  type="button"
                  key={`${book.title}-${index}`}
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "w-full rounded-md border px-4 py-3 text-left transition-colors",
                    index === selectedIndex
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{book.title || `Ressource ${index + 1}`}</span>
                    <Badge variant="outline">{book.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {selectedBook ? (
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Détails de la ressource</h3>
              <Button
                variant="destructive"
                size="icon"
                onClick={removeBook}
                disabled={books.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={selectedBook.title}
                  onChange={(event) => updateSelected("title", event.target.value)}
                  placeholder="Titre du livre ou de la ressource"
                />
              </div>

              <div className="space-y-2">
                <Label>Auteur</Label>
                <Input
                  value={selectedBook.author}
                  onChange={(event) => updateSelected("author", event.target.value)}
                  placeholder="Auteur ou créateur"
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={selectedBook.type}
                  onChange={(event) => updateSelected("type", event.target.value)}
                  placeholder="Autobiographie, guide..."
                />
              </div>

              <div className="space-y-2">
                <Label>Note (1-5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={selectedBook.rating}
                  onChange={(event) => updateSelected("rating", Number(event.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={selectedBook.description}
                onChange={(event) => updateSelected("description", event.target.value)}
                placeholder="Pourquoi cette ressource est pertinente"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Pourquoi la recommander ?</Label>
              <Textarea
                value={selectedBook.why}
                onChange={(event) => updateSelected("why", event.target.value)}
                placeholder="Votre justification personnelle"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Lien</Label>
              <Input
                value={selectedBook.amazon}
                onChange={(event) => updateSelected("amazon", event.target.value)}
                placeholder="URL vers l'achat ou la ressource"
              />
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Sélectionnez une ressource à modifier ou créez-en une nouvelle.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
