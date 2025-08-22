import Map from "@/components/Map";
import { Header } from "@/components/Header";

const Gallery = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">
              Carte Interactive
            </h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Explorez l'itinéraire du voyage en Jordanie avec les lieux visités jour par jour
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Interactive Map Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Itinéraire du voyage
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Découvrez les lieux visités avec leurs positions sur la carte
              </p>
            </div>
            <Map />
          </div>
        </div>
      </div>
    </>
  );
};

export default Gallery;