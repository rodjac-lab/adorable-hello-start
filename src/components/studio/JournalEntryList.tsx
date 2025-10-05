import { JournalEntry } from "@/lib/journalStorage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContentStatus } from "@/types/content";

interface JournalEntryListProps {
  entries: JournalEntry[];
  onSelect: (entry: JournalEntry) => void;
  onCreate: () => void;
  selectedDay?: number | null;
  isLoading?: boolean;
  getStatus: (day: number) => ContentStatus;
}

const getBadgeVariant = (status: ContentStatus): "outline" | "default" => {
  return status === "published" ? "default" : "outline";
};

const getStatusLabel = (status: ContentStatus): string => {
  return status === "published" ? "Publié" : "Brouillon";
};

export const JournalEntryList = ({
  entries,
  onSelect,
  onCreate,
  selectedDay,
  isLoading = false,
  getStatus,
}: JournalEntryListProps) => {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="space-y-2">
        <CardTitle className="font-serif text-2xl">Journal</CardTitle>
        <CardDescription>
          Gérez vos entrées et préparez votre récit jour par jour.
        </CardDescription>
        <Button onClick={onCreate} className="mt-2 flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nouvelle entrée
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Chargement des entrées...</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Aucune entrée enregistrée pour le moment. Ajoutez votre premier récit !
          </div>
        ) : (
          <ScrollArea className="h-[520px] pr-4">
            <div className="space-y-3">
              {entries.map((entry) => (
                <button
                  type="button"
                  key={entry.day}
                  onClick={() => onSelect(entry)}
                  className={cn(
                    "w-full text-left rounded-lg border p-4 transition-colors", 
                    selectedDay === entry.day
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-serif leading-tight">
                        Jour {entry.day} — {entry.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {entry.date} • {entry.location}
                      </CardDescription>
                    </div>
                    <Badge variant={getBadgeVariant(getStatus(entry.day))} className="text-xs">
                      {getStatusLabel(getStatus(entry.day))}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {entry.story}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
