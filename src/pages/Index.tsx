// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
        <div className="text-center z-20 px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            Jordanie
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Deux semaines de découverte au cœur du Moyen-Orient
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-white/90 transition-colors">
              Découvrir le voyage
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
              Galerie photos
            </button>
          </div>
        </div>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/10 rounded-full"></div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-foreground">
          Explorez mon voyage
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Daily Journal */}
          <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📖</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Journal quotidien</h3>
            <p className="text-muted-foreground mb-4">
              Suivez jour par jour mes aventures, découvertes et impressions
            </p>
            <button className="text-primary font-semibold hover:underline">
              Lire les entrées →
            </button>
          </div>

          {/* Culture & History */}
          <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏛️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Culture & Histoire</h3>
            <p className="text-muted-foreground mb-4">
              Découvrez l'histoire fascinante des sites visités
            </p>
            <button className="text-primary font-semibold hover:underline">
              Explorer →
            </button>
          </div>

          {/* Food Experience */}
          <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Gastronomie</h3>
            <p className="text-muted-foreground mb-4">
              Un voyage culinaire à travers les saveurs jordaniennes
            </p>
            <button className="text-primary font-semibold hover:underline">
              Déguster →
            </button>
          </div>

          {/* Photo Gallery */}
          <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📸</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Galerie</h3>
            <p className="text-muted-foreground mb-4">
              Les plus beaux moments capturés en images
            </p>
            <button className="text-primary font-semibold hover:underline">
              Voir les photos →
            </button>
          </div>

          {/* Recommendations */}
          <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">Lectures</h3>
            <p className="text-muted-foreground mb-4">
              Mes recommandations pour approfondir la découverte
            </p>
            <button className="text-primary font-semibold hover:underline">
              Découvrir →
            </button>
          </div>

          {/* About */}
          <div className="bg-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✈️</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-card-foreground">À propos</h3>
            <p className="text-muted-foreground mb-4">
              L'histoire de ce voyage et conseils pratiques
            </p>
            <button className="text-primary font-semibold hover:underline">
              En savoir plus →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 px-4 text-center">
        <p className="text-muted-foreground">
          © 2024 - Carnet de voyage en Jordanie
        </p>
      </footer>
    </div>
  );
};

export default Index;
