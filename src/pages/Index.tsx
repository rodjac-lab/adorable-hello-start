import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Utensils, Camera, Book, Plane, MapPin } from "lucide-react";
import { PageLayout } from "@/layouts/PageLayout";
import heroImage from "@/assets/petra-hero.jpg";

const navigationCards = [
  {
    title: "Journal quotidien",
    description: "Suivez jour par jour mes aventures, découvertes et impressions",
    icon: BookOpen,
    href: "/journal",
    gradient: "from-primary/30 via-primary/20 to-accent/30",
  },
  {
    title: "Gastronomie",
    description: "Un voyage culinaire à travers les saveurs jordaniennes",
    icon: Utensils,
    href: "/food",
    gradient: "from-orange-500/30 via-orange-400/20 to-red-500/30",
  },
  {
    title: "Galerie & Carte",
    description: "Les plus beaux moments et l'itinéraire interactif",
    icon: Camera,
    href: "/gallery",
    gradient: "from-blue-500/30 via-indigo-400/20 to-purple-500/30",
  },
  {
    title: "Lectures",
    description: "Mes recommandations pour approfondir la découverte",
    icon: Book,
    href: "/recommendations",
    gradient: "from-emerald-500/30 via-emerald-400/20 to-green-500/30",
  },
];

const Index = () => {
  return (
    <PageLayout
      title="Accueil"
      description="Carnet de voyage en Jordanie : journal interactif, carte immersive et bonnes adresses pour préparer votre propre aventure."
      image={heroImage}
    >
      <Header />

      <main id="main-content" className="flex flex-col">
        {/* Hero Section */}
        <section
          className="relative flex min-h-[80vh] items-center justify-center overflow-hidden"
          aria-label="Présentation du voyage en Jordanie"
        >
          <img
            src={heroImage}
            alt="Lever de soleil sur les tombeaux nabatéens de Pétra en Jordanie"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-950/65 sm:bg-slate-950/55" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 text-center text-white">
            <div className="mb-6 flex items-center justify-center gap-3 text-white/90">
              <MapPin className="h-8 w-8" aria-hidden="true" />
              <span className="font-inter text-lg tracking-wide">MOYEN-ORIENT</span>
            </div>

            <h1 className="font-playfair text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
              Jordanie
            </h1>

            <p className="mt-6 max-w-2xl font-inter text-lg leading-relaxed text-white/90 sm:text-xl">
              Deux semaines de découverte au cœur du berceau de l'humanité, entre patrimoine, gastronomie et rencontres.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="flex items-center gap-2 rounded-full bg-white px-8 py-4 font-inter font-semibold text-primary shadow-elegant transition hover:bg-white/90"
              >
                <a href="/journal" aria-label="Ouvrir le journal de voyage et récupérer mes données">
                  <span aria-hidden="true" role="img">
                    🚑
                  </span>
                  <span>Récupérer mes données</span>
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-2 border-white px-8 py-4 font-inter font-semibold text-white transition hover:bg-white/10"
              >
                <a href="/gallery">Explorer la galerie &amp; la carte</a>
              </Button>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-20 left-20 h-32 w-32 rounded-full border border-white/10" />
            <div className="absolute bottom-16 right-24 h-48 w-48 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
          </div>
        </section>

        {/* Navigation Cards Section */}
        <section className="bg-background py-20">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <h2 className="font-playfair text-4xl font-bold text-foreground sm:text-5xl">
              Explorez mon voyage
            </h2>
            <p className="mx-auto mt-4 max-w-3xl font-inter text-lg leading-relaxed text-muted-foreground">
              Découvrez les merveilles de la Jordanie à travers mes yeux : des ruines antiques de Pétra aux saveurs locales, en
              passant par les paysages du Wadi Rum.
            </p>

            <div className="mt-16 grid gap-8 md:grid-cols-2">
              {navigationCards.map((card) => (
                <Card
                  key={card.title}
                  className={`group h-full border border-border/40 bg-gradient-to-br ${card.gradient} backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-background/80 p-3 shadow-sm transition group-hover:scale-110">
                        <card.icon className="h-7 w-7 text-primary" aria-hidden="true" />
                      </div>
                      <CardTitle className="font-playfair text-2xl text-card-foreground">{card.title}</CardTitle>
                    </div>
                    <CardDescription className="mt-3 font-inter text-left text-base leading-relaxed text-muted-foreground">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full font-inter font-medium transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      <a href={card.href} aria-label={`Découvrir ${card.title}`}>
                        Explorer →
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <Plane className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="font-inter text-sm font-medium uppercase tracking-wide text-primary">
                À propos du voyage
              </span>
            </div>

            <h3 className="font-playfair text-4xl font-bold text-foreground">
              Une aventure humaine et culturelle
            </h3>

            <p className="mx-auto mt-6 max-w-3xl font-inter text-lg leading-relaxed text-muted-foreground">
              Ce carnet de voyage retrace deux semaines intenses à la découverte de la Jordanie, de ses sites archéologiques
              exceptionnels à sa gastronomie authentique. Chaque jour a été une nouvelle découverte, chaque rencontre une leçon
              d'humanité.
            </p>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-8 font-inter font-medium"
            >
              <a href="/journal">Commencer la lecture</a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-muted/40 py-12 text-center text-sm text-muted-foreground">
        © 2024 - Carnet de voyage en Jordanie
      </footer>
    </PageLayout>
  );
};

export default Index;
