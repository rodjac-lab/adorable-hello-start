import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";

const Recommendations = () => {
  const books = [
    {
      title: "Lawrence d'Arabie",
      author: "T.E. Lawrence",
      type: "Autobiographie",
      description: "Le récit captivant de l'officier britannique qui a vécu la révolte arabe de 1916-1918. Une plongée dans l'histoire du Moyen-Orient moderne.",
      why: "Indispensable pour comprendre l'histoire moderne de la région et l'émergence de la Jordanie moderne sous l'émir Abdallah.",
      amazon: "https://amazon.fr/...",
      rating: 5
    },
    {
      title: "Pétra : Merveille du monde",
      author: "Jane Taylor", 
      type: "Guide culturel",
      description: "Guide complet sur l'histoire, l'archéologie et l'art nabatéen de Pétra. Avec de magnifiques photographies et plans détaillés.",
      why: "Le guide de référence pour comprendre l'ingéniosité nabatéenne et l'importance historique du site.",
      amazon: "https://amazon.fr/...",
      rating: 4
    },
    {
      title: "Les Bédouins de Jordanie",
      author: "Shelagh Weir",
      type: "Anthropologie",
      description: "Étude approfondie de la culture bédouine traditionnelle, ses traditions, son artisanat et son mode de vie.",
      why: "Pour découvrir l'âme nomade de la Jordanie et comprendre l'hospitalité légendaire de ses habitants.",
      amazon: "https://amazon.fr/...",
      rating: 4
    },
    {
      title: "Cuisine du Moyen-Orient",
      author: "Claudia Roden",
      type: "Gastronomie",
      description: "Bible de la cuisine moyen-orientale avec des recettes authentiques jordaniennes, palestiniennes et syriennes.",
      why: "Pour reproduire chez soi les saveurs découvertes et prolonger le voyage culinaire.",
      amazon: "https://amazon.fr/...",
      rating: 5
    },
    {
      title: "Jordan: A Timeless Land",
      author: "Mohamed El-Khoury",
      type: "Beau livre",
      description: "Superbe livre photographique qui capture la beauté des paysages jordaniens, de Pétra au Wadi Rum.",
      why: "Pour revivre visuellement la magie des paysages jordaniens et partager la beauté du pays.",
      amazon: "https://amazon.fr/...",
      rating: 4
    },
    {
      title: "Le Royaume hachémite de Jordanie",
      author: "Philippe Droz-Vincent",
      type: "Géopolitique",
      description: "Analyse politique et sociale de la Jordanie contemporaine, son rôle régional et ses défis.",
      why: "Pour comprendre les enjeux actuels du royaume et son importance stratégique au Moyen-Orient.",
      amazon: "https://amazon.fr/...",
      rating: 4
    }
  ];

  const getRatingStars = (rating: number) => {
    return "⭐".repeat(rating);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      "Autobiographie": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      "Guide culturel": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      "Anthropologie": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      "Gastronomie": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      "Beau livre": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100",
      "Géopolitique": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
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
              Lectures recommandées
            </h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Pour approfondir votre découverte de la Jordanie : histoire, culture, gastronomie et géopolitique
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">

        {/* Introduction */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">📚 Pourquoi ces livres ?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Ces ouvrages ont nourri ma préparation du voyage et continuent d'enrichir mes souvenirs. 
              Chacun apporte un éclairage unique sur cette terre fascinante où se mêlent traditions 
              millénaires et modernité, berceau de civilisations et carrefour géopolitique.
            </p>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary font-medium">
                💡 Les liens ci-dessous sont des liens d'affiliation Amazon. 
                Votre achat me permet de financer de futurs voyages sans coût supplémentaire pour vous.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 max-w-4xl mx-auto">
          {books.map((book, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{book.title}</CardTitle>
                    <CardDescription className="text-lg font-medium">
                      par {book.author}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Badge className={getTypeColor(book.type)}>
                      {book.type}
                    </Badge>
                    <div className="text-lg">
                      {getRatingStars(book.rating)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{book.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Pourquoi je le recommande</h4>
                    <p className="text-muted-foreground italic">"{book.why}"</p>
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full sm:w-auto"
                      onClick={() => window.open(book.amazon, '_blank')}
                    >
                      📖 Voir sur Amazon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Resources */}
        <Card className="mt-12 max-w-4xl mx-auto shadow-lg border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              🌐 Autres ressources utiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold">Jordan Tourism Board</h4>
                <p className="text-sm text-muted-foreground">Site officiel avec informations pratiques et culturelles</p>
              </div>
              <div>
                <h4 className="font-semibold">Documentaires National Geographic</h4>
                <p className="text-sm text-muted-foreground">Série sur Pétra et les Nabatéens</p>
              </div>
              <div>
                <h4 className="font-semibold">Podcasts</h4>
                <p className="text-sm text-muted-foreground">"Carnet de voyage" de France Inter sur la Jordanie</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Bonnes lectures et... bon voyage ! 📖✈️
          </p>
        </div>
        </div>
      </div>
    </>
  );
};

export default Recommendations;