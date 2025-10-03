import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { getReadingRecommendations, BookRecommendation } from "@/data/readingRecommendations";

const Recommendations = () => {
  const recommendations = getReadingRecommendations();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">Recommandations de Lecture</h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Livres pour approfondir la découverte de la Jordanie et du Moyen-Orient
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 space-y-8">
          {/* Introduction */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">📚 Enrichir l'expérience du voyage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Un voyage ne se limite pas aux sites visités. Ces lectures m'ont permis de mieux comprendre
                l'histoire, la culture et les enjeux contemporains de la Jordanie. Elles transforment la visite
                en véritable immersion culturelle.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-8 max-w-4xl mx-auto">
            {recommendations.map((book) => (
              <BookRecommendationCard key={book.id} book={book} />
            ))}
          </div>

          {/* Cultural Note */}
          <Card className="mt-12 max-w-4xl mx-auto shadow-lg border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-xl text-primary">🌟 L'importance de la préparation culturelle</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Préparer un voyage par la lecture transforme complètement l'expérience. Connaître l'histoire
                des Nabatéens avant de visiter Petra, comprendre les enjeux géopolitiques actuels, ou saisir
                les subtilités culturelles permet d'apprécier chaque moment avec plus de profondeur et de respect.
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-12">
            <p className="text-muted-foreground">Bon voyage littéraire ! 📖✈️</p>
          </div>
        </div>
      </div>
    </>
  );
};

const BookRecommendationCard = memo(({ book }: { book: BookRecommendation }) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {book.category}
          </Badge>
        </div>
        <CardTitle className="text-2xl">{book.title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>✍️</span>
          <span>{book.author}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground leading-relaxed">{book.description}</p>

        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <span className="text-secondary text-lg">💭</span>
              <div>
                <p className="font-medium text-secondary mb-1">Pourquoi je le recommande</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.why_recommend}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {book.amazon_link && (
          <Button variant="outline" className="w-full" asChild>
            <a href={book.amazon_link} target="_blank" rel="noopener noreferrer">
              📖 Voir sur Amazon
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => prevProps.book.title === nextProps.book.title);

export default Recommendations;