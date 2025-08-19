import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Map from "@/components/Map";

const Gallery = () => {
  const photoSections = [
    {
      title: "Amman - La capitale moderne",
      location: "Amman",
      day: 1,
      description: "Entre tradition et modernité, Amman révèle ses multiples facettes",
      photos: [
        {
          title: "Théâtre romain",
          description: "Monument emblématique du centre-ville d'Amman"
        },
        {
          title: "Souk traditionnel", 
          description: "Couleurs et senteurs du marché local"
        },
        {
          title: "Vue panoramique",
          description: "La ville aux sept collines depuis la Citadelle"
        }
      ]
    },
    {
      title: "Jerash - Pompéi du Moyen-Orient",
      location: "Jerash",
      day: 2,
      description: "L'une des cités romaines les mieux préservées au monde",
      photos: [
        {
          title: "Arc d'Hadrien",
          description: "Porte d'entrée monumentale de la cité antique"
        },
        {
          title: "Oval Plaza",
          description: "Place ovale unique bordée de 56 colonnes"
        },
        {
          title: "Théâtre Sud",
          description: "Acoustique parfaite pour 3000 spectateurs"
        }
      ]
    },
    {
      title: "Ajloun - Forteresse des croisades",
      location: "Ajloun",
      day: 3,
      description: "Château médiéval au cœur de la nature jordanienne",
      photos: [
        {
          title: "Château d'Ajloun",
          description: "Forteresse ayyoubide du 12ème siècle"
        },
        {
          title: "Paysages verdoyants",
          description: "Réserve naturelle et collines boisées"
        },
        {
          title: "Vue panoramique",
          description: "Horizon jusqu'à la vallée du Jourdain"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Galerie & Carte
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Revivez le voyage à travers les images et explorez l'itinéraire 
            sur une carte interactive
          </p>
        </div>

        {/* Interactive Map Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Carte interactive du voyage
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explorez l'itinéraire jour par jour avec les lieux visités et les activités
            </p>
          </div>
          <Map />
        </div>

        {/* Photo Gallery Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              Galerie photos
            </h2>
            <p className="text-muted-foreground">
              Les moments forts du voyage capturés en images
            </p>
          </div>

          <div className="grid gap-12">
            {photoSections.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl mb-2">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        {section.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      Jour {section.day}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {section.photos.map((photo, photoIndex) => (
                      <div key={photoIndex} className="group">
                        <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-300">
                          <div className="text-center p-4">
                            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-2xl">📸</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Photo à venir
                            </p>
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1">{photo.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {photo.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Upload Section */}
          <Card className="mt-12 border-dashed border-2 border-primary/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ajoutez vos photos</h3>
              <p className="text-muted-foreground mb-4">
                Cette section pourra être enrichie avec vos vraies photos du voyage
              </p>
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                💡 Conseil : Pour ajouter vos photos, vous pourrez les télécharger 
                et les intégrer dans le code ou utiliser un service de stockage d'images
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Chaque image raconte une histoire... 📷
          </p>
        </div>
      </div>
    </div>
  );
};

export default Gallery;