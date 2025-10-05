import type { PlaceReference as BasePlaceReference } from '@/types/content';

export type PlaceReference = BasePlaceReference;

export const placeReferences: PlaceReference[] = [
  {
    day: 1,
    name: 'Amman',
    summary: 'Capitale du royaume hachémite, point de départ et de retour du voyage.',
    coordinates: [31.9539, 35.9106],
  },
  {
    day: 2,
    name: 'Jerash',
    summary: 'Cité gréco-romaine remarquablement conservée, joyau du nord jordanien.',
    coordinates: [32.2811, 35.8998],
  },
  {
    day: 2,
    name: 'Ajloun',
    summary: 'Forteresse ayyoubide veillant sur les vallées verdoyantes et les oliveraies.',
    coordinates: [32.3326, 35.7519],
  },
];

export const getPlaceReferences = (): PlaceReference[] => [...placeReferences];
