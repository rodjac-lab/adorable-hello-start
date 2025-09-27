import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Utensils, Camera, Book, Plane, MapPin } from "lucide-react";
import { OptimizedImage } from "@/components/OptimizedImage";
import heroImage from "@/assets/petra-hero.jpg";

const navigationCards = [
  {
    title: "Journal quotidien",
    description: "Suivez jour par jour mes aventures, découvertes et impressions",
    icon: BookOpen,
    href: "/journal",
    gradient: "from-primary/20 to-accent/20",
  },
  {
    title: "Gastronomie",
    description: "Un voyage culinaire à travers les saveurs jordaniennes",
    icon: Utensils,
    href: "/food",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  {
    title: "Galerie & Carte",
    description: "Les plus beaux moments et l'itinéraire interactif",
    icon: Camera,
    href: "/gallery",
    gradient: "from-blue-500/20 to-purple-500/20",
  },
  {
    title: "Lectures",
    description: "Mes recommandations pour approfondir la découverte",
    icon: Book,
    href: "/recommendations",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <OptimizedImage
          src={heroImage}
          alt="Vue majestueuse de Petra en Jordanie"
          className="absolute inset-0"
          priority={true}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10"></div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <MapPin className="h-8 w-8 text-white" />
            <span className="text-white/80 font-inter text-lg tracking-wide">MOYEN-ORIENT</span>
          </div>
          
          <h1 className="font-playfair text-7xl md:text-9xl font-bold text-white mb-6 tracking-tight leading-none">
            Jordanie
          </h1>
          
          <p className="font-inter text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            Deux semaines de découverte au cœur du berceau de l'humanité
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-inter font-semibold px-8 py-4 rounded-full text-lg shadow-elegant"
            >
              <a href="/studio">🚑 Ouvrir le studio</a>
            </Button>
            <Button 
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white/10 font-inter font-semibold px-8 py-4 rounded-full text-lg backdrop-blur-sm"
            >
              <a href="/gallery">Galerie & Carte</a>
            </Button>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/10 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Navigation Cards Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-5xl font-bold mb-6 text-foreground">
            Explorez mon voyage
          </h2>
          <p className="font-inter text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Découvrez les merveilles de la Jordanie à travers mes yeux : des ruines antiques de Pétra aux saveurs locales, en passant par les paysages du Wadi Rum.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {navigationCards.map((card, index) => (
            <Card 
              key={card.title}
              className={`group hover:shadow-card transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-to-br ${card.gradient} backdrop-blur-sm`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-background/80 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <card.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="font-playfair text-2xl font-semibold text-card-foreground">
                    {card.title}
                  </CardTitle>
                </div>
                <CardDescription className="font-inter text-base text-muted-foreground leading-relaxed">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  asChild
                  variant="outline"
                  className="w-full font-inter font-medium group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                >
                  <a href={card.href}>
                    Explorer →
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Plane className="h-6 w-6 text-primary" />
            <span className="font-inter text-sm font-medium text-primary tracking-wide uppercase">À propos du voyage</span>
          </div>
          
          <h3 className="font-playfair text-4xl font-bold mb-6 text-foreground">
            Une aventure humaine et culturelle
          </h3>
          
          <p className="font-inter text-lg text-muted-foreground leading-relaxed mb-8">
            Ce carnet de voyage retrace deux semaines intenses à la découverte de la Jordanie, 
            de ses sites archéologiques exceptionnels à sa gastronomie authentique. 
            Chaque jour a été une nouvelle découverte, chaque rencontre une leçon d'humanité.
          </p>
          
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="font-inter font-medium"
          >
            <a href="/journal">Commencer la lecture</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 px-4 text-center border-t border-border/50">
        <p className="font-inter text-muted-foreground">
          © 2024 - Carnet de voyage en Jordanie
        </p>
      </footer>
    </div>
  );
};

export default Index;