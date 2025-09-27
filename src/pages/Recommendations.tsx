import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { useReadingContent } from "@/hooks/useReadingContent";
import { ReadingCard } from "@/components/ReadingCard";
import { DraftCallout } from "@/components/DraftCallout";

const Recommendations = () => {
  const { items: recommendations, isLoading, error } = useReadingContent();
  const showDraft = recommendations.length === 0;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">Lectures recommandées</h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Pour approfondir votre découverte de la Jordanie : histoire, culture, gastronomie et géopolitique
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
                Chargement des recommandations de lecture...
              </CardContent>
            </Card>
          ) : showDraft ? (
            <DraftCallout isStudioEditing={false} />
          ) : (
            <>
              {/* Introduction */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">📚 Pourquoi ces livres ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Ces ouvrages ont nourri ma préparation du voyage et continuent d'enrichir mes souvenirs. Chacun apporte un
                    éclairage unique sur cette terre fascinante où se mêlent traditions millénaires et modernité, berceau de
                    civilisations et carrefour géopolitique.
                  </p>
                  <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-primary font-medium">
                      💡 Les liens ci-dessous sont des liens d'affiliation Amazon. Votre achat me permet de financer de futurs
                      voyages sans coût supplémentaire pour vous.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 max-w-4xl mx-auto">
                {recommendations.map((recommendation) => (
                  <ReadingCard key={recommendation.id} recommendation={recommendation} />
                ))}
              </div>

              {/* Additional Resources */}
              <Card className="mt-12 max-w-4xl mx-auto shadow-lg border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">🌐 Autres ressources utiles</CardTitle>
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
                <p className="text-muted-foreground">Bonnes lectures et... bon voyage ! 📖✈️</p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Recommendations;
