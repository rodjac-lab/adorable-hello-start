import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ReadingRecommendation } from '@/store/contentStore';

const getRatingStars = (rating: number) => '⭐'.repeat(rating);

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    Autobiographie: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    'Guide culturel': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    Anthropologie: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    Gastronomie: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    'Beau livre': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
    Géopolitique: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return colors[type] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
};

interface ReadingCardProps {
  recommendation: ReadingRecommendation;
}

export const ReadingCard = ({ recommendation }: ReadingCardProps) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{recommendation.title}</CardTitle>
            <CardDescription className="text-lg font-medium">
              par {recommendation.author}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2 ml-4">
            <Badge className={getTypeColor(recommendation.type)}>{recommendation.type}</Badge>
            <div className="text-lg">{getRatingStars(recommendation.rating)}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-muted-foreground">{recommendation.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Pourquoi je le recommande</h4>
            <p className="text-muted-foreground italic">"{recommendation.why}"</p>
          </div>
          <div className="pt-2">
            <Button className="w-full sm:w-auto" onClick={() => window.open(recommendation.amazon, '_blank')}>
              📖 Voir sur Amazon
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
