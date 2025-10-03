import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { getJournalEntries, JournalEntry } from "@/data/journalEntries";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

const Journal = () => {
  const entries = getJournalEntries();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">Journal de Voyage</h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              14 jours à travers la Jordanie, entre histoire millénaire et hospitalité légendaire
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 max-w-4xl mx-auto">
            {entries.map((entry) => (
              <JournalEntryCard key={entry.day} entry={entry} />
            ))}
          </div>

          {/* Cultural Note */}
          <Card className="mt-16 max-w-4xl mx-auto shadow-lg border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-xl text-primary">🌟 Réflexions sur ce voyage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                La Jordanie m'a marqué par la richesse de son patrimoine et la générosité de ses habitants.
                Chaque jour a été une découverte, entre sites archéologiques exceptionnels et rencontres
                humaines authentiques. Un voyage qui change la perspective sur cette région fascinante du monde.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

const JournalEntryCard = ({ entry }: { entry: JournalEntry }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");

  const openLightbox = (photo: string) => {
    setSelectedPhoto(photo);
    setLightboxOpen(true);
  };

  const hasPhotos = entry.photos && entry.photos.length > 0;

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Jour {entry.day}
              </Badge>
              <span className="text-sm text-muted-foreground">{entry.date}</span>
            </div>
            <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
              {entry.mood}
            </Badge>
          </div>
          <CardTitle className="text-2xl">{entry.title}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>📍</span>
            <span>{entry.location}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">{entry.story}</p>

          {/* Photo thumbnails */}
          {hasPhotos && (
            <div className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {entry.photos.map((photo, index) => (
                  <button
                    key={`${entry.day}-photo-${index}`}
                    onClick={() => openLightbox(photo)}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                  >
                    <img
                      src={photo}
                      alt={`${entry.title} - Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                        Agrandir
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="relative w-full h-[80vh] flex items-center justify-center p-6">
            <img
              src={selectedPhoto}
              alt="Photo agrandie"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Journal;