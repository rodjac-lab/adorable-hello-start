import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { CulturalNote } from "@/components/CulturalNote";

const Journal = () => {
  const journalEntries = [
    { 
      day: 1, 
      date: "15 mars 2024",
      title: "Arrivée à Amman",
      location: "Amman, Jordanie",
      story: "Ce matin-là, après un vol de nuit via Istanbul qui m'a semblé interminable, j'ai enfin posé le pied sur le sol jordanien. L'air chaud d'Amman m'a accueilli comme une caresse, contrastant avec la fraîcheur parisienne que j'avais laissée derrière moi. Dès l'installation à l'hôtel Amman Cham Palace, j'ai ressenti cette énergie particulière des premiers instants d'un voyage tant attendu.\n\nL'après-midi s'est naturellement orientée vers une première exploration du centre-ville. Mes pas m'ont mené vers le théâtre romain, ce monument emblématique qui trône majestueusement au cœur de la ville moderne. En m'asseyant sur ces gradins millénaires, j'ai imaginé les spectacles qui s'y déroulaient autrefois, les voix qui résonnaient entre ces murs de pierre calcaire.\n\nLa soirée a été marquée par ma première véritable immersion dans la culture jordanienne. Dans un petit restaurant familial aux murs ornés de mosaïques, j'ai découvert l'art du mezze. Chaque petite assiette racontait une histoire : l'houmous crémeux, les olives marinées, le fromage blanc parsemé d'herbes fraîches. Le propriétaire, un homme chaleureux aux yeux pétillants, m'a expliqué avec fierté l'origine de chaque préparation, créant instantanément cette complicité qui caractérise l'hospitalité jordanienne.",
      mood: "Enthousiaste",
      photos: ["amman-theater.jpg", "citadel-view.jpg"]
    },
    {
      day: 2,
      date: "16 mars 2024", 
      title: "Jerash - Pompéi du Moyen-Orient",
      location: "Jerash, Jordanie",
      story: "Le réveil s'est fait naturellement avec les premiers rayons du soleil perçant à travers les rideaux de ma chambre. Aujourd'hui, direction Jerash, cette cité antique que l'on surnomme la 'Pompéi du Moyen-Orient'. Le trajet d'une heure en taxi m'a offert mes premiers aperçus des paysages jordaniens : collines arides ponctuées d'oliviers centenaires et petits villages aux maisons de pierre claire.\n\nEn franchissant l'Arc d'Hadrien, cette porte monumentale érigée en l'honneur de l'empereur romain, j'ai ressenti un frisson d'émotion. Devant moi s'étendait l'une des cités romaines les mieux préservées au monde. Mon guide, Mahmoud, un passionné d'archéologie aux connaissances encyclopédiques, m'a fait revivre l'époque où cette ville comptait plus de 25 000 habitants.\n\nL'Oval Plaza m'a littéralement coupé le souffle. Cette place elliptique bordée de 56 colonnes corinthiennes défie toutes les conventions architecturales romaines. Mahmoud m'a expliqué que cette forme unique était probablement adaptée à la topographie locale, démontrant l'ingéniosité des constructeurs de l'époque. En me tenant au centre de cette place, j'ai fermé les yeux et imaginé l'animation qui y régnait il y a deux millénaires.\n\nL'après-midi s'est achevée au Théâtre Sud, où Mahmoud m'a démontré l'acoustique parfaite de ce lieu. Sa voix, même chuchotée depuis la scène, me parvenait clairement jusqu'aux gradins les plus hauts. Ce moment magique a scellé ma fascination pour cette civilisation qui savait allier beauté et fonctionnalité.",
      mood: "Émerveillé",
      photos: ["jerash-columns.jpg", "oval-plaza.jpg"]
    },
    {
      day: 3,
      date: "17 mars 2024",
      title: "Ajloun et retour aux sources",
      location: "Ajloun, Jordanie", 
      story: "Cette troisième journée m'a menée vers les collines verdoyantes d'Ajloun, un contraste saisissant avec les paysages plus arides découverts jusqu'alors. La route serpentant à travers les montagnes m'a révélé une Jordanie inattendue : celle des forêts de chênes et des prairies parsemées de fleurs sauvages.\n\nLe château d'Ajloun, ou Qal'at ar-Rabad, se dresse fièrement sur sa colline comme un gardien millénaire. Cette forteresse ayyoubide du 12ème siècle, construite pour faire face aux croisés, raconte une tout autre histoire que les vestiges romains de la veille. En gravissant les escaliers de pierre usés par le temps, j'ai admiré l'ingéniosité défensive de cette architecture islamique : meurtrières stratégiquement placées, passages secrets, et cette vue panoramique qui s'étend jusqu'à la vallée du Jourdain.\n\nL'après-midi dans la réserve naturelle d'Ajloun a été un véritable bain de nature. Accompagnée d'un garde forestier, j'ai découvert une biodiversité surprenante : sangliers, renards, et une multitude d'oiseaux migrateurs. Le pique-nique improvisé sur un promontoire rocheux, avec vue sur les vallées environnantes, restera gravé dans ma mémoire.\n\nLa rencontre la plus touchante de cette journée fut celle d'une famille de bergers qui m'a invitée à partager le thé. Malgré la barrière de la langue, leurs sourires et leur générosité ont créé une communication universelle. En repartant vers Amman, le cœur empli de cette sérénité montagnarde, j'ai compris que la Jordanie offrait bien plus que ses trésors archéologiques.",
      mood: "Serein",
      photos: ["ajloun-castle.jpg", "nature-reserve.jpg"]
    }
  ];

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
          <div className="max-w-4xl mx-auto space-y-12">
            {journalEntries.map((entry) => (
              <Card key={entry.day} className="shadow-elegant hover:shadow-premium transition-all duration-300 border-0 bg-gradient-to-br from-card via-card/95 to-card/90">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-serif text-3xl mb-3 text-foreground tracking-wide">
                        Jour {entry.day} — {entry.title}
                      </CardTitle>
                      <CardDescription className="text-lg text-muted-foreground font-light">
                        {entry.date} • {entry.location}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-4 px-3 py-1 font-light tracking-wide">
                      {entry.mood}
                    </Badge>
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
                  
                  {/* Cultural Note for Jerash */}
                  {entry.day === 2 && (
                    <CulturalNote 
                      title="Note historique • Jerash" 
                      icon="🏛️"
                    >
                      <p className="mb-3">
                        Jerash, anciennement appelée <em>Gérasa</em>, est l'une des villes de la Décapole les mieux préservées au monde. 
                        Fondée par Alexandre le Grand au <strong>IVᵉ siècle av. J.-C.</strong>, elle a connu son apogée sous l'Empire romain.
                      </p>
                      <p>
                        Le site abrite des monuments remarquables comme l'Arc d'Hadrien (129 ap. J.-C.) et l'Oval Plaza, 
                        une place ovale unique bordée de 56 colonnes ioniques, témoignage exceptionnel de l'adaptation 
                        de l'architecture romaine aux contraintes topographiques locales.
                      </p>
                    </CulturalNote>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">
              Plus d'entrées bientôt... Le voyage continue !
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Journal;