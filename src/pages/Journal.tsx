import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { CulturalNote } from "@/components/CulturalNote";
import { AddJournalEntryForm } from "@/components/AddJournalEntryForm";
import { Plus, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";

type JournalEntry = {
  day: number;
  date: string;
  title: string;
  location: string;
  story: string;
  mood: string;
  photos?: string[];
  link?: string;
};

const Journal = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customEntries, setCustomEntries] = useState<JournalEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Load custom entries from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('journalEntries');
    if (saved) {
      try {
        setCustomEntries(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved entries:', error);
      }
    }
  }, []);

  // Save custom entries to localStorage
  const saveToLocalStorage = (entries: JournalEntry[]) => {
    localStorage.setItem('journalEntries', JSON.stringify(entries));
  };

  const defaultEntries: JournalEntry[] = [
    { 
      day: 1, 
      date: "15 mars 2024",
      title: "Arrivée à Amman",
      location: "Amman, Jordanie",
      story: "Départ de Lyon le 30/07, direction Paris CDG en train. Le trajet en Ouigo s'est avéré décevant : inconfort, mal de dos… Heureusement, à l'aéroport CDG, les choses s'enchaînent facilement : pas de bagage à enregistrer, embarquement rapide. Les places en rang 11 offrent un bon confort pour les jambes, mais le dos continue de protester.\n\nÀ l'arrivée à l'aéroport Queen Alia d'Amman, un contact de l'agence nous prend en charge. Les formalités sont rapides. Achat de carte SIM, puis trajet de 45 minutes jusqu'à l'hôtel. La chaleur est bien là. Le chauffeur est bavard et parle un peu français. Une fois à l'hôtel : installation et dodo.",
      mood: "Enthousiaste",
      photos: ["amman-theater.jpg", "citadel-view.jpg"]
    },
    {
      day: 2,
      date: "16 mars 2024", 
      title: "Jerash, Ajlun et spa à Amman",
      location: "Jerash, Ajlun, Amman",
      story: "Mal dormi, toujours ce mal de dos. Petit déjeuner très correct à l'hôtel, puis réception de la voiture de location. Grosse déception : au lieu du SUV attendu, on se retrouve avec une Nissan Kicks. « Yes, this is mini SUV sir ». Mouais… On compte faire une réclamation.\n\nDirection Jerash. Les ruines romaines sont splendides. Le site est immense, bien conservé. On y ressent l'empreinte d'un passé glorieux. Une balade impressionnante à travers les siècles.\n\nDéjeuner sur place : assiette mixte grill avec agneau, bœuf et poulet, hummus, taboulé. Tout est délicieux, les saveurs locales s'imposent dès ce premier vrai repas.\n\nDans un coin discret du restaurant, cette salle était réservée à la préparation des chichas. Alignées comme des soldats prêts à servir, elles attendaient les amateurs de fumée parfumée. Nous avons décliné l'invitation cette fois-ci. Peut-être une autre fois.\n\nL'après-midi, visite du château de Ajlun. Intéressant mais très fréquenté, un peu trop. Retour à Amman pour une séance spa à l'hôtel : hammam, sauna, gommage, massage… Une belle pause bien méritée.\n\nLe soir, dîner chez Ghaith, petit restaurant familial du quartier, à distance de marche. Très bon, ambiance simple et conviviale.",
      mood: "Mitigé",
      photos: ["jerash-columns.jpg", "ajlun-castle.jpg"],
      link: "https://maps.app.goo.gl/XHDM6vpRh1KCrQbB6"
    }
  ];

  // Combine default and custom entries, prioritizing custom ones for same day, sort by day
  const mergeEntries = () => {
    const merged: JournalEntry[] = [];
    const customDays = new Set(customEntries.map(entry => entry.day));
    
    // Add all custom entries first
    merged.push(...customEntries);
    
    // Add default entries only if no custom entry exists for that day
    defaultEntries.forEach(defaultEntry => {
      if (!customDays.has(defaultEntry.day)) {
        merged.push(defaultEntry);
      }
    });
    
    return merged.sort((a, b) => a.day - b.day);
  };
  
  const allEntries = mergeEntries();

  const handleAddEntry = (formData: any) => {
    const newEntry: JournalEntry = {
      day: formData.day,
      date: formData.date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      title: formData.title,
      location: formData.location,
      story: formData.story,
      mood: formData.mood,
      photos: formData.photos || [],
      link: formData.link || undefined,
    };

    const updatedEntries = [...customEntries, newEntry];
    setCustomEntries(updatedEntries);
    saveToLocalStorage(updatedEntries);
    setIsFormOpen(false);
  };

  const handleEditEntry = (formData: any) => {
    const updatedEntry: JournalEntry = {
      day: formData.day,
      date: formData.date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      title: formData.title,
      location: formData.location,
      story: formData.story,
      mood: formData.mood,
      photos: formData.photos || [],
      link: formData.link || undefined,
    };

    // Check if editing an existing custom entry or creating a new one from default
    const existingCustomIndex = customEntries.findIndex(entry => entry.day === editingEntry!.day);
    let updatedEntries: JournalEntry[];
    
    if (existingCustomIndex >= 0) {
      // Update existing custom entry
      updatedEntries = [...customEntries];
      updatedEntries[existingCustomIndex] = updatedEntry;
    } else {
      // Create new custom entry (was originally a default entry)
      updatedEntries = [...customEntries, updatedEntry];
    }

    setCustomEntries(updatedEntries);
    saveToLocalStorage(updatedEntries);
    setEditingEntry(null);
    setIsFormOpen(false);
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">
              Journal de voyage
            </h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Récit au jour le jour de mon aventure jordanienne, entre découvertes, rencontres et émotions
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Add Entry Button */}
          <div className="max-w-4xl mx-auto mb-8">
            <Dialog open={isFormOpen} onOpenChange={closeDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto mx-auto flex items-center gap-2 text-lg py-6 px-8 shadow-elegant hover:shadow-premium transition-all duration-300"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="w-5 h-5" />
                  Ajouter une nouvelle entrée
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">
                    {editingEntry ? "Modifier l'entrée de journal" : "Nouvelle entrée de journal"}
                  </DialogTitle>
                </DialogHeader>
                {isFormOpen && (
                  <AddJournalEntryForm 
                    key={editingEntry?.day || 'new'}
                    onSubmit={editingEntry ? handleEditEntry : handleAddEntry}
                    onCancel={closeDialog}
                    editEntry={editingEntry || undefined}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {allEntries.map((entry) => (
              <Card key={entry.day} className="shadow-elegant hover:shadow-premium transition-all duration-300 border-0 bg-gradient-to-br from-card via-card/95 to-card/90">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="font-serif text-3xl mb-3 text-foreground tracking-wide">
                        Jour {entry.day} — {entry.title}
                        {customEntries.some(custom => custom.day === entry.day) && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-normal">
                            Modifié
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-lg text-muted-foreground font-light">
                        {entry.date} • {entry.location}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(entry)}
                        className="p-2 h-auto text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Badge variant="secondary" className="px-3 py-1 font-light tracking-wide">
                        {entry.mood}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-foreground/90 leading-relaxed whitespace-pre-line font-light text-base tracking-wide">
                        {entry.story}
                      </p>
                    </div>
                  </div>
                  
                  {/* Photo du jour 1 - Embarquement */}
                  {entry.day === 1 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3 text-lg">📸 Photo du jour</h4>
                      <div className="rounded-lg overflow-hidden shadow-md">
                        <div className="overflow-hidden">
                          <img 
                            src="/lovable-uploads/ab7525ee-de5e-4ec5-bd8a-474c543dff10.png" 
                            alt="Salle d'embarquement Paris CDG - Porte C85, Royal Jordanian vers Amman"
                            className="w-full h-auto"
                          />
                        </div>
                        <div className="p-3 bg-muted/50">
                          <p className="text-sm text-muted-foreground text-center">
                            Embarquement pour Amman – Porte C85, Royal Jordanian
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Cultural Note for Queen Alia Airport */}
                  {entry.day === 1 && (
                    <CulturalNote 
                      title="Infos pratiques • Aéroport Queen Alia" 
                      icon="✈️"
                    >
                      <p>
                        L'<strong>aéroport international Queen Alia</strong> (AMM) a été inauguré en <strong>1983</strong> et rénové en profondeur avec un nouveau terminal en <strong>2013</strong>. 
                        Il accueille environ <strong>9 millions de passagers</strong> par an et constitue le hub principal de Royal Jordanian Airlines.
                      </p>
                      <p className="mt-3">
                        L'aéroport porte le nom de la <strong>Reine Alia Al-Hussein</strong> (1948-1977), troisième épouse du roi Hussein de Jordanie. 
                        D'origine palestinienne, elle était très engagée dans les causes humanitaires et particulièrement appréciée du peuple jordanien avant sa mort tragique dans un accident d'hélicoptère.
                      </p>
                    </CulturalNote>
                  )}
                  
                  {/* Photos for custom entries */}
                  {entry.photos && entry.photos.length > 0 && !defaultEntries.some(defaultEntry => defaultEntry.day === entry.day) && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3 text-lg">📸 Photos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entry.photos.map((photo, index) => (
                          <div key={`${photo}-${index}`} className="rounded-lg overflow-hidden shadow-md">
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cultural Note for Jerash */}
                  {entry.day === 2 && (
                    <CulturalNote 
                      title="Note historique • Jerash" 
                      icon="📜"
                    >
                      <p>
                        Fondée sous le nom d'<em>Antioch sur Chrysorrhoas</em>, Jerash s'est développée à l'époque gréco-romaine. 
                        Elle faisait partie de la <strong>Décapole</strong>, un groupe de dix villes romaines d'Orient. 
                        Au <strong>IIᵉ siècle</strong>, Jerash connaît son apogée avec temples, théâtres, colonnades et hippodrome. 
                        Elle est partiellement détruite par un tremblement de terre au <strong>VIIIᵉ siècle</strong>, puis abandonnée.
                      </p>
                    </CulturalNote>
                  )}

                  {/* Generic link for any entry */}
                  {entry.link && (
                    <div className="mt-4">
                      <a 
                        href={entry.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-premium-accent hover:text-premium-foreground transition-colors duration-200 text-sm font-light"
                      >
                        🔗 {entry.day === 2 ? "Voir le restaurant Ghaith sur Google Maps" : "Voir le lien"}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              {customEntries.length > 0 
                ? `${allEntries.length} entrées au total - Le voyage continue !`
                : "Plus d'entrées bientôt... Le voyage continue !"
              }
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Journal;