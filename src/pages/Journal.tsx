import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { CulturalNote } from "@/components/CulturalNote";
import { AddJournalEntryForm } from "@/components/AddJournalEntryForm";
import { JournalDiagnostic } from "@/components/JournalDiagnostic";
import DataRecovery from "@/components/DataRecovery";
import { Plus, Edit3, RefreshCw, Expand, Settings } from "lucide-react";
import { useState } from "react";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { JournalEntry } from "@/lib/journalStorage";

const Journal = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  
  const {
    allEntries,
    customEntries,
    isCustom,
    isLoading,
    error,
    addEntry,
    editEntry,
    getStats,
    reloadEntries 
  } = useJournalEntries();

  const handleAddEntry = async (formData: any) => {
    const success = await addEntry(formData);
    if (success) {
      setIsFormOpen(false);
    }
  };

  const handleEditEntry = async (formData: any) => {
    if (!editingEntry) return;
    
    const success = await editEntry(formData, editingEntry.day);
    if (success) {
      setEditingEntry(null);
      setIsFormOpen(false);
    }
  };

  const openEditDialog = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const closeDialog = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Chargement du journal...</p>
          </div>
        </div>
      </>
    );
  }

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
          {/* Debug Panel */}
          {error && (
            <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">⚠️ {error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={reloadEntries}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recharger les données
              </Button>
              <DataRecovery />
            </div>
          )}

          {/* Debug Info */}
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">📊 Statistiques Debug</h3>
              <Button 
                onClick={() => setShowDiagnostic(!showDiagnostic)}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {showDiagnostic ? 'Masquer' : 'Diagnostic'}
              </Button>
            </div>
            <div className="text-sm space-y-1">
              <p>Total affiché: {allEntries.length}</p>
              <p>Jours: {getStats().days.join(', ')}</p>
              <p>Version: {getStats().storageVersion}</p>
            </div>
          </div>

          {/* Diagnostic Panel */}
          {showDiagnostic && (
            <div className="max-w-4xl mx-auto mb-6">
              <JournalDiagnostic />
            </div>
          )}

          {/* Add Entry Button */}
          <div className="max-w-4xl mx-auto mb-8">
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
            
            <Dialog open={isFormOpen} onOpenChange={closeDialog}>
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
                        {isCustom(entry.day) && (
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
                  {entry.photos && entry.photos.length > 0 && isCustom(entry.day) && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3 text-lg">📸 Photos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {entry.photos.map((photo, index) => (
                          <div 
                            key={`${photo}-${index}`} 
                            className="relative rounded-lg overflow-hidden shadow-md cursor-pointer group hover:shadow-lg transition-all duration-300"
                            onClick={() => setFullscreenImage(photo)}
                          >
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                              <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
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
                ? `${allEntries.length} entrées au total (${customEntries.length} personnalisées) - Le voyage continue !`
                : "Plus d'entrées bientôt... Le voyage continue !"
              }
            </p>
          </div>
        </div>

        {/* Fullscreen Image Dialog */}
        <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
          <DialogContent className="max-w-screen-lg max-h-screen p-0 border-0">
            <div className="relative">
              {fullscreenImage && (
                <img 
                  src={fullscreenImage} 
                  alt="Photo en plein écran"
                  className="w-full h-auto max-h-[90vh] object-contain"
                />
              )}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 opacity-80 hover:opacity-100"
                onClick={() => setFullscreenImage(null)}
              >
                ✕
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Journal;