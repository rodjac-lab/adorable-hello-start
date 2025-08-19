import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";

const Food = () => {
  const foodExperiences = [
    {
      name: "Mansaf",
      type: "Plat national",
      description: "Le plat emblématique jordanien : agneau cuit dans une sauce au yaourt fermenté (jameed), servi sur un lit de riz et mangé traditionnellement avec les mains.",
      experience: "Partagé lors d'un déjeuner familial à Amman. L'expérience était autant sociale que gustative - toute la famille mange dans le même plat, créant une intimité particulière.",
      rating: 5,
      location: "Restaurant familial, Amman",
      price: "Modéré"
    },
    {
      name: "Falafel et Houmous",
      type: "Street food",
      description: "Boulettes de pois chiches frites servies avec houmous crémeux, tahini, et légumes frais dans du pain pita chaud.",
      experience: "Découvert dans une petite échoppe près du théâtre romain. Le propriétaire m'a expliqué ses secrets : pois chiches trempés 24h et épices moulues chaque matin.",
      rating: 4,
      location: "Downtown Amman",
      price: "Très abordable"
    },
    {
      name: "Knafeh",
      type: "Dessert",
      description: "Dessert traditionnel au fromage fondu recouvert de cheveux d'ange (kataifi) et arrosé de sirop parfumé à l'eau de rose.",
      experience: "Une révélation ! La version de Nablus dégustée à Amman était parfaite : croquant du dessus, fondant à l'intérieur. Un équilibre sucré-salé surprenant.",
      rating: 5,
      location: "Pâtisserie Al-Aker, Amman",
      price: "Abordable"
    },
    {
      name: "Thé à la menthe et café arabe",
      type: "Boissons",
      description: "Thé noir parfumé à la menthe fraîche et café arabe (qahwa) parfumé à la cardamome, servis dans de petits verres.",
      experience: "Rituel quotidien dans chaque lieu visité. Le thé accompagne chaque conversation, chaque pause. Le café arabe, plus corsé, ponctue les moments importants.",
      rating: 4,
      location: "Partout",
      price: "Très abordable"
    }
  ];

  const getRatingStars = (rating: number) => {
    return "⭐".repeat(rating);
  };

  const getPriceColor = (price: string) => {
    switch (price) {
      case "Très abordable":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "Abordable":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "Modéré":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    }
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
              Voyage culinaire
            </h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Découverte des saveurs authentiques de la Jordanie, entre traditions millénaires et hospitalité légendaire
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">

        {/* Introduction */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">🍽️ L'art de vivre jordanien</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              La cuisine jordanienne reflète la richesse culturelle du pays : influences bédouines, 
              palestiniennes, syriennes et libanaises se mélangent pour créer une gastronomie unique. 
              Chaque repas est une invitation au partage, une célébration de l'hospitalité légendaire jordanienne.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-8 max-w-4xl mx-auto">
          {foodExperiences.map((food, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-2xl mb-2">{food.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {food.location}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline">{food.type}</Badge>
                    <Badge className={getPriceColor(food.price)}>
                      {food.price}
                    </Badge>
                  </div>
                </div>
                <div className="text-2xl">
                  {getRatingStars(food.rating)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{food.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Mon expérience</h4>
                    <p className="text-muted-foreground italic">"{food.experience}"</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cultural Note */}
        <Card className="mt-12 max-w-4xl mx-auto shadow-lg border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xl text-primary">
              🌟 L'hospitalité jordanienne à table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              En Jordanie, refuser un thé ou un café est presque impossible ! L'hospitalité ("karam" en arabe) 
              est profondément ancrée dans la culture. Les repas sont des moments sacrés de partage, 
              où l'on prend le temps de discuter, de rire et de créer des liens. 
              J'ai été invité à plusieurs reprises par des inconnus qui souhaitaient simplement 
              partager leur table et leur culture.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Les saveurs continuent de danser dans mes souvenirs... 🌶️
          </p>
        </div>
        </div>
      </div>
    </>
  );
};

export default Food;