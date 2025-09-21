import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { FoodExperienceCard } from "@/components/FoodExperienceCard";
import { useFoodContent } from "@/hooks/useFoodContent";

const DraftCallout = ({ isStudioEditing }: { isStudioEditing: boolean }) => (
  <Card className="max-w-2xl mx-auto text-center shadow-lg">
    <CardHeader>
      <CardTitle className="text-2xl">✍️ Contenu en cours de rédaction</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">
        Cette section est actuellement en cours de rédaction.
        {isStudioEditing ? (
          <>
            {" "}
            Rendez-vous dans l'espace
            {" "}
            <Link to="/studio" className="text-primary underline font-medium">
              Studio
            </Link>
            {" "}
            pour ajouter vos expériences culinaires.
          </>
        ) : (
          " Revenez bientôt pour découvrir mes coups de cœur gastronomiques !"
        )}
      </p>
    </CardContent>
  </Card>
);

const Food = () => {
  const { experiences, status, isLoading, error, isStudioEditing } = useFoodContent();
  const showDraft = status === "draft" || experiences.length === 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">Voyage culinaire</h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Découverte des saveurs authentiques de la Jordanie, entre traditions millénaires et hospitalité légendaire
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 space-y-8">
          {error && (
            <Alert className="max-w-2xl mx-auto">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="py-10 text-center text-muted-foreground">
                Chargement des expériences culinaires...
              </CardContent>
            </Card>
          ) : showDraft ? (
            <DraftCallout isStudioEditing={isStudioEditing} />
          ) : (
            <>
              {/* Introduction */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">🍽️ L'art de vivre jordanien</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    La cuisine jordanienne reflète la richesse culturelle du pays : influences bédouines, palestiniennes, syriennes
                    et libanaises se mélangent pour créer une gastronomie unique. Chaque repas est une invitation au partage, une
                    célébration de l'hospitalité légendaire jordanienne.
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-8 max-w-4xl mx-auto">
                {experiences.map((experience) => (
                  <FoodExperienceCard key={experience.id} experience={experience} />
                ))}
              </div>

              {/* Cultural Note */}
              <Card className="mt-12 max-w-4xl mx-auto shadow-lg border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">🌟 L'hospitalité jordanienne à table</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    En Jordanie, refuser un thé ou un café est presque impossible ! L'hospitalité ("karam" en arabe) est
                    profondément ancrée dans la culture. Les repas sont des moments sacrés de partage, où l'on prend le temps de
                    discuter, de rire et de créer des liens. J'ai été invité à plusieurs reprises par des inconnus qui
                    souhaitaient simplement partager leur table et leur culture.
                  </p>
                </CardContent>
              </Card>

              <div className="text-center mt-12">
                <p className="text-muted-foreground">Les saveurs continuent de danser dans mes souvenirs... 🌶️</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Food;
