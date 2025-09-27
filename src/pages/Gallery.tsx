import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMapContent } from "@/hooks/useMapContent";
import { DraftCallout } from "@/components/DraftCallout";
import { Suspense, lazy } from "react";

// Lazy load the Map component (contains heavy Mapbox GL JS)
const Map = lazy(() => import("@/components/Map"));

// Loading component for the Map
const MapLoading = () => (
  <Card className="h-[600px] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Chargement de la carte interactive...</p>
    </div>
  </Card>
);

const Gallery = () => {
  const { entries, status, isLoading, error, isStudioEditing } = useMapContent();
  const showDraft = status === "draft" || entries.length === 0;

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

        <div className="container mx-auto px-4 py-16 space-y-8">
          {error && (
            <Alert className="max-w-2xl mx-auto">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <Card className="max-w-2xl mx-auto shadow-lg">
              <CardContent className="py-10 text-center text-muted-foreground">
                Chargement des lieux à afficher sur la carte...
              </CardContent>
            </Card>
          ) : showDraft ? (
            <DraftCallout isStudioEditing={isStudioEditing} message="La carte interactive sera bientôt disponible." />
          ) : (
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">Itinéraire du voyage</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Découvrez les lieux visités avec leurs positions sur la carte
                </p>
              </div>
              <Suspense fallback={<MapLoading />}>
                <Map />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Gallery;
