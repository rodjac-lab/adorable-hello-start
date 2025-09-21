import type { JournalEntry } from '@/lib/journalStorage';

export type ContentStatus = 'draft' | 'published';

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

export interface FoodContentState {
  experiences: FoodExperience[];
  status: ContentStatus;
  isLoading: boolean;
  error: string | null;
}

export interface ReadingContentState {
  recommendations: ReadingRecommendation[];
  status: ContentStatus;
  isLoading: boolean;
  error: string | null;
}

export interface MapContentState {
  entries: JournalEntry[];
  status: ContentStatus;
  isLoading: boolean;
  error: string | null;
}

export interface StudioState {
  isEditing: boolean;
}

export interface ContentState {
  studio: StudioState;
  food: FoodContentState;
  reading: ReadingContentState;
  map: MapContentState;
}

type ContentListener = () => void;

const createDefaultFoodExperiences = (): FoodExperience[] => [
  {
    id: 'mansaf',
    name: 'Mansaf',
    type: 'Plat national',
    description:
      "Le plat emblématique jordanien : agneau cuit dans une sauce au yaourt fermenté (jameed), servi sur un lit de riz et mangé traditionnellement avec les mains.",
    experience:
      "Partagé lors d'un déjeuner familial à Amman. L'expérience était autant sociale que gustative - toute la famille mange dans le même plat, créant une intimité particulière.",
    rating: 5,
    location: 'Restaurant familial, Amman',
    price: 'Modéré',
  },
  {
    id: 'falafel-houmous',
    name: 'Falafel et Houmous',
    type: 'Street food',
    description:
      'Boulettes de pois chiches frites servies avec houmous crémeux, tahini, et légumes frais dans du pain pita chaud.',
    experience:
      "Découvert dans une petite échoppe près du théâtre romain. Le propriétaire m'a expliqué ses secrets : pois chiches trempés 24h et épices moulues chaque matin.",
    rating: 4,
    location: 'Downtown Amman',
    price: 'Très abordable',
  },
  {
    id: 'knafeh',
    name: 'Knafeh',
    type: 'Dessert',
    description:
      "Dessert traditionnel au fromage fondu recouvert de cheveux d'ange (kataifi) et arrosé de sirop parfumé à l'eau de rose.",
    experience:
      "Une révélation ! La version de Nablus dégustée à Amman était parfaite : croquant du dessus, fondant à l'intérieur. Un équilibre sucré-salé surprenant.",
    rating: 5,
    location: 'Pâtisserie Al-Aker, Amman',
    price: 'Abordable',
  },
  {
    id: 'mint-tea-arabic-coffee',
    name: 'Thé à la menthe et café arabe',
    type: 'Boissons',
    description:
      'Thé noir parfumé à la menthe fraîche et café arabe (qahwa) parfumé à la cardamome, servis dans de petits verres.',
    experience:
      "Rituel quotidien dans chaque lieu visité. Le thé accompagne chaque conversation, chaque pause. Le café arabe, plus corsé, ponctue les moments importants.",
    rating: 4,
    location: 'Partout',
    price: 'Très abordable',
  },
];

const createDefaultReadingRecommendations = (): ReadingRecommendation[] => [
  {
    id: 'lawrence-arabie',
    title: "Lawrence d'Arabie",
    author: 'T.E. Lawrence',
    type: 'Autobiographie',
    description:
      "Le récit captivant de l'officier britannique qui a vécu la révolte arabe de 1916-1918. Une plongée dans l'histoire du Moyen-Orient moderne.",
    why: "Indispensable pour comprendre l'histoire moderne de la région et l'émergence de la Jordanie moderne sous l'émir Abdullah.",
    amazon: 'https://amazon.fr/...',
    rating: 5,
  },
  {
    id: 'petra-merveille',
    title: 'Pétra : Merveille du monde',
    author: 'Jane Taylor',
    type: 'Guide culturel',
    description:
      "Guide complet sur l'histoire, l'archéologie et l'art nabatéen de Pétra. Avec de magnifiques photographies et plans détaillés.",
    why: "Le guide de référence pour comprendre l'ingéniosité nabatéenne et l'importance historique du site.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
  {
    id: 'bedouins-jordanie',
    title: 'Les Bédouins de Jordanie',
    author: 'Shelagh Weir',
    type: 'Anthropologie',
    description:
      'Étude approfondie de la culture bédouine traditionnelle, ses traditions, son artisanat et son mode de vie.',
    why: "Pour découvrir l'âme nomade de la Jordanie et comprendre l'hospitalité légendaire de ses habitants.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
  {
    id: 'cuisine-moyen-orient',
    title: 'Cuisine du Moyen-Orient',
    author: 'Claudia Roden',
    type: 'Gastronomie',
    description:
      'Bible de la cuisine moyen-orientale avec des recettes authentiques jordaniennes, palestiniennes et syriennes.',
    why: 'Pour reproduire chez soi les saveurs découvertes et prolonger le voyage culinaire.',
    amazon: 'https://amazon.fr/...',
    rating: 5,
  },
  {
    id: 'jordanie-land',
    title: 'Jordan: A Timeless Land',
    author: 'Mohamed El-Khoury',
    type: 'Beau livre',
    description:
      'Superbe livre photographique qui capture la beauté des paysages jordaniens, de Pétra au Wadi Rum.',
    why: 'Pour revivre visuellement la magie des paysages jordaniens et partager la beauté du pays.',
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
  {
    id: 'royaume-hachemite',
    title: 'Le Royaume hachémite de Jordanie',
    author: 'Philippe Droz-Vincent',
    type: 'Géopolitique',
    description:
      'Analyse politique et sociale de la Jordanie contemporaine, son rôle régional et ses défis.',
    why: "Pour comprendre les enjeux actuels du royaume et son importance stratégique au Moyen-Orient.",
    amazon: 'https://amazon.fr/...',
    rating: 4,
  },
];

const createInitialState = (): ContentState => ({
  studio: {
    isEditing: false,
  },
  food: {
    experiences: createDefaultFoodExperiences(),
    status: 'published',
    isLoading: false,
    error: null,
  },
  reading: {
    recommendations: createDefaultReadingRecommendations(),
    status: 'published',
    isLoading: false,
    error: null,
  },
  map: {
    entries: [],
    status: 'published',
    isLoading: false,
    error: null,
  },
});

let state: ContentState = createInitialState();
const listeners = new Set<ContentListener>();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const shallowEqual = <T extends Record<string, unknown>>(a: T, b: T) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
};

export const contentStore = {
  subscribe(listener: ContentListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): ContentState {
    return state;
  },
  setState(partial: Partial<ContentState>) {
    state = { ...state, ...partial };
    notify();
  },
  updateFood(partial: Partial<FoodContentState>) {
    const next = { ...state.food, ...partial };
    if (shallowEqual(state.food, next)) {
      return;
    }
    state = { ...state, food: next };
    notify();
  },
  updateReading(partial: Partial<ReadingContentState>) {
    const next = { ...state.reading, ...partial };
    if (shallowEqual(state.reading, next)) {
      return;
    }
    state = { ...state, reading: next };
    notify();
  },
  updateMap(partial: Partial<MapContentState>) {
    const next = { ...state.map, ...partial };
    if (shallowEqual(state.map, next)) {
      return;
    }
    state = { ...state, map: next };
    notify();
  },
  setStudioEditing(isEditing: boolean) {
    if (state.studio.isEditing === isEditing) {
      return;
    }
    state = { ...state, studio: { ...state.studio, isEditing } };
    notify();
  },
  reset() {
    state = createInitialState();
    notify();
  },
};

export type { ContentListener };
export { createInitialState };
