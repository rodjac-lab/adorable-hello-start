import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { MapLocation } from '@/types/map';
import { MapPin, Calendar, BookOpen, Heart } from 'lucide-react';

interface LocationValidationModalProps {
  isOpen: boolean;
  locations: MapLocation[];
  onValidate: (validatedLocations: MapLocation[]) => void;
  onCancel: () => void;
}

export const LocationValidationModal: React.FC<LocationValidationModalProps> = ({
  isOpen,
  locations,
  onValidate,
  onCancel
}) => {
  const [selectedLocations, setSelectedLocations] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(true);

  // Initialize all locations as selected when modal opens
  useEffect(() => {
    if (isOpen && locations.length > 0) {
      setSelectedLocations(new Set(locations.map((_, index) => index)));
      setSelectAll(true);
    }
  }, [isOpen, locations]);

  const handleLocationToggle = (index: number) => {
    const newSelected = new Set(selectedLocations);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedLocations(newSelected);
    setSelectAll(newSelected.size === locations.length);
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedLocations(new Set());
      setSelectAll(false);
    } else {
      setSelectedLocations(new Set(locations.map((_, index) => index)));
      setSelectAll(true);
    }
  };

  const handleValidate = () => {
    const validatedLocations = locations.filter((_, index) => selectedLocations.has(index));
    onValidate(validatedLocations);
  };

  const handleCancel = () => {
    setSelectedLocations(new Set());
    setSelectAll(false);
    onCancel();
  };

  const selectedCount = selectedLocations.size;
  const totalCount = locations.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Validation des lieux géocodés
          </DialogTitle>
          <DialogDescription>
            Vérifiez et validez les lieux trouvés automatiquement. Vous pouvez désélectionner les lieux incorrects avant de les ajouter à la carte.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Select All Controls */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAllToggle}
                id="select-all"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Sélectionner tout ({totalCount} lieux)
              </label>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedCount} sur {totalCount} sélectionné{selectedCount > 1 ? 's' : ''}
            </div>
          </div>

          {/* Locations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {locations.map((location, index) => {
              const isSelected = selectedLocations.has(index);
              const isPrincipal = location.type === 'principal';

              return (
                <Card
                  key={index}
                  className={`transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'bg-muted/20 opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {/* Checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleLocationToggle(index)}
                        className="mt-1"
                      />

                      {/* Location Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header with name and type */}
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <h3 className="font-semibold text-base truncate">
                            {location.name}
                          </h3>
                          <Badge
                            variant={isPrincipal ? "default" : "secondary"}
                            className="flex-shrink-0"
                          >
                            {location.type}
                          </Badge>
                        </div>

                        {/* Coordinates */}
                        <div className="text-xs text-muted-foreground mb-3 font-mono">
                          {location.coordinates[0].toFixed(6)}, {location.coordinates[1].toFixed(6)}
                        </div>

                        {/* Journal Entry Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Jour {location.day} - {location.journalEntry.date}</span>
                          </div>

                          <div className="flex items-start gap-2">
                            <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {location.journalEntry.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {location.journalEntry.story}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <Heart className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Humeur: {location.journalEntry.mood}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-muted-foreground">
              {selectedCount === 0 ? (
                "Aucun lieu sélectionné"
              ) : (
                `${selectedCount} lieu${selectedCount > 1 ? 'x' : ''} sera${selectedCount > 1 ? 'ont' : ''} ajouté${selectedCount > 1 ? 's' : ''} à la carte`
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button
                onClick={handleValidate}
                disabled={selectedCount === 0}
              >
                Valider ({selectedCount})
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};