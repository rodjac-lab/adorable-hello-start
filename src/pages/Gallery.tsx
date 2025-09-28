import { Header } from "@/components/Header";
import { Suspense, lazy } from "react";

// Lazy load the simplified Map component
const SimpleMap = lazy(() => import("@/components/SimpleMap"));

// Loading component for the Map
const MapLoading = () => (
  <div className="h-[500px] flex items-center justify-center rounded-lg border bg-card">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Chargement de la carte interactive...</p>
    </div>
  </div>
);

const Gallery = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950 dark:via-orange-950 dark:to-red-950 pt-20">
        {/* Hero Section */}
        <div className="relative pt-16 pb-24 bg-gradient-to-r from-primary via-secondary to-accent text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-6xl font-playfair font-bold mb-6 animate-fade-in">Carte Interactive</h1>
            <p className="text-xl max-w-2xl mx-auto leading-relaxed animate-fade-in">
              Explorez l'itinéraire du voyage en Jordanie avec les lieux visités jour par jour
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          <Suspense fallback={<MapLoading />}>
            <SimpleMap />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default Gallery;
