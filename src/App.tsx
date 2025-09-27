import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Journal from "./pages/Journal";
import Food from "./pages/Food";
import Gallery from "./pages/Gallery";
import Recommendations from "./pages/Recommendations";
import Studio from "./pages/Studio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface AppProps {
  studioVisible?: boolean;
}

const App = ({ studioVisible = false }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/food" element={<Food />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/recommendations" element={<Recommendations />} />

          {studioVisible && <Route path="/studio" element={<Studio />} />}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
