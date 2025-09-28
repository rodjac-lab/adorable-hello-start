import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// Lazy load all pages except Index (needed immediately)
import Index from "./pages/Index";
const Journal = lazy(() => import("./pages/Journal"));
const Food = lazy(() => import("./pages/Food"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Editor = lazy(() => import("./pages/Editor"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component for Suspense fallbacks
const LoadingPage = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/food" element={<Food />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;