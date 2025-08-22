import React, { useState } from 'react';
import { MapLocation } from '@/types/map';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';

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
  const [editedLocations, setEditedLocations] = useState<MapLocation[]>(locations);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<'principal' | 'secondaire'>('secondaire');

  const updateLocation = (index: number, updates: Partial<MapLocation>) => {
    setEditedLocations(prev => 
      prev.map((loc, i) => i === index ? { ...loc, ...updates } : loc)
    );
  };

  const removeLocation = (index: number) => {
    setEditedLocations(prev => prev.filter((_, i) => i !== index));
  };

  const addLocation = () => {
    if (!newLocationName.trim()) return;
    
    // Utiliser la première entrée journal comme base
    const baseEntry = editedLocations[0]?.journalEntry;
    if (!baseEntry) return;

    const newLocation: MapLocation = {
      name: newLocationName.trim(),
      coordinates: [35.9106, 31.9539], // Coordonnées par défaut (Amman)
      type: newLocationType,
      day: baseEntry.day,
      journalEntry: baseEntry
    };

    setEditedLocations(prev => [...prev, newLocation]);
    setNewLocationName('');
  };

  const handleValidate = () => {
    onValidate(editedLocations);
  };

  const groupedByDay = editedLocations.reduce((groups, location) => {
    const day = location.day;
    if (!groups[day]) groups[day] = [];
    groups[day].push(location);
    return groups;
  }, {} as Record<number, MapLocation[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validation des lieux détectés</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Carte miniature preview */}
          <Card>
            <CardContent className="p-4">
              <div className="bg-muted rounded-lg h-48 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-sm">Aperçu de la carte</div>
                  <div className="text-xs mt-1">
                    {editedLocations.length} marqueur(s) détecté(s)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des lieux par jour */}
          {Object.entries(groupedByDay).map(([day, dayLocations]) => (
            <Card key={day}>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Jour {day}</h3>
                <div className="space-y-3">
                  {dayLocations.map((location, index) => {
                    const globalIndex = editedLocations.findIndex(l => l === location);
                    return (
                      <div key={globalIndex} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={location.name}
                              onChange={(e) => updateLocation(globalIndex, { name: e.target.value })}
                              className="flex-1"
                              placeholder="Nom du lieu"
                            />
                            <Select
                              value={location.type}
                              onValueChange={(value: 'principal' | 'secondaire') => 
                                updateLocation(globalIndex, { type: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="principal">Principal</SelectItem>
                                <SelectItem value="secondaire">Secondaire</SelectItem>
                              </SelectContent>
                            </Select>
                            <Badge variant={location.type === 'principal' ? 'default' : 'secondary'}>
                              {location.type === 'principal' ? 'Logement' : 'Visite'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Coordonnées: {location.coordinates[1].toFixed(4)}, {location.coordinates[0].toFixed(4)}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLocation(globalIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Ajouter un nouveau lieu */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Ajouter un lieu manqué</h3>
              <div className="flex gap-2">
                <Input
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="Nom du nouveau lieu"
                  className="flex-1"
                />
                <Select
                  value={newLocationType}
                  onValueChange={(value: 'principal' | 'secondaire') => setNewLocationType(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="secondaire">Secondaire</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addLocation} disabled={!newLocationName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleValidate}>
            Valider et afficher sur la carte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};