import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMediaLibraryState } from "@/hooks/useMediaLibraryState";

interface MediaAssetSelectorProps {
  label?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const isImageAsset = (type: string): boolean => type.startsWith("image/");

export const MediaAssetSelector = ({ label, selectedIds, onChange }: MediaAssetSelectorProps) => {
  const { assets, usage } = useMediaLibraryState();

  const imageAssets = useMemo(() => assets.filter((asset) => isImageAsset(asset.type)), [assets]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggleSelection = (assetId: string) => {
    const next = new Set(selectedSet);
    if (next.has(assetId)) {
      next.delete(assetId);
    } else {
      next.add(assetId);
    }
    onChange(Array.from(next));
  };

  const clearSelection = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{label ?? "Galerie photo associée"}</p>
          <p className="text-xs text-muted-foreground">
            {imageAssets.length === 0
              ? "Aucune image importée pour le moment. Ajoutez vos visuels depuis l'onglet Médiathèque du Studio."
              : `${selectedIds.length} média${selectedIds.length > 1 ? "s" : ""} sélectionné${
                  selectedIds.length > 1 ? "s" : ""
                } • ${usage.assetCount} média${usage.assetCount > 1 ? "s" : ""} disponibles`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedIds.length === 0}>
          Effacer
        </Button>
      </div>

      {imageAssets.length === 0 ? (
        <Card className="border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
          Importez vos photos dans la Médiathèque pour les associer à vos entrées.
        </Card>
      ) : (
        <ScrollArea className="max-h-60 rounded-md border">
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
            {imageAssets.map((asset) => {
              const isSelected = selectedSet.has(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleSelection(asset.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-md border text-left transition",
                    isSelected ? "border-primary ring-2 ring-primary" : "border-transparent hover:border-muted-foreground/30",
                  )}
                >
                  <div className="aspect-video w-full bg-muted">
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-medium">{asset.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{asset.description ?? "Image importée"}</p>
                  </div>
                  {isSelected && (
                    <Badge className="absolute right-2 top-2" variant="default">
                      Sélectionné
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
