import { useState, memo } from "react";
import { Menu, X, BookOpen, Calendar, Utensils, Map, BookOpenCheck, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Journal", href: "/journal", icon: Calendar },
  { name: "Gastronomie", href: "/food", icon: Utensils },
  { name: "Carte Interactive", href: "/gallery", icon: Map },
  { name: "Lectures", href: "/recommendations", icon: BookOpenCheck },
  { name: "Éditeur", href: "/editor", icon: Edit3 },
];

const HeaderComponent = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="font-playfair font-semibold text-xl text-foreground">Jordanie</span>
          </a>
        </div>

        <div className="flex lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-inter font-medium leading-6 text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 group"
              >
                <IconComponent className="h-4 w-4 group-hover:scale-110 transition-transform" />
                {item.name}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 z-50"></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-border">
            <div className="flex items-center justify-between">
              <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <span className="font-playfair font-semibold text-xl">Jordanie</span>
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5"
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-border">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 -mx-3 rounded-lg px-3 py-3 text-base font-inter font-medium leading-7 text-foreground hover:bg-muted group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <IconComponent className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        {item.name}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Memoize Header to prevent unnecessary re-renders
export const Header = memo(HeaderComponent);