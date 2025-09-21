import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FoodExperience } from '@/store/contentStore';

const getRatingStars = (rating: number) => '⭐'.repeat(rating);

const getPriceColor = (price: string) => {
  switch (price) {
    case 'Très abordable':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'Abordable':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'Modéré':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
  }
};

interface FoodExperienceCardProps {
  experience: FoodExperience;
}

export const FoodExperienceCard = ({ experience }: FoodExperienceCardProps) => {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div>
            <CardTitle className="text-2xl mb-2">{experience.name}</CardTitle>
            <CardDescription className="text-lg">{experience.location}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline">{experience.type}</Badge>
            <Badge className={getPriceColor(experience.price)}>{experience.price}</Badge>
          </div>
        </div>
        <div className="text-2xl">{getRatingStars(experience.rating)}</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-muted-foreground">{experience.description}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Mon expérience</h4>
            <p className="text-muted-foreground italic">"{experience.experience}"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
