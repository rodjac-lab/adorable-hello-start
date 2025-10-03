import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { JournalEntry } from "@/data/journalEntries";
import { FoodExperience } from "@/data/foodExperiences";
import { BookRecommendation } from "@/data/readingRecommendations";

const Editor = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [foodExperiences, setFoodExperiences] = useState<FoodExperience[]>([]);
  const [bookRecommendations, setBookRecommendations] = useState<BookRecommendation[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedJournal = localStorage.getItem('jordan-journal-entries');
    const savedFood = localStorage.getItem('jordan-food-experiences');
    const savedBooks = localStorage.getItem('jordan-book-recommendations');

    if (savedJournal) setJournalEntries(JSON.parse(savedJournal));
    if (savedFood) setFoodExperiences(JSON.parse(savedFood));
    if (savedBooks) setBookRecommendations(JSON.parse(savedBooks));
  }, []);

  // Save data to localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('jordan-journal-entries', JSON.stringify(journalEntries));
    localStorage.setItem('jordan-food-experiences', JSON.stringify(foodExperiences));
    localStorage.setItem('jordan-book-recommendations', JSON.stringify(bookRecommendations));
  };

  // Export data as downloadable files
  const exportData = () => {
    const journalData = `export interface JournalEntry {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
}

export const journalEntries: JournalEntry[] = ${JSON.stringify(journalEntries, null, 2)};

export const getJournalEntries = () => journalEntries;
export const getJournalEntry = (day: number) => journalEntries.find(entry => entry.day === day);`;

    const foodData = `export interface FoodExperience {
  id: string;
  day: number;
  dish: string;
  location: string;
  description: string;
  rating: number;
  cultural_note?: string;
}

export const foodExperiences: FoodExperience[] = ${JSON.stringify(foodExperiences, null, 2)};

export const getFoodExperiences = () => foodExperiences;`;

    const bookData = `export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  why_recommend: string;
  amazon_link?: string;
}

export const readingRecommendations: BookRecommendation[] = ${JSON.stringify(bookRecommendations, null, 2)};

export const getReadingRecommendations = () => readingRecommendations;`;

    // Create downloadable files
    downloadFile('journalEntries.ts', journalData);
    downloadFile('foodExperiences.ts', foodData);
    downloadFile('readingRecommendations.ts', bookData);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">✏️ Éditeur de Contenu</h1>
            <p className="text-muted-foreground mb-6">
              Créez et gérez le contenu de votre carnet de voyage
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={saveToLocalStorage} variant="outline">
                💾 Sauvegarder
              </Button>
              <Button onClick={exportData}>
                📥 Exporter les fichiers
              </Button>
            </div>
          </div>

          <Tabs defaultValue="journal" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="journal">📖 Journal ({journalEntries.length})</TabsTrigger>
              <TabsTrigger value="food">🍽️ Gastronomie ({foodExperiences.length})</TabsTrigger>
              <TabsTrigger value="books">📚 Lectures ({bookRecommendations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="journal">
              <JournalEditor
                entries={journalEntries}
                setEntries={setJournalEntries}
              />
            </TabsContent>

            <TabsContent value="food">
              <FoodEditor
                experiences={foodExperiences}
                setExperiences={setFoodExperiences}
              />
            </TabsContent>

            <TabsContent value="books">
              <BookEditor
                books={bookRecommendations}
                setBooks={setBookRecommendations}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

// Journal Editor Component
const JournalEditor = ({ entries, setEntries }: {
  entries: JournalEntry[];
  setEntries: (entries: JournalEntry[]) => void;
}) => {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<JournalEntry>>({});

  // Memoize sorted entries to avoid O(n²) on every render
  const sortedEntries = useMemo(() =>
    [...entries].sort((a, b) => a.day - b.day),
    [entries]
  );

  const startEdit = (day?: number) => {
    if (day) {
      const entry = entries.find(e => e.day === day);
      setFormData(entry || {});
      setEditingDay(day);
    } else {
      const nextDay = Math.max(...entries.map(e => e.day), 0) + 1;
      setFormData({ day: nextDay, date: '', title: '', location: '', story: '', mood: '' });
      setEditingDay(nextDay);
    }
  };

  const saveEntry = () => {
    if (!formData.day) return;

    const newEntries = entries.filter(e => e.day !== formData.day);
    newEntries.push(formData as JournalEntry);
    newEntries.sort((a, b) => a.day - b.day);

    setEntries(newEntries);
    setEditingDay(null);
    setFormData({});
  };

  const deleteEntry = (day: number) => {
    setEntries(entries.filter(e => e.day !== day));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Entrées du journal</h2>
        <Button onClick={() => startEdit()}>
          ➕ Ajouter un jour
        </Button>
      </div>

      {editingDay && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>
              {editingDay <= Math.max(...entries.map(e => e.day), 0) ? 'Modifier' : 'Ajouter'} - Jour {editingDay}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Jour</label>
                <Input
                  type="number"
                  value={formData.day || ''}
                  onChange={(e) => setFormData({...formData, day: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date</label>
                <Input
                  value={formData.date || ''}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  placeholder="15 janvier 2024"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Arrivée à Amman"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Lieu</label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Amman"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Humeur</label>
                <Input
                  value={formData.mood || ''}
                  onChange={(e) => setFormData({...formData, mood: e.target.value})}
                  placeholder="Excité"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Histoire</label>
              <Textarea
                rows={6}
                value={formData.story || ''}
                onChange={(e) => setFormData({...formData, story: e.target.value})}
                placeholder="Racontez votre journée..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveEntry}>💾 Sauvegarder</Button>
              <Button variant="outline" onClick={() => setEditingDay(null)}>
                ❌ Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {sortedEntries.map((entry) => (
          <Card key={entry.day}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline">Jour {entry.day}</Badge>
                  <CardTitle className="mt-2">{entry.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{entry.date} • {entry.location}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(entry.day)}>
                    ✏️ Modifier
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteEntry(entry.day)}>
                    🗑️
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-3">{entry.story}</p>
              <Badge variant="secondary" className="mt-2">{entry.mood}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Food Editor Component
const FoodEditor = ({ experiences, setExperiences }: {
  experiences: FoodExperience[];
  setExperiences: (experiences: FoodExperience[]) => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<FoodExperience>>({});

  // Memoize sorted experiences to avoid O(n²) on every render
  const sortedExperiences = useMemo(() =>
    [...experiences].sort((a, b) => a.day - b.day),
    [experiences]
  );

  const startEdit = (id?: string) => {
    if (id) {
      const exp = experiences.find(e => e.id === id);
      setFormData(exp || {});
      setEditing(id);
    } else {
      const newId = Date.now().toString();
      setFormData({ id: newId, day: 1, dish: '', location: '', description: '', rating: 5 });
      setEditing(newId);
    }
  };

  const saveExperience = () => {
    if (!formData.id) return;

    const newExperiences = experiences.filter(e => e.id !== formData.id);
    newExperiences.push(formData as FoodExperience);
    newExperiences.sort((a, b) => a.day - b.day);

    setExperiences(newExperiences);
    setEditing(null);
    setFormData({});
  };

  const deleteExperience = (id: string) => {
    setExperiences(experiences.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expériences culinaires</h2>
        <Button onClick={() => startEdit()}>
          ➕ Ajouter une expérience
        </Button>
      </div>

      {editing && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Expérience culinaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Jour</label>
                <Input
                  type="number"
                  value={formData.day || ''}
                  onChange={(e) => setFormData({...formData, day: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Note (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.rating || ''}
                  onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Plat</label>
              <Input
                value={formData.dish || ''}
                onChange={(e) => setFormData({...formData, dish: e.target.value})}
                placeholder="Mansaf"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Lieu</label>
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Restaurant traditionnel, Amman"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Décrivez le plat et votre expérience..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Note culturelle (optionnel)</label>
              <Textarea
                rows={3}
                value={formData.cultural_note || ''}
                onChange={(e) => setFormData({...formData, cultural_note: e.target.value})}
                placeholder="Informations culturelles sur ce plat..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveExperience}>💾 Sauvegarder</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                ❌ Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {sortedExperiences.map((exp) => (
          <Card key={exp.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline">Jour {exp.day}</Badge>
                  <CardTitle className="mt-2">{exp.dish}</CardTitle>
                  <p className="text-sm text-muted-foreground">{exp.location}</p>
                  <div className="mt-1">{"⭐".repeat(exp.rating)}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(exp.id)}>
                    ✏️ Modifier
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteExperience(exp.id)}>
                    🗑️
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-2">{exp.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Book Editor Component
const BookEditor = ({ books, setBooks }: {
  books: BookRecommendation[];
  setBooks: (books: BookRecommendation[]) => void;
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BookRecommendation>>({});

  const startEdit = (id?: string) => {
    if (id) {
      const book = books.find(b => b.id === id);
      setFormData(book || {});
      setEditing(id);
    } else {
      const newId = Date.now().toString();
      setFormData({ id: newId, title: '', author: '', description: '', category: '', why_recommend: '' });
      setEditing(newId);
    }
  };

  const saveBook = () => {
    if (!formData.id) return;

    const newBooks = books.filter(b => b.id !== formData.id);
    newBooks.push(formData as BookRecommendation);

    setBooks(newBooks);
    setEditing(null);
    setFormData({});
  };

  const deleteBook = (id: string) => {
    setBooks(books.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommandations de lecture</h2>
        <Button onClick={() => startEdit()}>
          ➕ Ajouter un livre
        </Button>
      </div>

      {editing && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Recommandation de lecture</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Lawrence d'Arabie"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Auteur</label>
                <Input
                  value={formData.author || ''}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  placeholder="T.E. Lawrence"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Catégorie</label>
              <Input
                value={formData.category || ''}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Histoire"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description du livre..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Pourquoi je le recommande</label>
              <Textarea
                rows={3}
                value={formData.why_recommend || ''}
                onChange={(e) => setFormData({...formData, why_recommend: e.target.value})}
                placeholder="Expliquez pourquoi vous recommandez ce livre..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Lien Amazon (optionnel)</label>
              <Input
                value={formData.amazon_link || ''}
                onChange={(e) => setFormData({...formData, amazon_link: e.target.value})}
                placeholder="https://amazon.com/..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveBook}>💾 Sauvegarder</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                ❌ Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {books.map((book) => (
          <Card key={book.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline">{book.category}</Badge>
                  <CardTitle className="mt-2">{book.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">par {book.author}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(book.id)}>
                    ✏️ Modifier
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteBook(book.id)}>
                    🗑️
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-2">{book.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Editor;