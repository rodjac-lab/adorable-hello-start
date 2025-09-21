import { Card, CardContent } from '@/components/ui/card';
import type { MapLocation } from '@/types/map';

interface MapLocationListProps {
  locations: MapLocation[];
}

export const MapLocationList = ({ locations }: MapLocationListProps) => {
  if (locations.length === 0) {
    return null;
  }

  const sortedLocations = [...locations].sort((a, b) => a.day - b.day);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedLocations.map((location, index) => (
        <Card key={`${location.name}-${location.day}-${index}`} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                  location.type === 'principal' ? 'bg-blue-500' : 'bg-orange-500'
                }`}
              >
                {location.type === 'principal' ? location.day : '•'}
              </div>
              <h4 className="font-semibold">{location.name}</h4>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  location.type === 'principal'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {location.type}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{location.journalEntry.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {location.journalEntry.date} - {location.journalEntry.mood}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
