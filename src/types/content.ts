export type ContentSource = 'canonical' | 'custom';

export interface FoodExperience {
  id: string;
  name: string;
  type: string;
  description: string;
  experience: string;
  rating: number;
  location: string;
  price: string;
}

export interface ReadingRecommendation {
  id: string;
  title: string;
  author: string;
  type: string;
  description: string;
  why: string;
  amazon: string;
  rating: number;
}

export interface PlaceReference {
  day: number;
  name: string;
  summary: string;
  coordinates: [number, number];
}
