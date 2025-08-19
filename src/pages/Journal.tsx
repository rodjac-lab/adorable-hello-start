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

                  {/* Restaurant link for day 2 */}
                  {entry.day === 2 && entry.link && (
                    <div className="mt-4">
                      <a 
                        href={entry.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-premium-accent hover:text-premium-foreground transition-colors duration-200 text-sm font-light"
                      >
                        🔗 Voir le restaurant Ghaith sur Google Maps
                      </a>
                    </div>
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